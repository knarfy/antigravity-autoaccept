// Diagnóstico CDP: busca TODOS los botones/clickables en el target workbench
const http = require('http');
const WebSocket = require('ws');

const CDP_PORT = 9222;

async function getTargets() {
    return new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${CDP_PORT}/json`, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

async function evaluate(wsUrl, expression) {
    return new Promise((resolve) => {
        const ws = new WebSocket(wsUrl);
        const timeout = setTimeout(() => { try { ws.close(); } catch {} resolve(null); }, 5000);
        ws.on('open', () => {
            ws.send(JSON.stringify({
                id: 1,
                method: 'Runtime.evaluate',
                params: { expression, returnByValue: true, awaitPromise: false }
            }));
        });
        ws.on('message', data => {
            clearTimeout(timeout);
            const msg = JSON.parse(data.toString());
            if (msg.id === 1) {
                try { ws.close(); } catch {}
                resolve(msg.result?.result?.value ?? null);
            }
        });
        ws.on('error', () => { clearTimeout(timeout); resolve(null); });
    });
}

const SCAN_SCRIPT = `
(function() {
    var keywords = ['run', 'accept', 'accept all', 'always allow', 'allow', 'continue', 'save', 'apply', 'yes', 'ok'];
    var found = [];
    
    function scanNode(root, depth) {
        if (depth > 15) return;
        var all = root.querySelectorAll('button, [role="button"], a.monaco-button, .codicon-check, [class*="button"]');
        for (var i = 0; i < all.length; i++) {
            var el = all[i];
            var text = (el.textContent || '').trim().toLowerCase();
            if (text.length > 0 && text.length < 60) {
                var rect = el.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    found.push({
                        tag: el.tagName,
                        text: text.substring(0, 50),
                        classes: (el.className || '').toString().substring(0, 80),
                        visible: true,
                        w: Math.round(rect.width),
                        h: Math.round(rect.height),
                        x: Math.round(rect.x + rect.width/2),
                        y: Math.round(rect.y + rect.height/2),
                        match: keywords.some(function(k) { return text.includes(k); })
                    });
                }
            }
            if (el.shadowRoot) scanNode(el.shadowRoot, depth + 1);
        }
        // Also check iframes
        var iframes = root.querySelectorAll('iframe');
        for (var j = 0; j < iframes.length; j++) {
            try { scanNode(iframes[j].contentDocument, depth + 1); } catch(e) {}
        }
    }
    
    scanNode(document, 0);
    return { total: found.length, matches: found.filter(function(f) { return f.match; }), sample: found.slice(0, 10) };
})();
`;

(async () => {
    const targets = await getTargets();
    console.log('=== CDP TARGETS ===');
    for (const t of targets) {
        console.log(`  [${t.type}] "${t.title}" — ${t.url.substring(0, 60)}`);
    }
    console.log('');

    const pages = targets.filter(t => t.type === 'page' && t.webSocketDebuggerUrl);
    for (const page of pages) {
        console.log(`\n=== SCANNING: "${page.title}" ===`);
        const result = await evaluate(page.webSocketDebuggerUrl, SCAN_SCRIPT);
        if (result) {
            console.log(`  Total botones: ${result.total}`);
            console.log(`  Matches (keywords): ${result.matches.length}`);
            if (result.matches.length > 0) {
                for (const m of result.matches) {
                    console.log(`    ✅ MATCH: <${m.tag}> "${m.text}" [${m.w}x${m.h}] @(${m.x},${m.y})`);
                }
            }
            console.log('  Sample (first 10 buttons):');
            for (const s of result.sample) {
                console.log(`    ${s.match ? '✅' : '  '} <${s.tag}> "${s.text}" cls="${s.classes.substring(0,40)}"`);
            }
        } else {
            console.log('  (no result)');
        }
    }
})();
