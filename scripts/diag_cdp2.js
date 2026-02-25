// Diagnóstico CDP v2: muestra TODOS los botones de todos los targets
const http = require('http');
const WebSocket = require('ws');

async function getTargets() {
    return new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:9222/json', res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

async function evaluate(wsUrl, expression) {
    return new Promise((resolve) => {
        const ws = new WebSocket(wsUrl);
        const timeout = setTimeout(() => { try { ws.close(); } catch { } resolve(null); }, 5000);
        ws.on('open', () => {
            ws.send(JSON.stringify({
                id: 1, method: 'Runtime.evaluate',
                params: { expression, returnByValue: true, awaitPromise: false }
            }));
        });
        ws.on('message', data => {
            clearTimeout(timeout);
            const msg = JSON.parse(data.toString());
            if (msg.id === 1) { try { ws.close(); } catch { } resolve(msg.result?.result?.value ?? null); }
        });
        ws.on('error', () => { clearTimeout(timeout); resolve(null); });
    });
}

// Scan mucho mas amplio: cualquier elemento visible con texto corto
const SCAN_ALL = `
(function() {
    var found = [];
    function scan(root, depth) {
        if (depth > 20 || !root) return;
        try {
            var all = root.querySelectorAll('*');
            for (var i = 0; i < all.length; i++) {
                var el = all[i];
                if (el.shadowRoot) scan(el.shadowRoot, depth + 1);
                // Solo elementos clickables o con texto interesante
                var tag = el.tagName;
                var text = (el.textContent || '').trim().toLowerCase();
                if (text.length < 2 || text.length > 60) continue;
                // Filtrar por keywords que nos interesan
                if (text.indexOf('run') === -1 && text.indexOf('accept') === -1 && 
                    text.indexOf('reject') === -1 && text.indexOf('always') === -1 &&
                    text.indexOf('file') === -1 && text.indexOf('change') === -1) continue;
                var rect = el.getBoundingClientRect ? el.getBoundingClientRect() : {width:0,height:0,x:0,y:0};
                if (rect.width === 0 && rect.height === 0) continue;
                found.push({
                    tag: tag,
                    text: text.substring(0, 80),
                    cls: (el.className || '').toString().substring(0, 60),
                    role: el.getAttribute('role') || '',
                    w: Math.round(rect.width),
                    h: Math.round(rect.height),
                    x: Math.round(rect.x + rect.width/2),
                    y: Math.round(rect.y + rect.height/2)
                });
            }
            // Check iframes
            var iframes = root.querySelectorAll('iframe');
            for (var j = 0; j < iframes.length; j++) {
                try { scan(iframes[j].contentDocument, depth + 1); } catch(e) {}
            }
        } catch(e) {}
    }
    scan(document, 0);
    return found;
})();
`;

(async () => {
    const targets = await getTargets();
    const pages = targets.filter(t => t.type === 'page' && t.webSocketDebuggerUrl);
    for (const page of pages) {
        console.log(`\n=== "${page.title}" ===`);
        const result = await evaluate(page.webSocketDebuggerUrl, SCAN_ALL);
        if (result && result.length > 0) {
            for (const el of result) {
                console.log(`  <${el.tag}> role="${el.role}" text="${el.text}" cls="${el.cls}" [${el.w}x${el.h}] @(${el.x},${el.y})`);
            }
        } else {
            console.log('  (nada relevante)');
        }
    }
})();
