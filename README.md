# Erros do Dart em Português

Mostra os erros, avisos e lints do analisador Dart/Flutter traduzidos para português do Brasil, direto no editor.

- **Inline**: a mensagem traduzida aparece no fim da linha, no estilo Error Lens, com a cor da severidade e o fundo da linha destacado. Quando a linha tem vários problemas, aparece o mais grave seguido de `(+N)`.
- **Hover**: ao passar o mouse sobre o trecho sublinhado, a tradução e a sugestão de correção aparecem junto do tooltip original.

| Mensagem original | Como aparece |
|---|---|
| `Undefined name 'valor'.` | Nome 'valor' não definido. |
| `A value of type 'String' can't be assigned to a variable of type 'int'.` | Um valor do tipo 'String' não pode ser atribuído a uma variável do tipo 'int'. |
| `Use 'const' with the constructor to improve performance.` | Use 'const' no construtor para melhorar o desempenho. |
| `Don't use 'BuildContext's across async gaps.` | Não use 'BuildContext' depois de um 'await'. |

A tradução é um dicionário offline: não usa internet nem IA em tempo de execução. Ele cobre todas as mensagens do analisador, dos lints e do parser, e os nomes, tipos e valores do seu código são encaixados na frase traduzida. Quando uma mensagem não está no dicionário, ela aparece em inglês e fica registrada para ser traduzida depois.

## Requisitos

- VS Code 1.90 ou mais novo.
- Extensão oficial **Dart** (`Dart-Code.dart-code`), que é quem gera os diagnósticos.

## Instalação

Pelo arquivo `.vsix`:

```bash
code --install-extension dart-erros-ptbr-0.1.1.vsix
```

Ou, no VS Code: **Extensões → ⋯ → Instalar do VSIX…**

> **Perfis do VS Code:** extensões são instaladas por perfil. Se o seu projeto Flutter abre em outro perfil (por exemplo, "Flutter"), instale nele: `code --install-extension dart-erros-ptbr-0.1.1.vsix --profile "Flutter"`, ou use **Instalar do VSIX…** com esse perfil ativo. Instalar no perfil errado é o motivo mais comum de "não aparece nada".

Depois de instalar, rode **Developer: Reload Window**.

### Usando junto com o Error Lens

O Error Lens também escreve as mensagens no fim da linha, então o texto aparece duplicado (em inglês e em português). Para manter o Error Lens nas outras linguagens e deixar o Dart com esta extensão, adicione nas configurações do perfil em que o projeto abre:

```json
"errorLens.excludeBySource": ["dart"]
```

## Versões do Dart suportadas

A extensão reconhece a mensagem pelo texto, então funciona com qualquer versão do Dart. O que muda é quantas mensagens daquela versão estão no dicionário:

| Dart | Flutter (aprox.) | Mensagens cobertas |
|---|---|---|
| 3.13.x | 3.47 | 100% |
| 3.11.x | 3.41 | 100% |
| 3.8.x | 3.32 | ~97% |
| 3.5.x | 3.24 | ~93% |
| 3.0.x | 3.10 | ~89% |

Nas versões antigas, as porcentagens consideram as mensagens do analisador e dos lints. O que não estiver coberto aparece em inglês.

## Configurações

| Chave | Padrão | Descrição |
|---|---|---|
| `dartErrosPtbr.inline.enabled` | `true` | Mostra a mensagem traduzida no fim da linha |
| `dartErrosPtbr.inline.lineBackground` | `true` | Destaca o fundo da linha com a cor da severidade |
| `dartErrosPtbr.inline.showUntranslated` | `true` | Mostra a mensagem em inglês quando não há tradução |
| `dartErrosPtbr.inline.maxLength` | `220` | Tamanho máximo do texto inline |
| `dartErrosPtbr.hover.enabled` | `true` | Adiciona a tradução no hover |
| `dartErrosPtbr.severities` | `["error", "warning", "info"]` | Severidades exibidas inline (`error`, `warning`, `info`, `hint`) |
| `dartErrosPtbr.sources` | `["dart"]` | Fontes de diagnóstico traduzidas (campo `source` do diagnóstico) |

As cores podem ser trocadas em `workbench.colorCustomizations`:

```json
"workbench.colorCustomizations": {
  "dartErrosPtbr.errorForeground": "#ff6b6b",
  "dartErrosPtbr.errorBackground": "#ff6b6b14"
}
```

Existem as chaves `Foreground` e `Background` para `error`, `warning`, `info` e `hint`.

## Comandos

| Comando | O que faz |
|---|---|
| **Erros PT-BR: Ligar/desligar mensagens inline** | Alterna `dartErrosPtbr.inline.enabled` |
| **Erros PT-BR: Mostrar mensagens sem tradução** | Lista, no canal de saída "Erros do Dart em PT-BR", as mensagens que apareceram em inglês nesta sessão |

## Limitações conhecidas

- **O hover mostra também o original em inglês.** O VS Code não deixa uma extensão alterar a mensagem de outra, então a tradução é adicionada ao lado do tooltip original. Pelo mesmo motivo, o painel Problems continua em inglês.
- **Só diagnósticos do analisador Dart.** Regras de plugins como `custom_lint` têm outra fonte e não são traduzidas. Dá para incluir outras fontes em `dartErrosPtbr.sources`, mas só as mensagens que estiverem no dicionário serão traduzidas.
- **Alguns trechos vêm em inglês do próprio analisador.** Certas mensagens recebem listas ou descrições prontas, como os alvos permitidos de uma anotação (`invalid_annotation_target`), e esses trechos continuam em inglês dentro da frase traduzida.
- **Mensagens novas de versões futuras do Dart** aparecem em inglês até entrarem no dicionário.

## Desenvolvimento

O guia de desenvolvimento, com a arquitetura, o processo para atualizar o dicionário a cada versão do Dart e os passos para publicar, fica em [docs/DESENVOLVIMENTO.md](docs/DESENVOLVIMENTO.md).

## Licença

MIT
