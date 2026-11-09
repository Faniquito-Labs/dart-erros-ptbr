import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const messages = JSON.parse(readFileSync(join(root, 'data/en/messages.json'), 'utf8'));
const codes = JSON.parse(readFileSync(join(root, 'data/en/codes.json'), 'utf8'));
const ptDir = join(root, 'data/pt');
const placeholderValues = JSON.parse(readFileSync(join(root, 'data/placeholder-values.json'), 'utf8'));

const pt = {};
if (existsSync(ptDir)) {
  for (const file of readdirSync(ptDir).filter((f) => f.endsWith('.json')).sort()) {
    Object.assign(pt, JSON.parse(readFileSync(join(ptDir, file), 'utf8')));
  }
}

const entries = [];
const indexById = new Map();
for (const m of messages) {
  const t = pt[m.id];
  if (!t) continue;
  indexById.set(m.id, entries.length);
  const translatable = placeholderValues.entries[m.id];
  entries.push(translatable ? [m.problem, m.correction, t.problem, t.correction, translatable] : [m.problem, m.correction, t.problem, t.correction]);
}

const byCode = {};
for (const [code, ids] of Object.entries(codes)) {
  const indexes = ids.map((id) => indexById.get(id)).filter((i) => i !== undefined);
  if (indexes.length) byCode[code] = indexes;
}

mkdirSync(join(root, 'out'), { recursive: true });
writeFileSync(join(root, 'out/dictionary.json'), JSON.stringify({ entries, byCode, values: placeholderValues.values }));
console.log(`dicionário: ${entries.length}/${messages.length} mensagens traduzidas, ${Object.keys(byCode).length} códigos`);
