const fs = require('fs');
const path = require('path');
const b64 = fs.readFileSync(path.join(__dirname, 'public', 'ajeer-new-logo-copy.png')).toString('base64');
const dataUrl = 'data:image/png;base64,' + b64;
fs.writeFileSync(path.join(__dirname, 'public', 'logo_b64.txt'), dataUrl, 'utf8');
process.stdout.write('OK length=' + dataUrl.length + '\n');
