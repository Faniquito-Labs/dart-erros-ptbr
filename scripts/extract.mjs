import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import YAML from 'yaml';

const root = new URL('..', import.meta.url).pathname;
const sourcesDir = join(root, 'data/sources');
const outDir = join(root, 'data/en');
const chunkSize = Number(process.argv[2] ?? 180);

const snake = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2').toLowerCase();
const clean = (s) => (typeof s === 'string' ? s.trim() : '');
export const textId = (problem, correction) =>
  createHash('sha1').update(`${problem}\u0000${correction}`).digest('hex').slice(0, 12);

const skipClasses = new Set(['TodoCode']);
const entries = new Map();
const codes = new Map();

const positional = (problem, correction) => {
  const order = new Map();
  const swap = (s) =>
    s.replace(/#[A-Za-z_][A-Za-z0-9_]*/g, (name) => {
      if (!order.has(name)) order.set(name, order.size);
      return `{${order.get(name)}}`;
    });
  return [swap(problem), swap(correction)];
};

const add = (code, raw) => {
  if (!clean(raw.problemMessage)) return;
  if (raw.state && typeof raw.state === 'object' && 'removed' in raw.state) return;
  const [problem, correction] = positional(clean(raw.problemMessage), clean(raw.correctionMessage));
  const id = textId(problem, correction);
  if (!entries.has(id)) entries.set(id, { id, code, problem, correction });
  if (!codes.has(code)) codes.set(code, new Set());
  codes.get(code).add(id);
};

for (const version of readdirSync(sourcesDir).sort()) {
  const dir = join(sourcesDir, version);
  for (const file of ['analyzer.yaml', 'linter.yaml']) {
    const path = join(dir, file);
    if (!existsSync(path)) continue;
    const doc = YAML.parse(readFileSync(path, 'utf8'));
    for (const [cls, group] of Object.entries(doc)) {
      if (skipClasses.has(cls) || !group || typeof group !== 'object') continue;
      for (const [key, raw] of Object.entries(group)) {
        if (!raw || typeof raw !== 'object') continue;
        add(snake(raw.sharedName ?? key), raw);
      }
    }
  }
  const shared = join(dir, '_fe_analyzer_shared.yaml');
  if (existsSync(shared)) {
    const doc = YAML.parse(readFileSync(shared, 'utf8'));
    for (const [key, raw] of Object.entries(doc)) {
      if (!raw || typeof raw !== 'object' || !raw.analyzerCode) continue;
      const code = Array.isArray(raw.analyzerCode) ? raw.analyzerCode[0] : raw.analyzerCode;
      add(snake(String(code).replace(/^.*\./, '')), raw);
    }
  }
}

mkdirSync(outDir, { recursive: true });
const list = [...entries.values()].sort((a, b) => a.code.localeCompare(b.code) || a.id.localeCompare(b.id));
writeFileSync(join(outDir, 'messages.json'), JSON.stringify(list, null, 1));
writeFileSync(
  join(outDir, 'codes.json'),
  JSON.stringify(Object.fromEntries([...codes].sort().map(([c, ids]) => [c, [...ids]])), null, 1),
);

const ptDir = join(root, 'data/pt');
const ptFiles = existsSync(ptDir) ? readdirSync(ptDir).filter((f) => f.endsWith('.json')) : [];
const translated = new Set(ptFiles.flatMap((f) => Object.keys(JSON.parse(readFileSync(join(ptDir, f), 'utf8')))));
const pending = list.filter((e) => !translated.has(e.id));

const chunkDir = join(outDir, 'chunks');
rmSync(chunkDir, { recursive: true, force: true });
mkdirSync(chunkDir, { recursive: true });
const lastNumber = Math.max(0, ...ptFiles.map((f) => Number(/^chunk-(\d+)\.json$/.exec(f)?.[1] ?? 0)));
const created = [];
for (let i = 0; i * chunkSize < pending.length; i++) {
  const name = `chunk-${String(lastNumber + i + 1).padStart(2, '0')}`;
  const chunk = pending.slice(i * chunkSize, (i + 1) * chunkSize).map(({ id, code, problem, correction }) => ({ id, code, problem, correction }));
  writeFileSync(join(chunkDir, `${name}.json`), JSON.stringify(chunk, null, 1));
  created.push(name);
}

console.log(`${list.length} textos únicos, ${codes.size} códigos`);
console.log(
  pending.length
    ? `${pending.length} sem tradução, em ${created.length} lote(s) para traduzir: ${created.map((n) => `data/en/chunks/${n}.json`).join(', ')}`
    : 'Tudo traduzido, nenhum lote pendente.',
);
