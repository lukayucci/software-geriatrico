const fs = require('fs');
const parser = require('@babel/parser');
const code = fs.readFileSync('src/pages/dashboard.jsx', 'utf8');
try {
  parser.parse(code, { sourceType: 'module', plugins: ['jsx'] });
  console.log('parsed ok');
} catch (err) {
  console.error(err.toString());
  if (err.loc) console.error('line', err.loc.line, 'column', err.loc.column);
}
