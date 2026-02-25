import * as http from 'http';
import WebSocket = require('ws');

export interface CdpTarget {
    id: string;
    type: string;
    url: string;
    webSocketDebuggerUrl: string;
    title: string;
}

export class CdpClient {
    private port: number;
    private outputLog: (msg: string) => void;

    constructor(port: number, outputLog: (msg: string) => void) {
        this.port = port;
        this.outputLog = outputLog;
    }

    async isPortOpen(): Promise<boolean> {
        return new Promise((resolve) => {
            const req = http.get(
                { host: '127.0.0.1', port: this.port, path: '/json', timeout: 1500 },
                (res) => {
                    resolve(res.statusCode === 200);
                    res.resume();
                }
            );
            req.on('error', () => resolve(false));
            req.on('timeout', () => {
                req.destroy();
                resolve(false);
            });
        });
    }

    private async getTargets(): Promise<CdpTarget[]> {
        return new Promise((resolve, reject) => {
            const req = http.get(
                { host: '127.0.0.1', port: this.port, path: '/json', timeout: 2000 },
                (res) => {
                    let data = '';
                    res.on('data', (chunk) => (data += chunk));
                    res.on('end', () => {
                        try {
                            resolve(JSON.parse(data) as CdpTarget[]);
                        } catch {
                            resolve([]);
                        }
                    });
                }
            );
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                resolve([]);
            });
        });
    }

    async evaluateOnAgentTargets(script: string): Promise<any[]> {
        const targets = await this.getTargets();
        const results: any[] = [];
        this.outputLog(`[CDP] Escaneando cada uno de los ${targets.length} targets encontrados...`);

        for (const target of targets) {
            if (!target.webSocketDebuggerUrl) continue;
            try {
                const res = await this.evaluateOnTarget(target.webSocketDebuggerUrl, script);
                if (res) {
                    res.title = target.title;
                    res.url = target.url;
                    results.push(res);
                }
            } catch (e) {
                // Ignore target errors
            }
        }
        return results;
    }

    private evaluateOnTarget(wsUrl: string, script: string): Promise<any> {
        return new Promise((resolve) => {
            const ws = new WebSocket(wsUrl);
            let resolved = false;
            const done = (val: any) => {
                if (!resolved) {
                    resolved = true;
                    try { ws.close(); } catch { }
                    resolve(val);
                }
            };

            const timeout = setTimeout(() => done(false), 3000);

            ws.on('open', () => {
                ws.send(JSON.stringify({
                    id: 1,
                    method: 'Runtime.evaluate',
                    params: {
                        expression: script,
                        returnByValue: true,
                        awaitPromise: false,
                    },
                }));
            });

            ws.on('message', (data: Buffer | string) => {
                clearTimeout(timeout);
                try {
                    const msg = JSON.parse(data.toString());
                    if (msg.id === 1) {
                        const val = msg.result?.result?.value;
                        done(val);
                    }
                } catch {
                    done(false);
                }
            });

            ws.on('error', () => {
                clearTimeout(timeout);
                done(false);
            });
        });
    }
}
