import { DEFAULT_BUTTON_TEXTS } from './config';

const WEBVIEW_GUARD_SELECTOR = '.react-app-container, [data-vscode-context]';

function buildDetectorScript(allButtonTexts: string[], excludedTexts: string[], enableAutoScroll: boolean): string {
    const textsJson = JSON.stringify(allButtonTexts.map((t) => t.toLowerCase()));
    const excludedJson = JSON.stringify(excludedTexts.map((t) => t.toLowerCase()));
    return `
(function() {
    var BUTTON_TEXTS = ${textsJson};
    var EXCLUDE_TEXTS = ${excludedJson};

    // ELIMINADO: Guardia de panel restrictivo. Escaneamos todos los webviews.

    if (${enableAutoScroll}) {
        try {
            var scrollables = document.querySelectorAll('.react-app-container, [data-agent-panel], .chat-list-container, .monaco-scrollable-element, [class*="content"], [class*="log"], [class*="output"]');
            scrollables.forEach(function(el) {
                if (el.scrollHeight > el.clientHeight && el.clientHeight > 40) {
                    if (!el.dataset.autoScrollListener) {
                        el.dataset.autoScrollListener = "true";
                        el.addEventListener('scroll', function() {
                            var isAtBottom = (el.scrollHeight - el.scrollTop - el.clientHeight) < 50;
                            el.dataset.userScrolledUp = isAtBottom ? "false" : "true";
                        }, { passive: true });
                    }
                    if (el.dataset.userScrolledUp !== "true") {
                        el.scrollTo({ top: el.scrollHeight, behavior: 'auto' });
                    }
                }
            });
        } catch(e) {}
    }

    // Detección V10: Super-Lax + Iframes + Shadow + Diagnosis
    function scan(root: Node | ShadowRoot | Document, depth: number): any {
        if (depth > 15) return null;
        var nodes = [];
        if (root instanceof Document) {
            nodes = (root.body || root.documentElement).querySelectorAll('*');
        } else {
            nodes = (root as HTMLElement).querySelectorAll('*');
        }

        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i] as HTMLElement;
            
            // 1. Shadow DOM recursivo
            if (node.shadowRoot) {
                var res = scan(node.shadowRoot, depth + 1);
                if (res) return res;
            }

            // 2. Iframe recursivo
            if (node.tagName && (node.tagName.toLowerCase() === 'iframe' || node.tagName.toLowerCase() === 'frame')) {
                try {
                    var doc = (node as HTMLIFrameElement).contentDocument || (node as HTMLIFrameElement).contentWindow?.document;
                    if (doc) {
                        var res = scan(doc, depth + 1);
                        if (res) return res;
                    }
                } catch(e) {}
            }

            // 3. Evaluar Botón
            var tag = node.tagName ? node.tagName.toLowerCase() : '';
            var style = window.getComputedStyle(node);
            var isBtn = tag === 'button' || tag === 'vscode-button' || tag === 'a' || 
                       (node.getAttribute('role') || '').toLowerCase().includes('button') || 
                       style.cursor === 'pointer';

            if (isBtn) {
                var text = (node.textContent || '').trim().toLowerCase();
                var label = (node.getAttribute('aria-label') || '').toLowerCase();
                var title = (node.getAttribute('title') || '').toLowerCase();
                var combined = text + ' ' + label + ' ' + title;

                if (combined.trim()) {
                    var isMatch = BUTTON_TEXTS.some(function(bt) {
                        return combined.indexOf(bt) !== -1;
                    });

                    if (isMatch) {
                        var isExcluded = EXCLUDE_TEXTS.some(function(et) {
                            return combined.indexOf(et) !== -1;
                        });

                        if (isExcluded) {
                            // console.log("Botón detectado pero EXCLUIDO por seguridad: " + combined);
                            continue;
                        }

                        var visible = !!(node.offsetWidth || node.offsetHeight || node.getClientRects().length);
                        if (visible && style.display !== 'none' && style.visibility !== 'hidden') {
                            node.click();
                            node.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                            node.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                            return { clicked: true, text: combined };
                        }
                    }
                }
            }
        }
        return null;
    }

    var result = scan(document, 0);
    return result || { clicked: false, scanned: true };
})();
`;
}

export function buildDetectorScriptWithCustomTexts(customTexts: string[], excludedTexts: string[], enableAutoScroll: boolean): string {
    const allTexts = [...DEFAULT_BUTTON_TEXTS, ...customTexts];
    return buildDetectorScript(allTexts, excludedTexts, enableAutoScroll);
}
