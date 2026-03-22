const { JSDOM } = require('jsdom');

// 1. Mock de vscode ANTES de importar nada más
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(path) {
    if (path === 'vscode') return { workspace: { getConfiguration: () => ({ get: (k, d) => d }) } };
    return originalRequire.apply(this, arguments);
};

const { buildDetectorScriptWithCustomTexts } = require('./out/buttonDetector');

// 2. Simular DOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
const { window } = dom;
global.window = window;
global.document = window.document;
global.Node = window.Node;
global.Element = window.Element;
global.MouseEvent = window.MouseEvent;

const btn = document.createElement('button');
btn.textContent = 'Accept all';
btn.className = 'monaco-button';
btn.getBoundingClientRect = () => ({ x: 100, y: 100, width: 100, height: 30 });
document.body.appendChild(btn);

const script = buildDetectorScriptWithCustomTexts([], []);

try {
    const result = eval(script);
    console.log('--- RESULTADO ---');
    console.log(JSON.stringify(result, null, 2));
} catch (e) {
    console.error('--- FALLÓ ---');
    console.error(e.message);
}
