# Glossário de tradução (EN → PT-BR)

Público: desenvolvedores Dart/Flutter brasileiros. Tom direto, técnico, natural — como um colega sênior explicaria. Frases curtas. Nada de tradução literal truncada.

## Regras obrigatórias

1. Placeholders `{0}`, `{1}`… devem aparecer na tradução exatamente o mesmo número de vezes em cada campo (`problem` e `correction`). Pode reordenar; não pode criar, remover ou alterar.
2. Mantenha as aspas simples em volta de placeholders e de código: `'{0}'` continua `'{0}'`.
3. Nunca traduza: palavras-chave e código entre aspas (`'const'`, `'async'`, `'late'`, `'required'`, `'dynamic'`, `'void'`, `'Object'`, `'pub get'`, `'dart:ffi'` …), nomes de arquivos (`pubspec.yaml`, `analysis_options.yaml`), URLs, trechos em crase, nomes de anotações (`@override`, `@immutable`), nomes de lints e opções.
4. `correction` vazio continua vazio. Termine frases com ponto quando o original terminar.
5. Números em placeholders podem ser 1 ou 0: evite concordância presa ao número ("foram encontrados {1}"). Prefira formas neutras: "(esperados: {0}; encontrados: {1})", "a chamada tem {1}", "parâmetro(s)".
6. Placeholders sem aspas às vezes recebem palavras em inglês do analisador (class, method, an if…). Esses valores são traduzidos em `data/placeholder-values.json`; escreva a frase sem artigo antes deles, por exemplo "'{1}' ({0}) declara…".
7. Não coloque vírgula antes de "ou" em listas ("A, B ou C").
8. `correction` em inglês começa com "Try …" → "Tente …"; "Consider …" → "Considere …"; "Use …" → "Use …"; "Avoid …" → "Evite …"; "Don't …" → "Não …"; "Prefer …" → "Prefira …".

## Termos

| EN | PT-BR |
|---|---|
| undefined | não definido(a) |
| name / identifier | nome / identificador |
| type | tipo |
| static type | tipo estático |
| type argument / type parameter | argumento de tipo / parâmetro de tipo |
| generic | genérico |
| class / abstract class | classe / classe abstrata |
| mixin, enum, typedef, record, widget, getter, setter, lint, null safety, extension type, part file, factory, augmentation, deferred, spread, wildcard, tear-off, underscore, loop, null-aware | manter em inglês (sempre `tear-off` com hífen) |
| extension | extensão |
| constructor / factory constructor / redirecting constructor | construtor / construtor factory / construtor de redirecionamento |
| named / positional / optional / required parameter | parâmetro nomeado / posicional / opcional / obrigatório |
| argument | argumento |
| return type | tipo de retorno |
| nullable / non-nullable / potentially non-nullable | anulável / não anulável / potencialmente não anulável |
| override (verbo) / overridden member | sobrescrever / membro sobrescrito |
| superclass / subclass / supertype / superinterface | superclasse / subclasse / supertipo / superinterface |
| implement / extend / mix in | implementar / estender / aplicar o mixin |
| library / import / export / directive | biblioteca / import / export / diretiva |
| deprecated | descontinuado(a) |
| declaration / declare | declaração / declarar |
| field / instance / static member | campo / instância / membro estático |
| method / function / function body / closure | método / função / corpo da função / closure |
| invocation / invoke | invocação / invocar |
| expression / statement / literal | expressão / instrução / literal |
| pattern / switch case / exhaustive | padrão / case do switch / exaustivo |
| constant / constant expression | constante / expressão constante |
| assign / assignment | atribuir / atribuição |
| can't be assigned to | não pode ser atribuído a |
| isn't defined for the type | não está definido para o tipo |
| unused / unnecessary | não utilizado / desnecessário |
| dead code / unreachable | código morto / inalcançável |
| the analyzer | o analisador |
| feature / language feature / experiment | recurso / recurso da linguagem / experimento |
| SDK constraint | restrição de SDK |
| member | membro |
| scope | escopo |
| operator / operand | operador / operando |
| key / value / element (coleções) | chave / valor / elemento |
| string interpolation | interpolação de string |
| async / sync / generator | assíncrono / síncrono / gerador |
| future / stream | Future / Stream |
| annotation | anotação |
| shadow (um nome) | esconder / sombrear |
| prefix (de import) | prefixo |
| top-level | de nível superior |
| local variable | variável local |
| boolean | booleano |
| non-final field | campo não final |
| immutable | imutável |
| performance | desempenho |
| doc comment | comentário de documentação |

## Exemplos

- `Undefined name '{0}'.` / `Try correcting the name to one that is defined, or defining the name.`
  → `Nome '{0}' não definido.` / `Tente corrigir para um nome que esteja definido ou declare esse nome.`
- `The argument type '{0}' can't be assigned to the parameter type '{1}'. {2}`
  → `O argumento do tipo '{0}' não pode ser atribuído ao parâmetro do tipo '{1}'. {2}`
- `Use 'const' with the constructor to improve performance.` / `Try adding the 'const' keyword to the constructor invocation.`
  → `Use 'const' no construtor para melhorar o desempenho.` / `Tente adicionar a palavra-chave 'const' na invocação do construtor.`
- `Unused import: '{0}'.` / `Try removing the import directive.`
  → `Import não utilizado: '{0}'.` / `Tente remover a diretiva de import.`
- `Expected to find '{0}'.` → `Era esperado encontrar '{0}'.`
