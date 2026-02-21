import { DEFAULT_BUTTON_TEXTS } from './config';

const WEBVIEW_GUARD_SELECTOR = '.react-app-container, [data-vscode-context]';

function buildDetectorScript(allButtonTexts: string[]): string {
    const textsJson = JSON.stringify(allButtonTexts.map((t) => t.toLowerCase()));
    return `
(function() {
    var BUTTON_TEXTS = ${textsJson};

    var hasAgentPanel = !!(
        document.querySelector('.react-app-container') ||
        document.querySelector('[data-agent-panel]') ||
        document.querySelector('[class*="agent"]') ||
        document.querySelector('[class*="chat"]')
    );
    if (!hasAgentPanel) { return false; }

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
        if (tag !== 'button' && tag !== 'a' && !node.getAttribute('role')?.includes('button')) {
            continue;
        }
        var text = (node.textContent || '').trim().toLowerCase();
        if (!text) { continue; }

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

export function buildDetectorScriptWithCustomTexts(customTexts: string[]): string {
    const allTexts = [...DEFAULT_BUTTON_TEXTS, ...customTexts];
    return buildDetectorScript(allTexts);
}
