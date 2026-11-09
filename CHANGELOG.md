# Changelog

## 0.1.1 — 2026-11-09

- Palavras em inglês geradas pelo analisador dentro das mensagens agora são traduzidas, como o tipo de instrução em `curly_braces_in_flow_control_structures` ("As instruções de um 'if'…") e o tipo de elemento em mensagens como `wrong_number_of_type_arguments_element` ("'Mapa' (classe) declara…"). Nomes do seu código nunca são traduzidos.
- Mensagens com números reescritas para não errar a concordância com 0 ou 1, por exemplo "'soma' precisa de 2 argumentos posicionais, mas a chamada tem 1" e "Argumentos posicionais demais (esperados: 1; encontrados: 2)".
- `use_build_context_synchronously`: "Não use 'BuildContext' depois de um 'await'."
- `unnecessary_null_comparison`, `await_only_futures`, `matching_super_parameters`, `ambiguous_import`, `prefer_inlined_adds` e `prefer_spread_collections` com textos corrigidos.
- Termos padronizados: wildcard, tear-off, underscore e loop. Também foi removida a vírgula antes de "ou" em listas.

## 0.1.0 — 2026-11-09

- Primeira versão.
- Tradução inline (fim da linha) e no hover dos diagnósticos do analisador Dart.
- Dicionário offline com 1.488 mensagens do analisador, dos lints e do parser (SDK 3.11.5 e 3.13.5).
- Configurações de severidade, fontes, cores, tamanho do texto e mensagens não traduzidas.
- Comandos para ligar/desligar o inline e listar as mensagens sem tradução.
