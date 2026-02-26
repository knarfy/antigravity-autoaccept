import { DEFAULT_BUTTON_TEXTS } from './config';

function buildDetectorScript(allButtonTexts: string[], excludedTexts: string[]): string {
    const textsJson = JSON.stringify(allButtonTexts.map((t) => t.toLowerCase()));
    const excludedJson = JSON.stringify(excludedTexts.map((t) => t.toLowerCase()));
    return `
(function() {
    var BUTTON_TEXTS = ${textsJson};
    var EXCLUDE_TEXTS = ${excludedJson};

    function checkButton(node) {
        if (!node || !node.tagName) { return null; }

        var tag = node.tagName.toUpperCase();
        var role = (node.getAttribute && node.getAttribute('role')) || '';
        var cls = (node.className || '').toString().toLowerCase();

        // SOLO elementos interactivos: button, a, role=button, o spans con cursor-pointer
        var isInteractive = (tag === 'BUTTON' || tag === 'A' || role === 'button' ||
                            (tag === 'SPAN' && cls.indexOf('cursor-pointer') !== -1));
        if (!isInteractive) { return null; }

        var text = (node.textContent || '').trim().toLowerCase();
        if (!text || text.length > 50) { return null; }

        // Excluir menubar
        if (role === 'menuitem' || role === 'menubar') { return null; }
        if (cls.indexOf('menubar') !== -1 || cls.indexOf('menu-title') !== -1) { return null; }

        // Excluir dropdowns/expanders (always run es un dropdown, no un botón de acción)
        if (text === 'always run' || text === 'ejecutar siempre') { return null; }

        // Match con keyword?
        var isMatch = BUTTON_TEXTS.some(function(bt) {
            return text === bt || text.startsWith(bt + ' ') || text.startsWith(bt + '\\n') ||
                   (text.startsWith(bt) && text.length < bt.length + 15);
        });
        if (!isMatch) { return null; }

        // ¿Excluido?
        var isExcluded = EXCLUDE_TEXTS.some(function(et) {
            return text.includes(et);
        });
        if (isExcluded) { return null; }

        // Preferir hijo interactivo con mismo texto
        if (node.querySelectorAll) {
            var children = node.querySelectorAll('button, a, span, [role="button"]');
            for (var c = 0; c < children.length; c++) {
                if ((children[c].textContent || '').trim().toLowerCase() === text) {
                    return null;
                }
            }
        }

        // Visible? (No necesariamente en el viewport aún, pero que tenga dimensiones)
        var rect = node.getBoundingClientRect ? node.getBoundingClientRect() : {width:0, height:0};
        if (rect.width === 0 && rect.height === 0) { return null; }

        return node;
    }

    function searchButtons(root) {
        var all = root.querySelectorAll('button, a, [role="button"], span.cursor-pointer, span[class*="cursor-pointer"]');
        for (var i = 0; i < all.length; i++) {
            var el = all[i];
            if (el.shadowRoot) {
                var res = searchButtons(el.shadowRoot);
                if (res) return res;
            }
            var match = checkButton(el);
            if (match) return match;
        }
        var allEls = root.querySelectorAll('*');
        for (var j = 0; j < allEls.length; j++) {
            if (allEls[j].shadowRoot) {
                var res2 = searchButtons(allEls[j].shadowRoot);
                if (res2) return res2;
            }
        }
        return null;
    }

    var textContent = document.body.textContent || "";
    var isStuck = textContent.includes("termination request to command") || 
                  textContent.includes("solicitud de terminaci\u00f3n");

    var found = searchButtons(document);
    if (found) {
        if (found.scrollIntoView) {
            found.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
        }
        
        var rect = found.getBoundingClientRect();
        var cx = Math.round(rect.x + rect.width / 2);
        var cy = Math.round(rect.y + rect.height / 2);
        return { clicked: true, text: (found.textContent || '').trim().toLowerCase(), x: cx, y: cy, isStuck: isStuck };
    }
    return { clicked: false, isStuck: isStuck };
})();
`;
}

export function buildDetectorScriptWithCustomTexts(customTexts: string[], excludedTexts: string[]): string {
    const allTexts = [...DEFAULT_BUTTON_TEXTS, ...customTexts];
    return buildDetectorScript(allTexts, excludedTexts);
}
