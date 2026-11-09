# Guia de desenvolvimento

## Requisitos

- Node.js 20 ou mais novo e npm.
- VS Code para testar a extensão.
- Opcional: SDK do Dart/Flutter, para gerar diagnósticos reais e testar contra eles.

```bash
npm install
```

## Comandos

| Comando | O que faz |
|---|---|
| `npm run extract` | Lê os `messages.yaml` de `data/sources/`, atualiza `data/en/` e gera lotes só com as mensagens que ainda não têm tradução |
| `npm run validate` | Confere todas as traduções: placeholders, campos vazios, ids duplicados, mensagens sem tradução (modo estrito) |
| `node scripts/validate.mjs chunk-11` | Confere só os ids de um lote pendente (útil durante a tradução) |
| `npm run build:dict` | Gera `out/dictionary.json` a partir de `data/` |
| `npm run compile` | Compila o TypeScript para `out/` |
| `npm test` | Valida, monta o dicionário, compila e roda os testes |
| `npm run package` | Roda os testes e gera o `.vsix` |

## Estrutura

```
src/
  extension.ts        integração com o VS Code: decorações inline, hover, comandos, configurações
  translator.ts       casamento das mensagens e montagem da tradução (sem dependência do VS Code)
  test/               testes com node:test
scripts/
  extract.mjs         fontes do SDK → data/en (mensagens, códigos e lotes pendentes)
  validate.mjs        validação das traduções
  build-dictionary.mjs data/ → out/dictionary.json
data/
  sources/<versão>/   messages.yaml do SDK (analyzer, linter, _fe_analyzer_shared), um diretório por versão
  en/messages.json    todas as mensagens únicas, com id, código, problema e correção em inglês
  en/codes.json       código do diagnóstico → ids das mensagens
  en/chunks/          lotes pendentes de tradução (vazio quando está tudo traduzido)
  pt/chunk-NN.json    traduções, por id: { "problem": "...", "correction": "..." }
  placeholder-values.json  palavras do analisador traduzidas dentro de placeholders específicos
  GLOSSARIO.md        termos e regras de tradução
test-fixtures/
  real-diagnostics.json  diagnósticos reais do analisador usados como teste de regressão
```

`out/`, `node_modules/` e `*.vsix` não vão para o git. `data/`, `src/`, `scripts/`, `docs/` e `test-fixtures/` ficam fora do `.vsix` (ver `.vscodeignore`).

## Como funciona

### Origem das mensagens

O analisador do Dart define o texto de cada diagnóstico em arquivos `messages.yaml` dentro do SDK:

- `pkg/analyzer/messages.yaml`: erros e avisos do analisador.
- `pkg/linter/messages.yaml`: lints.
- `pkg/_fe_analyzer_shared/messages.yaml`: erros do parser compartilhados com o compilador (só as entradas com `analyzerCode`).

Os placeholders aparecem como `#nome` (por exemplo, `Undefined name '#name'.`). O `extract` troca esses nomes por posições (`{0}`, `{1}`…) na ordem em que aparecem. Assim, mensagens iguais em versões diferentes do SDK, que às vezes só mudam o nome do parâmetro (`#p0` e `#name`), viram uma só.

Cada mensagem recebe um id: os 12 primeiros caracteres do SHA-1 de `problema + correção` em inglês. Como o id depende só do texto, uma mensagem que não muda entre versões mantém o id e a tradução.

O código do diagnóstico (`undefined_identifier`, `prefer_const_constructors`…) é o nome da entrada (ou `sharedName`/`analyzerCode`) em snake_case. É o mesmo valor que o VS Code recebe em `diagnostic.code`.

### O que chega no VS Code

O servidor de análise do Dart envia cada diagnóstico com `source: "dart"`, `code` com o código acima e `message` no formato `problema + "\n" + correção` (sem a correção, quando ela não existe).

### Casamento

O `Translator` transforma cada mensagem em inglês numa expressão regular ancorada: os trechos literais são escapados, os espaços ficam flexíveis e cada placeholder vira um grupo de captura (uma repetição do mesmo placeholder vira referência ao grupo).

Para traduzir uma mensagem:

1. Procura entre os modelos do código do diagnóstico, do mais específico (mais texto literal) para o menos específico.
2. Tenta casar a mensagem inteira (problema + correção). Se não casar, tenta só a primeira linha e mantém a correção original, que pode ser de uma versão diferente do SDK.
3. Se o código não ajudar, tenta todos os modelos. Modelos com pouco texto literal (como `{0}`) ficam de fora dessa busca, para não casar com qualquer coisa.
4. Se nada casar, devolve a mensagem original marcada como não traduzida.

Os valores capturados são encaixados nos placeholders da frase em português. O resultado fica em cache por código + mensagem.

### Palavras do analisador dentro de placeholders

Algumas mensagens recebem no placeholder uma palavra em inglês gerada pelo analisador, e não um nome do seu código. Exemplos: o tipo de elemento em `The #kind '#name' is declared with…` (`class`, `method`…) e o tipo de instrução em `Statements in #p0 should be enclosed in a block.` (`an if`, `a for`…).

`data/placeholder-values.json` tem duas partes:

- `values`: palavra em inglês → tradução.
- `entries`: id da mensagem → posições dos placeholders em que essas palavras devem ser traduzidas.

A tradução só acontece nas posições listadas e quando o valor é exatamente uma das palavras conhecidas. Assim, um identificador do usuário chamado `method` nunca vira `método`. Quando a frase em português começa por um desses placeholders, a primeira letra é capitalizada. Nos demais casos, o valor é mantido como veio, inclusive a caixa.

Como a palavra entra sem artigo, as frases dessas mensagens são escritas para não depender de gênero: `'{1}' ({0}) declara…` em vez de `O {0} '{1}' é declarado…`.

### Exibição

`extension.ts` escuta `onDidChangeDiagnostics`, filtra pelos `sources` e severidades configurados e desenha uma decoração por linha no editor visível (a de maior severidade, com `(+N)` quando há mais), usando os tipos de decoração por severidade e as cores declaradas em `contributes.colors`. O hover é um `HoverProvider` para `dart` que lista as traduções dos diagnósticos sob o cursor. Mensagens não traduzidas são registradas no canal de saída "Erros do Dart em PT-BR".

## Atualizar para uma nova versão do Dart

1. **Baixe as fontes da versão** para um diretório novo em `data/sources/`. Mantenha os diretórios das versões anteriores, porque o dicionário é a união de todas:

   ```bash
   V=3.14.0
   mkdir -p data/sources/$V
   for f in analyzer linter _fe_analyzer_shared; do
     curl -sfL -o data/sources/$V/$f.yaml https://raw.githubusercontent.com/dart-lang/sdk/$V/pkg/$f/messages.yaml
   done
   ```

2. **Extraia.** O comando lista quantas mensagens ficaram sem tradução e em quais lotes:

   ```bash
   npm run extract
   ```

3. **Traduza cada lote pendente.** Para `data/en/chunks/chunk-NN.json`, crie `data/pt/chunk-NN.json` com o mesmo nome, no formato `{ "<id>": { "problem": "...", "correction": "..." } }`, seguindo o `data/GLOSSARIO.md`. Confira o lote com:

   ```bash
   node scripts/validate.mjs chunk-NN
   ```

4. **Revise placeholders sem aspas** nas mensagens novas. Se algum recebe palavras do analisador (tipo de elemento, tipo de instrução, tipo de literal), adicione o id e as posições em `entries` de `data/placeholder-values.json` (e a palavra em `values`, se for nova). Para descobrir o que entra no placeholder, veja a descrição dos parâmetros no `messages.yaml` ou o código da regra no SDK.

5. **Rode `npm run extract` de novo.** Ele deve dizer "Tudo traduzido". Depois, rode os testes:

   ```bash
   npm test
   ```

6. **Opcional, mas recomendado: teste com diagnósticos reais.** Rode `dart analyze --format=json` num projeto com erros e lints variados e acrescente os diagnósticos novos em `test-fixtures/real-diagnostics.json` (`{ "code": "...", "message": "problema\ncorreção" }`). O primeiro teste falha se algum não for traduzido.

7. **Atualize a versão e o `CHANGELOG.md`**, gere o pacote e publique (ver abaixo).

Mensagens com tradução que deixaram de existir nas fontes aparecem como aviso no `npm run validate`. Elas não atrapalham, e mantê-las ajuda quem usa versões antigas do Dart.

## Testar localmente

```bash
npm run package
code --install-extension dart-erros-ptbr-<versão>.vsix --profile "<perfil>"
```

Extensões são instaladas por perfil do VS Code. Instale no perfil em que o projeto Flutter abre (veja em **Perfis** no menu de engrenagem) e rode **Developer: Reload Window**. Para confirmar que a extensão ativou, abra um arquivo `.dart` e procure por `dart-erros-ptbr` no log do Extension Host (**Developer: Show Logs… → Extension Host**).

Para depurar com breakpoints, abra este projeto no VS Code e use **Run → Start Debugging** com uma configuração do tipo `extensionHost` apontando para esta pasta.

## Publicar

### Antes da primeira publicação

- Crie o publisher em https://marketplace.visualstudio.com/manage com uma conta Microsoft: nome **Faniquito Labs**, ID **`faniquito-labs`**. O ID precisa ser igual ao campo `publisher` do `package.json`. Outras pessoas podem ser adicionadas ao publisher depois, na aba **Members**.
- Adicione um ícone PNG de pelo menos 128×128 (campo `icon` do `package.json`).

### Publicar uma versão

1. Atualize `version` no `package.json` (patch para correções de tradução, minor para recursos novos) e registre as mudanças no `CHANGELOG.md`.
2. Gere o pacote com `npm run package`.
3. Envie de uma destas formas:
   - **Pelo site:** na página do publisher, **New extension → Visual Studio Code** (primeira vez) ou **Update** (versões seguintes), enviando o `.vsix`. Não precisa de token.
   - **Pela linha de comando:** `npx vsce login faniquito-labs` e depois `npx vsce publish`. Isso exige um Personal Access Token do Azure DevOps com escopo **Marketplace → Manage** e organização **All accessible organizations**. A Microsoft desativa esses tokens globais em **1º de dezembro de 2026**. Depois disso, publicação automatizada só via CI, por exemplo GitHub Actions com Trusted Publishing (`npx vsce publish --oidc`).

O VS Code de quem instalou pela loja atualiza a extensão sozinho.

Para disponibilizar também no Cursor, VSCodium e outros editores compatíveis, publique o mesmo `.vsix` no Open VSX (https://open-vsx.org) com `npx ovsx publish`.
