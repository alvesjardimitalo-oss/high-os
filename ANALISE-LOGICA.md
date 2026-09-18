# High OS · Análise de lógica e redundância

Levantamento feito sobre a 11.2.1, com as ferramentas do próprio projeto.

---

## 1. O que foi removido

Nove funções no `app.js`, **92 linhas**, todas com uma única menção no
projeto inteiro — a própria declaração. Nenhuma era chamada, nem aparecia
no `index.html`:

`sessionMeta`, `fetchMetricsFromSource`, `metricGroupKey`, `techChanged`,
`toggleAvailablePosted`, `renderFacActivityButtonsLegacy`,
`hmDisplayName`, `grRouteText`, `mgmtOpenGeneralReport`.

### O susto durante a remoção

A primeira tentativa levou junto `eventsOfCategory`, `mapsOfEvent` e
`zonesOfMap` no planejador. Elas são arrow de uma linha, declaradas
coladas umas nas outras, e meu extrator engoliu as vizinhas. A
`eventsOfCategory` é usada em seis lugares — teria quebrado o seletor de
eventos do planejador.

Quem pegou foi o verificador de integridade, que acusou 14 funções
sumidas quando eu esperava 12. Revertido; o planejador ficou intacto
(2.053 linhas antes e depois) e as remoções ficaram só no `app.js`.

**Por isso a remoção de código morto não é tarefa mecânica.** Cada corte
precisa de verificação independente.

---

## 2. Redundância que permanece — e por que não removi

### `v909CommitStructure` sobrescrita

Na linha 13608 existe:

```js
v909CommitStructure = v9010CommitStructure;
```

A partir daí, o corpo original de `v909CommitStructure` — **76 linhas** —
nunca mais executa. É código morto que o analisador não acusa, porque o
nome continua sendo mencionado.

Não removi porque três lugares ainda chamam `v909CommitStructure`, e a
ordem de execução importa: a atribuição acontece no carregamento, e
apagar a declaração antiga sem antes redirecionar os chamadores deixaria
a referência indefinida durante uma janela do carregamento.

Correção correta, em dois passos: trocar as três chamadas para
`v9010CommitStructure`, publicar e testar; depois remover a declaração
antiga e a linha do apelido.

### `isoDay` e `mgmtDayKey` são idênticas

Corpos literalmente iguais. Uma das duas deveria chamar a outra, ou uma
deve sumir. Impacto pequeno (poucas linhas), mas é duplicação real: se a
regra de data mudar, uma vai ficar para trás.

### Dois sistemas de mapa convivendo

O prefixo `gs*` (22 funções) cuida de estruturas do Group; o `gr*` (19)
cuida de rotas exclusivas. Os dois têm `ensureMap`, `renderMap`,
`requestText` e `showRequest` — a mesma ideia implementada duas vezes,
em gerações diferentes.

Unificar daria uma economia real de algumas centenas de linhas, mas é
refatoração de verdade, com teste tela por tela. Não é limpeza.

### Gerações empilhadas

`v836*` (6 funções), `v9*` (8), `v908`, `v909`, `v9010`, `orgV92*` (13).
Cada uma foi uma tentativa de reescrever Organizações ou Estrutura, e as
anteriores ficaram. Hoje convivem `renderOrganizations` e
`v836RenderOrganizations`; `v9EditorHtml` e `v908EditorHtml`.

Todas ainda são invocadas em algum lugar, então nenhuma é código morto
no sentido estrito. Mas são caminhos paralelos para a mesma tela, e cada
um pode divergir do outro em comportamento.

---

## 3. Falhas encontradas nas próprias ferramentas

Duas, ambas corrigidas, e as duas do mesmo tipo: a ferramenta dizia
"seguro" quando não era.

**Spread confundido com acesso a propriedade.** O padrão usado para
detectar chamadas rejeitava `out.push(...expandirLinhas(rows))`, porque
os pontos do spread pareciam `objeto.metodo`. Resultado: `expandirLinhas`
aparecia como órfã, quando é ela que converte o formato compacto do
espelho mensal de volta. Removê-la teria quebrado a leitura das métricas
quando a planilha estivesse fora do ar.

**Chave de parâmetro confundida com início do corpo.** `function
f({a}={})` tem chaves nos parâmetros; o extrator começava a contar ali e
cortava no lugar errado. Deu erro de sintaxe na hora — esse falhou alto,
que é o jeito bom de falhar.

---

## 4. Ordem sugerida para o resto

1. Redirecionar os três chamadores de `v909CommitStructure` e remover as
   76 linhas mortas.
2. Unificar `isoDay` e `mgmtDayKey`.
3. Decidir sobre a Economia (cinco funções isoladas, remoção limpa).
4. Só então pensar em unificar `gs*`/`gr*` — e isso é projeto, não faxina.

---

## 5. Correções aplicadas na 11.4.0

### Entrega passou a ser atômica — a mais importante

A troca de ocupante fazia três escritas separadas, em sequência:

1. recolher a ocupação anterior,
2. gravar a nova entrega,
3. atualizar o Group.

Se a segunda ou a terceira falhasse — queda de conexão, cota estourada,
regra negando —, a primeira já tinha valido. O Group ficava **sem
ocupante ativo e com a anterior recolhida**: um estado que não existe na
operação real e que só daria para consertar documento por documento, na
mão.

Agora as três vão num único `writeBatch`. Simulei os dois cenários:

```
SEM FALHA:  3 documentos gravados  (troca completa)
COM FALHA:  0 documentos gravados  (nada mudou — a ocupação anterior segue ativa)
```

O que vem depois do lote — sincronizar a planilha oficial e atualizar o
cadastro da organização — é **consequência, não definição**. Se falhar, a
entrega continua válida e o aviso diz exatamente o que ficou pendente,
em vez de dar erro genérico sobre uma operação que já aconteceu.

### 75 linhas mortas removidas

`v909CommitStructure` era sobrescrita por `v9010CommitStructure` logo
abaixo da própria declaração. Os dois chamadores foram redirecionados
para a função que de fato executa, a declaração antiga saiu e o apelido
deixou de existir.

Aconteceu um erro no caminho que vale registrar: a primeira tentativa
redirecionou os chamadores **antes** de remover a declaração, e acabou
renomeando a própria declaração antiga — criando duas funções com o mesmo
nome. O `node --check` pegou na hora. A ordem correta é remover primeiro,
redirecionar depois.

### `mgmtDayKey` virou apelido de `isoDay`

Os corpos eram idênticos. Agora existe uma implementação só; a outra
delega. Se a regra de data mudar, muda em um lugar.

---

## 6. O que continua de pé

As gerações empilhadas (`v836*`, `v9*`, `orgV92*`, `gs*`/`gr*`)
permanecem. Todas ainda são invocadas, então não são código morto — são
caminhos paralelos para a mesma tela.

Limpar isso não é decisão técnica: exige escolher qual versão de
Organizações e Estrutura fica. Com essa escolha feita, some código de
verdade — centenas de linhas. Sem ela, qualquer remoção é aposta.
