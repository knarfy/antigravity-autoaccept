const fs = require('fs');
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(path) {
    if (path === 'vscode') return { workspace: { getConfiguration: () => ({ get: (k, d) => d }) } };
    return originalRequire.apply(this, arguments);
};

const { buildDetectorScriptWithCustomTexts } = require('./out/buttonDetector');
const script = buildDetectorScriptWithCustomTexts([], []);

fs.writeFileSync('debug_script.txt', script, 'utf8');
console.log('Script guardado en debug_script.txt');

try {
    eval(script);
    console.log('Sintaxis OK');
} catch (e) {
    console.error('ERROR de sintaxis:', e.message);
}
