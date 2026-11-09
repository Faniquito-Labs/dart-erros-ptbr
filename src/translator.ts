export type DictionaryEntry = [
  enProblem: string,
  enCorrection: string,
  ptProblem: string,
  ptCorrection: string,
  translatablePlaceholders?: number[],
];

export interface Dictionary {
  entries: DictionaryEntry[];
  byCode: Record<string, number[]>;
  values?: Record<string, string>;
}

export interface Translation {
  problem: string;
  correction: string;
  translated: boolean;
}

interface Template {
  index: number;
  full: RegExp;
  problemOnly: RegExp;
  groups: number[];
  problemGroups: number[];
  weight: number;
}

const placeholder = /\{(\d+)\}/g;

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const compile = (template: string): { source: string; groups: number[] } => {
  const groups: number[] = [];
  let source = '';
  let last = 0;
  for (const match of template.matchAll(placeholder)) {
    source += escape(template.slice(last, match.index)).replace(/\s+/g, '\\s*');
    const n = Number(match[1]);
    const seen = groups.indexOf(n);
    if (seen >= 0) {
      source += `\\${seen + 1}`;
    } else {
      groups.push(n);
      source += '([^\\n]*?)';
    }
    last = match.index! + match[0].length;
  }
  source += escape(template.slice(last)).replace(/\s+/g, '\\s*');
  return { source, groups };
};

const fill = (template: string, values: Map<number, string>, capitalize: number[] = []) => {
  const lead = /^\{(\d+)\}/.exec(template);
  const text = template
    .replace(placeholder, (whole, n) => values.get(Number(n)) ?? whole)
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([.,;:])$/g, '$1')
    .trim();
  return lead && capitalize.includes(Number(lead[1])) ? text.charAt(0).toUpperCase() + text.slice(1) : text;
};

const normalize = (s: string) => s.replace(/\r\n/g, '\n').trim();

export class Translator {
  private templates: Template[];
  private readonly byCode = new Map<string, Template[]>();
  private readonly cache = new Map<string, Translation>();

  constructor(private readonly dictionary: Dictionary) {
    this.templates = dictionary.entries.map(([enProblem, enCorrection], index) => {
      const problem = compile(enProblem);
      const full = enCorrection ? compile(`${enProblem}\n${enCorrection}`) : problem;
      return {
        index,
        full: new RegExp(`^${full.source}$`),
        problemOnly: new RegExp(`^${problem.source}$`),
        groups: full.groups,
        problemGroups: problem.groups,
        weight: (enProblem + enCorrection).replace(placeholder, '').replace(/\W/g, '').length,
      };
    });
    for (const [code, indexes] of Object.entries(dictionary.byCode)) {
      this.byCode.set(
        code,
        indexes.map((i) => this.templates[i]).sort((a, b) => b.weight - a.weight),
      );
    }
    this.templates = this.templates.filter((t) => t.weight >= 12).sort((a, b) => b.weight - a.weight);
  }

  translate(rawMessage: string, code?: string): Translation {
    const message = normalize(rawMessage);
    const key = `${code ?? ''}\u0000${message}`;
    const cached = this.cache.get(key);
    if (cached) return cached;

    const result =
      (code && this.match(message, this.byCode.get(code.toLowerCase()) ?? [])) ||
      this.match(message, this.templates) ||
      this.untranslated(message);

    if (this.cache.size > 5000) this.cache.clear();
    this.cache.set(key, result);
    return result;
  }

  private match(message: string, candidates: Template[]): Translation | undefined {
    const newline = message.indexOf('\n');
    const problemPart = newline >= 0 ? message.slice(0, newline) : message;
    const rest = newline >= 0 ? message.slice(newline + 1).trim() : '';

    for (const t of candidates) {
      const m = t.full.exec(message);
      if (m) return this.render(t, t.groups, m);
    }
    for (const t of candidates) {
      const m = t.problemOnly.exec(problemPart);
      if (m) return this.render(t, t.problemGroups, m, rest);
    }
    return undefined;
  }

  private render(t: Template, groups: number[], m: RegExpExecArray, correctionAsIs?: string): Translation {
    const [enProblem, , ptProblem, ptCorrection, translatable] = this.dictionary.entries[t.index];
    const known = this.dictionary.values ?? {};
    const values = new Map<number, string>();
    groups.forEach((n, i) => {
      const raw = m[i + 1];
      values.set(n, translatable?.includes(n) && Object.hasOwn(known, raw.trim()) ? known[raw.trim()] : raw);
    });
    return {
      problem: fill(ptProblem, values, translatable),
      correction: correctionAsIs ?? fill(ptCorrection, values, translatable),
      translated: !/^\{\d+\}$/.test(enProblem),
    };
  }

  private untranslated(message: string): Translation {
    const newline = message.indexOf('\n');
    return newline >= 0
      ? { problem: message.slice(0, newline), correction: message.slice(newline + 1).trim(), translated: false }
      : { problem: message, correction: '', translated: false };
  }
}
