/** @jest-environment jsdom */

jest.mock('vscode', () => ({
    workspace: { getConfiguration: () => ({ get: (k, d) => d }) }
}), { virtual: true });

const { buildDetectorScriptWithCustomTexts } = require('../../out/buttonDetector');

describe('Full VS Code UI Detection Suite', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    const runDetector = () => {
        const script = buildDetectorScriptWithCustomTexts([], []);
        return eval(script);
    }

    test('Case 4: Realistic VS Code structure (Icon span + Text span)', () => {
        const btn = document.createElement('button');
        // Un botón real de VS Code suele tener un span para el icono y otro para el label
        const iconSpan = document.createElement('span');
        iconSpan.className = 'codicon codicon-check'; // Los codicons no tienen textContent
        const labelSpan = document.createElement('span');
        labelSpan.textContent = 'Apply edits';
        
        btn.appendChild(iconSpan);
        btn.appendChild(labelSpan);
        btn.getBoundingClientRect = () => ({ x: 10, y: 10, width: 50, height: 20 });
        document.body.appendChild(btn);
        
        const result = runDetector();
        expect(result.clicked).toBe(true);
        expect(result.text).toBe('apply edits');
    });

    // ... los otros tests siguen pasando y se mantienen
    test('Regression check: Simple "Accept all" visible button', () => {
        const btn = document.createElement('button');
        btn.textContent = 'Accept all';
        btn.getBoundingClientRect = () => ({ x: 10, y: 10, width: 50, height: 20 });
        document.body.appendChild(btn);
        expect(runDetector().clicked).toBe(true);
    });
});
