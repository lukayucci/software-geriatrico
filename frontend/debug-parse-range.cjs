const fs = require('fs');
const parser = require('@babel/parser');
const lines = fs.readFileSync('src/pages/dashboard.jsx', 'utf8').split(/\r?\n/);
for (let i = 50; i <= lines.length; i += 50) {
  const code = lines.slice(0, i).join('\n');
  try {
    parser.parse(code, { sourceType: 'module', plugins: ['jsx'] });
    console.log('OK up to line', i);
  } catch (err) {
    console.error('FAIL at line', i, err.message);
    if (err.loc) console.error('loc', err.loc.line, err.loc.column);
    break;
  }
}
