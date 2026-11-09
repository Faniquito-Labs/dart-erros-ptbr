# Como contribuir

Valeu por ajudar! Este guia leva do zero até o primeiro PR.

As tarefas abertas estão nas [issues](https://github.com/Faniquito-Labs/dart-erros-ptbr/issues) e organizadas no Project da Faniquito Labs. As marcadas com **good first issue** são as melhores para começar.

## 1. Preparar o ambiente

Requisitos:

- Node.js 20 ou mais novo.
- VS Code com a extensão oficial **Dart** instalada.
- Um projeto Dart ou Flutter qualquer para testar. Qualquer `flutter create` serve.

```bash
git clone https://github.com/Faniquito-Labs/dart-erros-ptbr.git
cd dart-erros-ptbr
npm install
npm test
```

O `npm test` valida as traduções, monta o dicionário, compila e roda os testes. Se ele passar, está tudo pronto.

## 2. Testar a extensão no VS Code

### Jeito rápido: F5 (recomendado para desenvolver)

1. Abra a pasta `dart-erros-ptbr` no VS Code.
2. Aperte **F5**, ou use **Run → Start Debugging** com a configuração **Rodar extensão**.
3. Abre uma segunda janela, o **Extension Development Host**, com a extensão carregada direto do código. Nela, abra um projeto Dart/Flutter.
4. Crie um erro de propósito, por exemplo `int x = 'a';`. A mensagem traduzida deve aparecer no fim da linha.

Depois de mudar o código ou as traduções, rode **Developer: Reload Window** na janela de teste, ou pare e aperte F5 de novo. A compilação roda sozinha antes de abrir. Breakpoints em `src/` funcionam.

### Jeito completo: instalar o `.vsix`

Serve para testar como um usuário final vai receber a extensão.

```bash
npm run package
code --install-extension dart-erros-ptbr-0.1.1.vsix
```

Troque o número pela versão do `package.json`. Depois, rode **Developer: Reload Window**.

> **Atenção aos perfis do VS Code:** a extensão é instalada no perfil ativo. Se o seu projeto Flutter abre em outro perfil, instale nele com `--profile "Nome do perfil"`. Instalar no perfil errado é o motivo mais comum de "não aparece nada".

> **Usa Error Lens?** Adicione `"errorLens.excludeBySource": ["dart"]` nas configurações. Sem isso, a mensagem aparece duas vezes, em inglês e em português.

## 3. Fluxo de trabalho

1. Escolha uma issue e comente nela que vai pegar, ou se atribua.
2. Crie uma branch a partir da `main`: `git checkout -b feat/icone`, `fix/traducao-lints`, etc.
3. Faça os commits no padrão `tipo: descrição em português`:
   - `feat:` recurso novo
   - `fix:` correção (inclusive de tradução)
   - `chore:` manutenção, configuração, dependências
   - `docs:` documentação
   - `test:` testes
4. Antes de abrir o PR, rode `npm test`.
5. Abra o PR para a `main` e escreva `Closes #<número da issue>` na descrição.

## Mexendo em traduções

- As traduções ficam em `data/pt/chunk-NN.json`, por id. O texto original em inglês de cada id está em `data/en/messages.json`.
- Siga o [glossário](data/GLOSSARIO.md). Ele define os termos, o que fica em inglês e as regras para placeholders e números.
- Os placeholders `{0}`, `{1}`… precisam continuar todos lá, mas podem mudar de ordem na frase.
- Rode `npm run validate` para conferir. Ele aponta placeholders faltando ou sobrando, campos vazios e ids duplicados.

## Entendendo o código

A arquitetura, o funcionamento do casamento das mensagens e o processo de atualização para uma nova versão do Dart estão em [docs/DESENVOLVIMENTO.md](docs/DESENVOLVIMENTO.md). Resumindo:

- `src/translator.ts`: recebe a mensagem em inglês e devolve a tradução. Não depende do VS Code e é testado com `node:test`.
- `src/extension.ts`: integra com o VS Code (texto inline, hover, comandos, configurações).
- `scripts/`: extração das mensagens do SDK, validação e montagem do dicionário.
