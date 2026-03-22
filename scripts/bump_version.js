const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const args = process.argv.slice(2);
const modeArg = args.indexOf('--mode');
const mode = modeArg !== -1 ? args[modeArg + 1] : 'test';

let currentVersion = pkg.version;

if (mode === 'test') {
    // Si ya existe -testN, incrementamos N
    const match = currentVersion.match(/(.*-test)(\d+)$/);
    if (match) {
        const nextN = parseInt(match[2]) + 1;
        pkg.version = `${match[1]}${nextN}`;
    } else {
        // Incrementar patch version y añadir -test1 si no es ya un test
        const parts = currentVersion.split('.');
        if (parts.length === 3) {
            const patch = parseInt(parts[2].split('-')[0]);
            pkg.version = `${parts[0]}.${parts[1]}.${patch + 1}-test1`;
        } else {
            pkg.version = `${currentVersion}-test1`;
        }
    }
} else if (mode === 'stable') {
    // Quitar sufijo -testN
    pkg.version = currentVersion.split('-')[0];
}

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 4), 'utf8');
console.log(`Versión actualizada: ${currentVersion} -> ${pkg.version}`);
