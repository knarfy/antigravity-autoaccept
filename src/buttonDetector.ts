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
            // Only scroll the specific agent containers. Avoid '.monaco-scrollable-element' as it affects all code editors!
            var scrollables = document.querySelectorAll('.react-app-container, [data-agent-panel], .chat-list-container');
            scrollables.forEach(function(el) {
                if (el.scrollHeight > el.clientHeight && el.clientHeight > 100) {
                    el.scrollTo({
                        top: el.scrollHeight,
                        behavior: 'smooth'
                    });
                }
            });
            
            // Only scroll the global window if we are NOT in the main VS Code workbench
            if (!document.querySelector('.monaco-workbench')) {
                window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: 'smooth'
                });
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
