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

        for (const target of targets) {
            // Ampliamos el filtro: Antigravity usa 'page' e 'iframe' para sus paneles internos
            const isRelevant = target.type === 'webview' || target.type === 'page' || target.type === 'iframe';
            if (!target.webSocketDebuggerUrl || !isRelevant) {
                continue;
            }
            try {
                const result = await this.evaluateOnTarget(target.webSocketDebuggerUrl, script);
                // Si el script encontró un botón con coordenadas, hacer clic físico via CDP
                if (result && result.clicked && typeof result.x === 'number' && result.x > 0) {
                    await this.sendPhysicalClick(target.webSocketDebuggerUrl, result.x, result.y);
                }
                results.push(result);
            } catch (e) {
                this.outputLog(`[CDP] Error en target ${target.id}: ${e}`);
            }
        }
        return results;
    }

    private sendPhysicalClick(wsUrl: string, x: number, y: number): Promise<void> {
        return new Promise((resolve) => {
            const ws = new WebSocket(wsUrl);
            let step = 0;
            const sendNext = () => {
                step++;
                if (step === 1) {
                    ws.send(JSON.stringify({ id: 10, method: 'Input.dispatchMouseEvent', params: { type: 'mousePressed', x, y, button: 'left', clickCount: 1 } }));
                } else if (step === 2) {
                    ws.send(JSON.stringify({ id: 11, method: 'Input.dispatchMouseEvent', params: { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 } }));
                } else {
                    try { ws.close(); } catch { }
                    resolve();
                }
            };
            ws.on('open', () => sendNext());
            ws.on('message', () => sendNext());
            ws.on('error', () => { try { ws.close(); } catch { } resolve(); });
            setTimeout(() => { try { ws.close(); } catch { } resolve(); }, 2000);
        });
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

            const timeout = setTimeout(() => done(null), 3000);

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
                        // Devolver el valor real, no convertir a boolean
                        done(msg.result?.result?.value ?? null);
                    }
                } catch {
                    done(null);
                }
            });

            ws.on('error', () => {
                clearTimeout(timeout);
                done(null);
            });
        });
    }
}
