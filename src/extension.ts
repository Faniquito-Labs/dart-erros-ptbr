import * as vscode from 'vscode';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Dictionary, Translation, Translator } from './translator';

const section = 'dartErrosPtbr';

type SeverityName = 'error' | 'warning' | 'info' | 'hint';

const severityNames: Record<vscode.DiagnosticSeverity, SeverityName> = {
  [vscode.DiagnosticSeverity.Error]: 'error',
  [vscode.DiagnosticSeverity.Warning]: 'warning',
  [vscode.DiagnosticSeverity.Information]: 'info',
  [vscode.DiagnosticSeverity.Hint]: 'hint',
};

const severityLabels: Record<SeverityName, string> = {
  error: 'Erro',
  warning: 'Aviso',
  info: 'Info',
  hint: 'Dica',
};

interface Settings {
  inline: boolean;
  hover: boolean;
  lineBackground: boolean;
  showUntranslated: boolean;
  severities: Set<SeverityName>;
  sources: Set<string>;
  maxLength: number;
}

const readSettings = (): Settings => {
  const c = vscode.workspace.getConfiguration(section);
  return {
    inline: c.get('inline.enabled', true),
    hover: c.get('hover.enabled', true),
    lineBackground: c.get('inline.lineBackground', true),
    showUntranslated: c.get('inline.showUntranslated', true),
    severities: new Set(c.get<SeverityName[]>('severities', ['error', 'warning', 'info'])),
    sources: new Set(c.get<string[]>('sources', ['dart'])),
    maxLength: c.get('inline.maxLength', 220),
  };
};

const codeOf = (d: vscode.Diagnostic): string | undefined => {
  if (d.code === undefined) return undefined;
  if (typeof d.code === 'object') return String(d.code.value);
  return String(d.code);
};

const truncate = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

export function activate(context: vscode.ExtensionContext) {
  const dictionary: Dictionary = JSON.parse(readFileSync(join(__dirname, 'dictionary.json'), 'utf8'));
  const translator = new Translator(dictionary);
  const output = vscode.window.createOutputChannel('Erros do Dart em PT-BR');
  const misses = new Map<string, string>();
  let settings = readSettings();
  let decorationTypes = createDecorationTypes(settings);

  const relevant = (d: vscode.Diagnostic) =>
    !!d.source && settings.sources.has(d.source) && settings.severities.has(severityNames[d.severity]);

  const translate = (d: vscode.Diagnostic): Translation => {
    const code = codeOf(d);
    const t = translator.translate(d.message, code);
    if (!t.translated) {
      const key = `${code ?? '?'}: ${d.message.split('\n')[0]}`;
      if (!misses.has(key)) {
        misses.set(key, d.message);
        output.appendLine(`[sem tradução] ${code ?? '?'}\n${d.message}\n`);
      }
    }
    return t;
  };

  const decorate = (editor: vscode.TextEditor) => {
    const buckets = new Map<SeverityName, vscode.DecorationOptions[]>(
      (Object.keys(decorationTypes) as SeverityName[]).map((s) => [s, []]),
    );
    if (settings.inline) {
      const byLine = new Map<number, vscode.Diagnostic[]>();
      for (const d of vscode.languages.getDiagnostics(editor.document.uri)) {
        if (!relevant(d)) continue;
        const line = d.range.start.line;
        if (!byLine.has(line)) byLine.set(line, []);
        byLine.get(line)!.push(d);
      }
      for (const [line, list] of byLine) {
        list.sort((a, b) => a.severity - b.severity);
        const top = list[0];
        const t = translate(top);
        if (!t.translated && !settings.showUntranslated) continue;
        const more = list.length > 1 ? `  (+${list.length - 1})` : '';
        const end = editor.document.lineAt(Math.min(line, editor.document.lineCount - 1)).range.end;
        buckets.get(severityNames[top.severity])!.push({
          range: new vscode.Range(end, end),
          renderOptions: { after: { contentText: truncate(t.problem, settings.maxLength) + more } },
        });
      }
    }
    for (const [severity, options] of buckets) editor.setDecorations(decorationTypes[severity], options);
  };

  let timer: NodeJS.Timeout | undefined;
  const pending = new Set<vscode.TextEditor>();
  const schedule = (editors: readonly vscode.TextEditor[]) => {
    editors.forEach((e) => pending.add(e));
    clearTimeout(timer);
    timer = setTimeout(() => {
      const visible = new Set(vscode.window.visibleTextEditors);
      for (const e of pending) if (visible.has(e)) decorate(e);
      pending.clear();
    }, 80);
  };
  const refreshAll = () => schedule(vscode.window.visibleTextEditors);

  context.subscriptions.push(
    output,
    { dispose: () => Object.values(decorationTypes).forEach((t) => t.dispose()) },
    vscode.languages.onDidChangeDiagnostics((e) => {
      const changed = new Set(e.uris.map((u) => u.toString()));
      schedule(vscode.window.visibleTextEditors.filter((ed) => changed.has(ed.document.uri.toString())));
    }),
    vscode.window.onDidChangeVisibleTextEditors(refreshAll),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (!e.affectsConfiguration(section)) return;
      settings = readSettings();
      Object.values(decorationTypes).forEach((t) => t.dispose());
      decorationTypes = createDecorationTypes(settings);
      refreshAll();
    }),
    vscode.languages.registerHoverProvider({ language: 'dart' }, {
      provideHover(document, position) {
        if (!settings.hover) return undefined;
        const found = vscode.languages
          .getDiagnostics(document.uri)
          .filter((d) => d.source && settings.sources.has(d.source) && d.range.contains(position))
          .sort((a, b) => a.severity - b.severity);
        if (!found.length) return undefined;
        const md = new vscode.MarkdownString();
        found.forEach((d, i) => {
          const t = translate(d);
          const code = codeOf(d);
          if (i > 0) md.appendMarkdown('\n\n---\n\n');
          md.appendMarkdown(`**${severityLabels[severityNames[d.severity]]}${t.translated ? '' : ' (sem tradução)'}:** `);
          md.appendText(t.problem);
          if (t.correction) {
            md.appendMarkdown('\n\n_');
            md.appendText(t.correction);
            md.appendMarkdown('_');
          }
          if (code) md.appendMarkdown(`\n\n\`${code}\``);
        });
        return new vscode.Hover(md);
      },
    }),
    vscode.commands.registerCommand(`${section}.toggleInline`, async () => {
      const c = vscode.workspace.getConfiguration(section);
      await c.update('inline.enabled', !c.get('inline.enabled', true), vscode.ConfigurationTarget.Global);
    }),
    vscode.commands.registerCommand(`${section}.showUntranslated`, () => {
      output.clear();
      if (!misses.size) output.appendLine('Nenhuma mensagem sem tradução nesta sessão.');
      for (const [key, message] of misses) output.appendLine(`${key}\n${message}\n`);
      output.show(true);
    }),
  );

  refreshAll();
}

function createDecorationTypes(settings: Settings): Record<SeverityName, vscode.TextEditorDecorationType> {
  const make = (name: SeverityName) =>
    vscode.window.createTextEditorDecorationType({
      isWholeLine: true,
      backgroundColor: settings.lineBackground ? new vscode.ThemeColor(`${section}.${name}Background`) : undefined,
      after: {
        color: new vscode.ThemeColor(`${section}.${name}Foreground`),
        margin: '0 0 0 3ch',
        fontStyle: 'italic',
      },
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
    });
  return { error: make('error'), warning: make('warning'), info: make('info'), hint: make('hint') };
}

export function deactivate() {}
