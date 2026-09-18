# Modularização do app.js — como continuar

## Progresso

| Módulo | Conteúdo | Versão |
|---|---|---|
| `modules/metricas-parser.js` | 7 funções do parser da planilha | 10.5.0 |
| `modules/formatadores.js` | `esc`, `alvesNorm`, formatadores de data/duração/moeda | 10.7.0 |
| `modules/estado.js` | os 10 arrays globais do sistema | 10.8.0 → 11.0.0 |

**Migração de estado concluída.** Os dez arrays globais vivem em
`estado.js`: `metricas`, `metricasCache`, `faccoes`, `historico`,
`organizacoes`, `entregas`, `usuarios`, `solicitacoes`,
`requestRecords` e `userSessions`.

A partir daqui, qualquer função que grave nesses arrays pode ser movida
para um módulo — era isso que o corte destravava. Os próximos candidatos
naturais são `boletim.js`, `chat.js` e `planejador-nuvem.js`.

### Lição do caminho

A primeira tentativa usou o analisador léxico do formatador para trocar
só regiões de código. Ele falhou em silêncio: interpretou mal alguma
região e pulou trechos, deixando `userSessions` metade migrado — pior
que não ter migrado, porque leitura e escrita apontariam para lugares
diferentes. A auditoria feita com o mesmo analisador confirmou um
"tudo certo" falso.

O que funcionou foi mais simples: percorrer linha a linha, pular linhas
de comentário e exigir que o identificador não esteja colado a aspas ou
ponto. Conferência final feita com `grep` puro, independente da
ferramenta que fez a troca — que é o ponto: **a verificação não pode usar
o mesmo mecanismo que executou a mudança.**

O procedimento está automatizado e é sempre o mesmo: trocar as
referências só em região de código (o analisador do formatador garante
que strings e caminhos de coleção fiquem intactos), mover a declaração
para `estado.js`, rodar o verificador e testar as telas do módulo.

## O que já foi feito

`assets/modules/metricas-parser.js` — 7 funções do parser de métricas.

O critério de escolha foi **pureza**: só saíram funções que leem os
argumentos e devolvem um valor, sem escrever em nenhum estado global do
app. É isso que torna o corte verificável de forma independente.

A única dependência externa era a lista de Groups conhecidos, usada para
reconhecer nomes na planilha. Em vez de importar o estado do app, o módulo
recebe a lista por injeção: `definirGroupsConhecidos(faccoes)` é chamada
quando as facções terminam de carregar.

Validação feita: o módulo isolado, rodado contra a planilha real, produziu
5.901 registros, 107 datas e ARMAS01 em 16/09 com 14H=11 e 16H=11 —
idêntico ao comportamento anterior.

## O que impede cortes maiores

O `app.js` tem estado mutável no topo do arquivo:

```js
let currentUser=null, currentProfile=null, faccoes=[], solicitacoes=[],
    requestRecords=[], usuarios=[], organizacoes=[], metricas=[], historico=[]...
```

Em módulos ES, quem importa uma variável **lê** o valor atualizado, mas
**não pode atribuir** a ela. Então qualquer função que faça `metricas=...`
ou `faccoes=...` precisa continuar no mesmo módulo onde a variável vive —
ou a variável precisa virar um objeto de estado com funções de escrita.

## Ordem sugerida para os próximos cortes

1. **`modules/formatadores.js`** — `esc`, `alvesNorm`, formatação de datas,
   números e moeda. Puras, sem estado. Corte fácil, e `esc` aparece 539
   vezes no arquivo.

2. **`modules/estado.js`** — um objeto único (`export const estado = {...}`)
   reunindo os arrays globais. Escritas passam a ser `estado.metricas = ...`,
   o que libera todo o resto para sair. É o corte que dá mais trabalho e
   destrava todos os outros.

3. **`modules/boletim.js`** — já é quase independente: lê `metricas` e
   devolve texto. Depois do passo 2, sai direto.

4. **`modules/planejador-nuvem.js`**, **`modules/chat.js`**,
   **`modules/metricas-ui.js`** — na ordem que preferir.

## Regra de trabalho

Um módulo por vez, e entre cada um:

```
node tools/verificar-integridade.mjs
```

Se sair REPROVADO, alguma função sumiu no caminho — foi assim que
`loadStore`, `mergeOfficialPresets` e as cinco funções do Google Sheets
desapareceram antes de existir essa checagem.

E teste no `high-os-dev` antes de levar para o `main`.
