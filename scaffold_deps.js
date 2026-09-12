const fs = require('fs');
const path = require('path');

const root = __dirname;
const backendPkg = path.join(root, 'packages/backend/package.json');
const frontendPkg = path.join(root, 'packages/frontend/package.json');

// Update Backend Package
let bPkg = JSON.parse(fs.readFileSync(backendPkg, 'utf8'));
delete bPkg.dependencies['better-sqlite3'];
delete bPkg.devDependencies['@types/better-sqlite3'];
bPkg.dependencies['sql.js'] = '^1.10.3';
bPkg.dependencies['multer'] = '^1.4.5-lts.1';
bPkg.dependencies['helmet'] = '^7.1.0';
bPkg.dependencies['express-validator'] = '^7.0.1';
bPkg.devDependencies['@types/multer'] = '^1.4.11';
bPkg.devDependencies['@types/sql.js'] = '^1.4.9';
fs.writeFileSync(backendPkg, JSON.stringify(bPkg, null, 2));

// Update Frontend Package
let fPkg = JSON.parse(fs.readFileSync(frontendPkg, 'utf8'));
fPkg.dependencies['zustand'] = '^4.5.2';
fs.writeFileSync(frontendPkg, JSON.stringify(fPkg, null, 2));

console.log('Packages updated successfully.');
