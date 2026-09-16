# High OS V9.4.1

Corrige o bloqueio do chat da V9.4, reorganiza o Planejador de Missões e reduz a
dependência do Firebase.

---

## 1. Chat destravado (a correção do erro que você viu)

**O que aconteceu:** numa consulta de lista, o Firestore **não** avalia a regra
documento por documento — ele avalia contra os *filtros* da consulta. A regra da
V9.4 exigia `email` ou `recipientEmail` igual ao seu, mas a consulta filtrava por
`conversationId`. Como o motor não conseguia provar que todo resultado passaria,
negou tudo: *Missing or insufficient permissions*.

**A correção:** regra e consulta passam a olhar o **mesmo campo**.

- Toda mensagem agora grava `participants: [remetente, destinatário]` (ordenado).
- A consulta virou `where('conversationId','==',cid)` +
  `where('participants','array-contains', meuEmail)` + `orderBy` + `limit(80)`.
- A regra virou `myEmail() in resource.data.participants`. O Firestore consegue
  provar isso a partir do `array-contains`, então autoriza — e continua barrando
  quem tentar ler conversa alheia pelo console.

**Passos obrigatórios nesta ordem:**

1. Republique as regras (`firestore.rules`).
2. Recrie o índice: `chat_mensagens` → `conversationId` ASC + `participants`
   ARRAY_CONTAINS + `createdAt` DESC. O `firestore.indexes.json` já vem pronto.
3. Abra `tools/migrar-chat.html` logado como ADMIN, clique em **Simular** e
   depois em **Migrar**. Isso preenche `participants` nas mensagens antigas —
   sem esse passo, o histórico anterior não aparece.

A regra de `update` no chat foi aberta para ADMIN justamente para a migração
funcionar. Mensagem continua não podendo ser editada por usuário comum.

---

## 2. Planejador de Missões reorganizado

A lateral tinha 11 cards empilhados e exigia rolagem constante para qualquer
tarefa. Os **mesmos cards** foram reagrupados em quatro abas, sem recriar nenhum
elemento (todos os listeners continuam valendo):

| Aba | O que reúne |
|---|---|
| **ZONA** | dados da missão/zona, coordenada central, validação do centro |
| **PONTOS** | geração em círculo, ponto manual, importação em lote, status, lista |
| **VALIDAÇÃO** | assistente completo de CDS |
| **ENTREGA** | exportar, gerar solicitação, print do mapa |

Detalhes: a barra de abas fica fixa no topo da lateral; a aba PONTOS mostra o
total e a VALIDAÇÃO mostra quantos estão pendentes (ou ✓ quando acabou); a aba
escolhida é lembrada entre sessões; o mapa virou sticky e ganhou contadores de
validados/pendentes/total na barra de status; abaixo de 620px as abas passam a
duas colunas.

---

## 3. Validador de coordenadas refeito

**Leitura tolerante.** Antes era `split(',')` puro — qualquer variação quebrava.
Agora o parser aceita:

```
123.4,-56.7,8.9,180          tpcds 123.4, -56.7, 8.9, 180
{123.4,-56.7,8.9,180}        vector4(123.4,-56.7,8.9,180)
[123.4 -56.7 8.9 180]        123.4; -56.7; 8.9; 180
x=123.4 y=-56.7 z=8.9 h=180
```

**Diagnóstico em vez de "CDS inválida".** O painel de feedback diz exatamente o
que faltou (Z zerado, heading ausente, heading fora da faixa) em vez de uma
mensagem genérica.

**Proteção contra ponto errado.** Se a CDS colada estiver a mais de 250m do ponto
planejado, ele avisa o desvio e exige confirmação — é o erro mais comum, validar
o ponto 7 com a coordenada do 8.

**Fluxo contínuo.** Enter valida e já seleciona o próximo pendente, com foco de
volta no campo. Dá para validar a zona inteira sem tirar a mão do teclado. O
feedback mostra o desvio real em metros, o Z, o heading e quantos faltam.

**Botões novos:** COPIAR TP DESTE PONTO, IR AO PRÓXIMO PENDENTE, VOLTAR A
PENDENTE (zera o Z para permitir TPCDS + NC de novo) e VALIDAR LOTE, que aceita
`12 - x,y,z,h` por linha e valida vários de uma vez, relatando linha a linha o
que deu errado.

A importação em lote e o validador do centro passaram a usar o mesmo parser.

---

## 4. Mar de Cayo Perico com a cor de Los Santos

O mar de Los Santos vem pintado dentro dos tiles; o de Cayo era um retângulo que
nós desenhávamos com um azul fixo (`#174f70`), e a emenda aparecia.

Agora o sistema **lê a cor do próprio mapa**: ao carregar os tiles, ele amostra
cinco pixels de um tile de mar aberto, confirma que é uniforme e realmente água
(azul dominante, não muito claro) e aplica essa cor tanto no retângulo de Cayo
quanto no fundo do mapa. Funciona para Atlas, Satélite e Grid, e refaz a amostra
sozinho quando você troca de camada. Se o tile não puder ser lido por CORS, cai
num azul escuro neutro sem quebrar nada.

---

## 5. Menos dependência do Firebase

Nova camada em volta das leituras, com três níveis:

1. **Janela de 20s** — a mesma coleção não é relida na rajada de leituras que a
   navegação provoca. Corta a maior parte das chamadas repetidas.
2. **Espelho local** — toda leitura bem-sucedida é copiada para o `localStorage`.
   Se o Firestore falhar (cota estourada, queda, permissão), o painel abre com o
   último espelho e exibe a faixa **MODO LOCAL** no rodapé, deixando claro que
   nada será gravado. Quando a conexão volta, a faixa some sozinha.
3. **Contador** — `highOSRotinas()` no console mostra, por coleção, quantas
   leituras foram ao Firestore, quantos documentos vieram, quantas respostas o
   cache serviu e quantas falhas houve.

Timestamps do Firestore são convertidos na ida e reconstruídos na volta (com
`.toDate()` funcionando), então as telas de data não quebram com dado do espelho.
Toda gravação limpa a janela de cache — nenhuma tela mostra dado velho depois de
salvar.

O mapa completo de quem lê o quê, com o que continua funcionando offline, está em
**`ROTINAS-FIREBASE.md`**.

---

## 6. Ordem de publicação

1. Regras + índice do Firestore.
2. Arquivos no repositório (assets subiram para `?v=9.4.1`).
3. `tools/migrar-chat.html` como ADMIN: simular, depois migrar.
4. Ctrl+F5 e testar o chat.

---

## 7. Continua pendente

Paginação de `historico` e `metricas` (é o que mais consome cota), anexos do chat
para o Storage, `app.js` quebrado em módulos, e espelho local em IndexedDB para
passar do teto de 5 MB do `localStorage`.
