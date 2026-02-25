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

    // Detección V6: Recursión en Shadow DOM
    function findAndClick(root: Node | ShadowRoot): any {
        var children = root instanceof HTMLElement || root instanceof ShadowRoot ? root.children : [];
        for (var i = 0; i < children.length; i++) {
            var node = children[i] as HTMLElement;
            
            // 1. Explorar Shadow DOM si existe
            if (node.shadowRoot) {
                var res = findAndClick(node.shadowRoot);
                if (res) return res;
            }

            // 2. Comprobar si es un elemento interactivo
            var style = window.getComputedStyle(node);
            var tag = node.tagName.toLowerCase();
            var role = (node.getAttribute('role') || '').toLowerCase();
            var className = (node.getAttribute('class') || '').toLowerCase();
            
            var isClickable = tag === 'button' || tag === 'a' || tag === 'vscode-button' || 
                             role.includes('button') || className.includes('button') || 
                             className.includes('btn') || style.cursor === 'pointer';

            if (isClickable) {
                var text = (node.textContent || '').trim().toLowerCase();
                if (text) {
                    var isExcluded = EXCLUDE_TEXTS.some(function(et) { return text.includes(et); });
                    if (!isExcluded) {
                        // Limpieza V5 mejorada: detectamos palabras completas
                        var cleanText = text.replace(/[^a-z0-9]/g, ' ');
                        var words = cleanText.split(/\s+/);
                        
                        var isMatch = BUTTON_TEXTS.some(function(bt) {
                            if (bt.indexOf(' ') !== -1) return cleanText.indexOf(bt) !== -1;
                            return words.indexOf(bt) !== -1;
                        });

                        if (isMatch) {
                            var isVisible = !!(node.offsetWidth || node.offsetHeight || node.getClientRects().length);
                            if (isVisible && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
                                node.click();
                                return { clicked: true, text: text };
                            }
                        }
                    }
                }
            }

            // 3. Recursión normal
            var deepRes = findAndClick(node);
            if (deepRes) return deepRes;
        }
        return null;
    }

    var result = findAndClick(document.body);
    return result || { clicked: false };
})();
`;
}

export function buildDetectorScriptWithCustomTexts(customTexts: string[], excludedTexts: string[], enableAutoScroll: boolean): string {
    const allTexts = [...DEFAULT_BUTTON_TEXTS, ...customTexts];
    return buildDetectorScript(allTexts, excludedTexts, enableAutoScroll);
}
