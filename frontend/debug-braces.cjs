const fs = require('fs');
const code = fs.readFileSync('src/pages/dashboard.jsx', 'utf8');
let line = 1;
let paren = 0;
let brace = 0;
let bracket = 0;
let inSingle = false;
let inDouble = false;
let inTemplate = false;
let inLineComment = false;
let inBlockComment = false;
for (let i = 0; i < code.length; i++) {
  const c = code[i];
  const nxt = code[i+1];
  if (c === '\n') {
    line++;
    inLineComment = false;
  }
  if (inLineComment) continue;
  if (inBlockComment) {
    if (c === '*' && nxt === '/') { inBlockComment = false; i++; }
    continue;
  }
  if (!inSingle && !inDouble && !inTemplate) {
    if (c === '/' && nxt === '/') { inLineComment = true; i++; continue; }
    if (c === '/' && nxt === '*') { inBlockComment = true; i++; continue; }
  }
  if (c === '\\') { i++; continue; }
  if (!inSingle && !inDouble && c === '`' && !inTemplate) { inTemplate = true; continue; }
  if (inTemplate && c === '`') { inTemplate = false; continue; }
  if (inTemplate) continue;
  if (!inSingle && !inDouble && c === '"') { inDouble = true; continue; }
  if (!inSingle && inDouble && c === '"') { inDouble = false; continue; }
  if (!inDouble && !inTemplate && c === "'") { inSingle = !inSingle; continue; }
  if (inSingle || inDouble) continue;
  if (c === '(') paren++;
  if (c === ')') paren--;
  if (c === '{') brace++;
  if (c === '}') brace--;
  if (c === '[') bracket++;
  if (c === ']') bracket--;
  if (brace < 0 || paren < 0 || bracket < 0) {
    console.log('negative at', line, c, 'paren', paren, 'brace', brace, 'bracket', bracket);
    break;
  }
}
console.log('final counts: line', line, 'paren', paren, 'brace', brace, 'bracket', bracket);