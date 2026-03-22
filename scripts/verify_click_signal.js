const WebSocket = require('ws');
const http = require('http');
const { CdpClient } = require('../out/cdpClient');

async function runTest() {
    console.log('--- INICIANDO TEST DE SEÑAL CDP ---');
    
    // 1. Crear Servidor Mock CDP
    const wss = new WebSocket.Server({ port: 9223 });
    let receivedEvents = [];

    wss.on('connection', (ws) => {
        ws.on('message', (message) => {
            const msg = JSON.parse(message);
            //console.log('Recibido en Mock CDP:', msg.method);
            
            if (msg.method === 'Runtime.evaluate') {
                // Simular que el script de detección encuentra un botón
                ws.send(JSON.stringify({
                    id: msg.id,
                    result: { result: { value: { clicked: true, x: 100, y: 200, text: 'test button' } } }
                }));
            } else if (msg.method === 'Input.dispatchMouseEvent') {
                receivedEvents.push(msg.params.type);
                ws.send(JSON.stringify({ id: msg.id, result: {} }));
            }
        });
    });

    // 2. Mock de la lista de targets
    const httpServer = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify([
            {
                id: 'mock-target',
                type: 'webview',
                webSocketDebuggerUrl: 'ws://127.0.0.1:9223'
            }
        ]));
    });
    httpServer.listen(9224);

    // 3. Ejecutar Cliente con puerto 9224
    const client = new CdpClient(9224, (msg) => console.log(msg));
    
    console.log('Evaluando targets...');
    await client.evaluateOnAgentTargets('DetectorScript()');

    // 4. Verificar resultados
    console.log('\n--- RESULTADOS ---');
    console.log('Eventos de ratón recibidos:', receivedEvents);
    
    const success = receivedEvents.includes('mousePressed') && receivedEvents.includes('mouseReleased');
    if (success) {
        console.log('¡PRUEBA SUPERADA! La extensión envió los clics físicos (Down/Up) correctamente.');
    } else {
        console.error('FALLO: No se recibieron los eventos de clic esperados.');
    }

    // Limpieza
    wss.close();
    httpServer.close();
    process.exit(success ? 0 : 1);
}

runTest().catch(console.error);
