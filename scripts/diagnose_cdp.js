const http = require('http');
const WebSocket = require('ws');

function getTargets() {
    return new Promise((resolve) => {
        http.get({ host: '127.0.0.1', port: 9222, path: '/json' }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(JSON.parse(data)));
        });
    });
}

function evalOnTarget(wsUrl, script) {
    return new Promise((resolve) => {
        const ws = new WebSocket(wsUrl);
        let done = false;
        const finish = (v) => { if (!done) { done = true; try { ws.close(); } catch { } resolve(v); } };
        setTimeout(() => finish({ error: 'timeout' }), 5000);
        ws.on('open', () => ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: script, returnByValue: true } })));
        ws.on('message', (d) => {
            const msg = JSON.parse(d.toString());
            if (msg.id === 1) finish(msg.result?.result?.value ?? msg.result?.exceptionDetails?.text);
        });
        ws.on('error', (e) => finish({ error: e.message }));
    });
}

const DIAG_SCRIPT = `
(function() {
    var found = [];
    function scan(root, depth) {
        if (depth > 10) return;
        try {
            var all = root.querySelectorAll('*');
            for (var i = 0; i < all.length; i++) {
                var el = all[i];
                if (el.shadowRoot) scan(el.shadowRoot, depth + 1);
                var text = (el.textContent || '').trim().toLowerCase();
                if (text.length > 0 && text.length < 50) {
                    if (text === 'accept all' || text === 'run' || text === 'always run') {
                        var rect = el.getBoundingClientRect();
                        found.push({
                            tag: el.tagName, text: text,
                            w: Math.round(rect.width), h: Math.round(rect.height),
                            x: Math.round(rect.x), y: Math.round(rect.y),
                            class: (el.getAttribute('class') || '').substring(0, 60),
                            depth: depth
                        });
                        // Intentar click
                        if (rect.width > 0 && rect.height > 0) {
                            try {
                                el.dispatchEvent(new MouseEvent('mousedown', {bubbles:true, cancelable:true}));
                                el.dispatchEvent(new MouseEvent('mouseup', {bubbles:true, cancelable:true}));
                                el.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true}));
                                el.click();
                                found[found.length-1].clicked = true;
                            } catch(ce) { found[found.length-1].clickError = ce.message; }
                        }
                    }
                }
            }
        } catch(e) { found.push({error: e.message, depth: depth}); }
    }
    scan(document, 0);
    return { url: window.location.href.substring(0, 60), results: found };
})()
`;

async function run() {
    const targets = await getTargets();
    console.log(`\n=== ${targets.length} targets encontrados ===\n`);

    for (const t of targets) {
        if (!t.webSocketDebuggerUrl) continue;
        console.log(`\n--- Target: ${t.type} | ${t.title?.substring(0, 60)} ---`);
        const result = await evalOnTarget(t.webSocketDebuggerUrl, DIAG_SCRIPT);
        if (result && result.buttons) {
            console.log(`URL: ${result.url}`);
            console.log(`Botones encontrados: ${result.count}`);
            result.buttons.forEach(b => {
                console.log(`  [${b.tag}] "${b.text}" | class: ${b.class} | ${b.w}x${b.h} | role: ${b.role}`);
            });
        } else {
            console.log('  → Sin resultado:', JSON.stringify(result).substring(0, 100));
        }
    }
}

run().catch(console.error);
