import { DEFAULT_BUTTON_TEXTS } from './config';

const WEBVIEW_GUARD_SELECTOR = '.react-app-container, [data-vscode-context]';

function buildDetectorScript(allButtonTexts: string[], excludedTexts: string[], enableAutoScroll: boolean): string {
    const textsJson = JSON.stringify(allButtonTexts.map((t) => t.toLowerCase()));
    const excludedJson = JSON.stringify(excludedTexts.map((t) => t.toLowerCase()));
    return `
(function() {
    var BUTTON_TEXTS = ${textsJson};
    var EXCLUDE_TEXTS = ${excludedJson};

    var hasAgentPanel = !!(
        document.querySelector('.react-app-container') ||
        document.querySelector('[data-agent-panel]') ||
        document.querySelector('[class*="agent"]') ||
        document.querySelector('[class*="chat"]')
    );
    if (!hasAgentPanel) { return false; }

    if (${enableAutoScroll}) {
        try {
            // Amplio selector para pillar contenedores principales y bloques internos (logs, terminales, visores markdown)
            var scrollables = document.querySelectorAll('.react-app-container, [data-agent-panel], .chat-list-container, .monaco-scrollable-element, [class*="content"], [class*="log"], [class*="output"]');
            
            scrollables.forEach(function(el) {
                // Solo si el elemento es realmente scrollable y tiene cierta altura mínima
                if (el.scrollHeight > el.clientHeight && el.clientHeight > 40) {
                    
                    // Inicializar el listener de scroll para "Sticky Scroll" (si el usuario sube, pausamos autoscroll)
                    if (!el.dataset.autoScrollListener) {
                        el.dataset.autoScrollListener = "true";
                        el.addEventListener('scroll', function() {
                            // Estamos "abajo" si la distancia al fondo es menor a 25 píxeles
                            var isAtBottom = (el.scrollHeight - el.scrollTop - el.clientHeight) < 25;
                            el.dataset.userScrolledUp = isAtBottom ? "false" : "true";
                        }, { passive: true });
                    }

                    // Si el usuario no ha subido a mano, forzamos scroll hasta el fondo
                    if (el.dataset.userScrolledUp !== "true") {
                        el.scrollTo({
                            top: el.scrollHeight,
                            behavior: 'smooth'
                        });
                    }
                }
            });
            
            // Lógica similar para el scroll principal de la ventana (solo si no es el VS Code workbench principal)
            if (!document.querySelector('.monaco-workbench')) {
                if (!document.documentElement.dataset.autoScrollListener) {
                    document.documentElement.dataset.autoScrollListener = "true";
                    window.addEventListener('scroll', function() {
                        var doc = document.documentElement;
                        var isAtBottom = (doc.scrollHeight - window.scrollY - window.innerHeight) < 25;
                        doc.dataset.userScrolledUp = isAtBottom ? "false" : "true";
                    }, { passive: true });
                }

                if (document.documentElement.dataset.userScrolledUp !== "true") {
                    window.scrollTo({
                        top: document.body.scrollHeight,
                        behavior: 'smooth'
                    });
                }
            }
        } catch(e) {}
    }

    var clicked = false;
    var walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_ELEMENT,
        null
    );

    while (walker.nextNode()) {
        var node = walker.currentNode;
        if (!(node instanceof HTMLElement)) { continue; }
        var tag = node.tagName.toLowerCase();
        var role = (node.getAttribute('role') || '').toLowerCase();
        var className = (node.getAttribute('class') || '').toLowerCase();
        var isButton = tag === 'button' || tag === 'a' || tag === 'vscode-button' || role.includes('button') || className.includes('button') || className.includes('btn');

        if (!isButton) {
            continue;
        }
        var text = (node.textContent || '').trim().toLowerCase();
        if (!text) { continue; }

        var isExcluded = EXCLUDE_TEXTS.some(function(et) {
            return text === et || text.startsWith(et + ' ');
        });
        if (isExcluded) {
            continue;
        }

        var isMatch = BUTTON_TEXTS.some(function(bt) {
            return text.startsWith(bt) || text === bt;
        });
        if (!isMatch) { continue; }

        var isVisible = !!(
            node.offsetWidth ||
            node.offsetHeight ||
            node.getClientRects().length
        );
        if (!isVisible) { continue; }

        var style = window.getComputedStyle(node);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            continue;
        }

        node.click();
        clicked = true;
    }
    return clicked;
})();
`;
}

export function buildDetectorScriptWithCustomTexts(customTexts: string[], excludedTexts: string[], enableAutoScroll: boolean): string {
    const allTexts = [...DEFAULT_BUTTON_TEXTS, ...customTexts];
    return buildDetectorScript(allTexts, excludedTexts, enableAutoScroll);
}
