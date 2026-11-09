import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const ptDir = join(root, 'data/pt');
const chunkDir = join(root, 'data/en/chunks');
const strict = process.argv.includes('--strict');
const only = process.argv.slice(2).filter((a) => !a.startsWith('--')).map((a) => basename(a, '.json'));

const messages = new Map(JSON.parse(readFileSync(join(root, 'data/en/messages.json'), 'utf8')).map((e) => [e.id, e]));
const holders = (s) => (s.match(/\{\d+\}/g) ?? []).sort().join(',');
let errors = 0;
let warnings = 0;
const fail = (msg) => (console.log(msg), errors++);
const warn = (msg) => (console.log(msg), warnings++);

const pt = new Map();
for (const file of existsSync(ptDir) ? readdirSync(ptDir).filter((f) => f.endsWith('.json')).sort() : []) {
  let data;
  try {
    data = JSON.parse(readFileSync(join(ptDir, file), 'utf8'));
  } catch (e) {
    fail(`data/pt/${file}: JSON inválido (${e.message})`);
    continue;
  }
  for (const [id, t] of Object.entries(data)) {
    if (pt.has(id)) fail(`${id}: traduzido em mais de um arquivo (${pt.get(id).file} e ${file})`);
    pt.set(id, { ...t, file });
  }
}

const scope = only.length
  ? only.flatMap((name) => {
      const path = join(chunkDir, `${name}.json`);
      if (!existsSync(path)) {
        fail(`data/en/chunks/${name}.json não existe`);
        return [];
      }
      return JSON.parse(readFileSync(path, 'utf8')).map((e) => e.id);
    })
  : [...messages.keys()];

let missing = 0;
for (const id of scope) {
  const entry = messages.get(id);
  const t = pt.get(id);
  if (!entry) continue;
  if (!t) {
    missing++;
    if (only.length) fail(`${id}: tradução ausente`);
    continue;
  }
  const where = `${t.file}/${id}`;
  if (typeof t.problem !== 'string' || typeof t.correction !== 'string') {
    fail(`${where}: precisa ter "problem" e "correction" como texto`);
    continue;
  }
  for (const field of ['problem', 'correction']) {
    if (holders(entry[field]) !== holders(t[field])) {
      fail(`${where}.${field}: placeholders diferentes\n  en: ${entry[field]}\n  pt: ${t[field]}`);
    }
    if (!!entry[field].trim() !== !!t[field].trim()) fail(`${where}.${field}: vazio em um idioma e preenchido no outro`);
    if (/[a-z]{4}/i.test(entry[field].replace(/'[^']*'/g, '')) && entry[field] === t[field]) {
      warn(`${where}.${field}: idêntico ao inglês`);
    }
  }
}

if (!only.length) {
  for (const [id, t] of pt) if (!messages.has(id)) warn(`${t.file}/${id}: tradução de uma mensagem que não existe mais nas fontes`);
  if (missing) (strict ? fail : warn)(`${missing} mensagem(ns) sem tradução — rode 'npm run extract' para gerar os lotes pendentes`);
}

console.log(errors ? `${errors} erro(s), ${warnings} aviso(s)` : `OK (${warnings} aviso(s))`);
process.exit(errors ? 1 : 0);
