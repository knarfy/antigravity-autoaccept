// Mock de VS Code necesario para que los tests corran en Node.js
jest.mock('vscode', () => ({
    workspace: {
        getConfiguration: () => ({
            get: (key, defaultValue) => defaultValue
        })
    }
}), { virtual: true });

const { buildDetectorScriptWithCustomTexts } = require('../../out/buttonDetector');
const { DEFAULT_BUTTON_TEXTS } = require('../../out/config');

describe('ButtonDetector Script Generator (Stable JS)', () => {
    test('should generate a script containing all default button texts', () => {
        const script = buildDetectorScriptWithCustomTexts([], []);
        
        DEFAULT_BUTTON_TEXTS.forEach(text => {
            expect(script.toLowerCase()).toContain(text.toLowerCase());
        });
    });

    test('should include custom button texts', () => {
        const custom = ['mi_boton_especifico', 'CLICK AQUI'];
        const script = buildDetectorScriptWithCustomTexts(custom, []);
        
        custom.forEach(text => {
            expect(script.toLowerCase()).toContain(text.toLowerCase());
        });
    });

    test('should include excluded texts in forbidden list', () => {
        const excluded = ['confirmar', 'borrar todo'];
        const script = buildDetectorScriptWithCustomTexts([], excluded);
        
        excluded.forEach(text => {
            expect(script.toLowerCase()).toContain(text.toLowerCase());
        });
    });
});
