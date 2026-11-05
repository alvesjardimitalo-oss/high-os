# High OS · Análise completa do sistema (V9.6.0)

Levantamento feito sobre o pacote enviado (app.js com 3.724 linhas, planejador
com 1.222, quatro folhas de estilo, 88 arquivos no total).

---

## 1. Por que as métricas pararam de ser alimentadas

Não é uma limitação do Firebase. **É o código gastando a cota em poucas horas.**

Os números do plano gratuito (Spark) são: 50.000 leituras de documento por dia,
20.000 gravações por dia, 1 GiB de armazenamento, com reset à meia-noite no
horário do Pacífico (4h ou 5h da manhã em Brasília).

O ciclo de sincronização automática fazia, **a cada 5 minutos, em cada aba
aberta, e ainda a cada troca de aba do navegador**:

| Passo | Custo com N linhas na planilha |
|---|---|
| `getDocs(metricCol)` antes de comparar | N leituras |
| lê a planilha (não conta) | — |
| `persistMetricRows(sheetRows)` — regravava **todas** as linhas, mesmo sem mudança | N gravações |
| `addDoc(histCol)` de log, todo ciclo | 1 gravação |
| `getDocs(metricCol)` de novo, depois de gravar | N leituras |
| `onSnapshot(metricCol)` recebendo o eco da gravação | N leituras |

Com 2.000 linhas de métricas, **um único ciclo** custava por volta de 6.000
leituras e 2.000 gravações. A cota de gravação acabava no décimo ciclo — menos de
uma hora. A partir daí o Firestore recusa com `resource-exhausted`, e como o erro
era engolido por um `catch` silencioso, a tela só mostrava dados velhos sem dizer
o motivo. Era exatamente o que você estava vendo.

### O que mudou

**Grava só o que mudou.** A função `compareMetricSources` já sabia quais linhas
eram novas ou alteradas, mas o código gravava a planilha inteira assim mesmo.
Agora existe `metricRowsPendentes()`, e o lote leva apenas essas linhas. Num dia
normal isso cai de N gravações para algumas dezenas.

**Não relê a coleção.** As duas leituras completas por ciclo sumiram: a
comparação usa a cópia que já está em memória, e depois de gravar o estado é
aplicado localmente — a planilha já é a versão mais nova, não há o que reler.

**Ciclo de 30 minutos, com trava entre abas.** Antes eram 5 minutos por aba, mais
um disparo a cada `visibilitychange`. Agora há uma trava em `localStorage`: três
abas abertas fazem o trabalho de uma.

**Tempo real desligado por padrão.** A escuta da coleção inteira cobra uma
leitura por documento a cada alteração. Com sincronização de 30 em 30 minutos ela
não compensa; virou um interruptor na tela de Métricas, para quando alguém estiver
acompanhando ao vivo.

**Heartbeat de sessão a cada 5 minutos**, não a cada troca de aba.

**Log de histórico só quando algo muda**, em vez de um registro por ciclo.

**Painel de consumo visível.** Na tela de Métricas agora aparece quanto da cota
diária foi usado na sessão, quando é a próxima sincronização, um botão de
sincronizar na hora e o interruptor de tempo real. Se a cota estourar, o sistema
diz isso em vermelho, com a hora do reset, em vez de falhar calado.

### Estimativa depois da mudança

Um dia típico com 2.000 linhas e 3 pessoas usando passa de algo como 150.000
leituras e 40.000 gravações para a faixa de 6.000 leituras e menos de 500
gravações. Folga de sobra dentro do plano gratuito.

---

## 2. Problemas estruturais que continuam de pé

Em ordem de risco:

**1. `historico` e `metricas` crescem sem limite e são lidos inteiros.** Enquanto
não houver `where` por período com cursor, o consumo volta a subir sozinho
conforme a base cresce. É o próximo trabalho que recomendo.

**2. `firestore.rules` não estava no pacote que você me enviou.** Ou ficou de fora
do repositório, ou não chegou a ser publicado. Sem ele, qualquer usuário logado
pode ler e gravar tudo pelo console do navegador, independentemente do que a
interface mostra. Devolvi o arquivo no ZIP; confira no Console se a regra
publicada é essa e não a padrão de teste.

**3. `app.js` com linhas de 20 mil caracteres.** As linhas 1790 e 86 tornam
impossível revisar diff no GitHub ou isolar um bug. Rodar Prettier e quebrar em
módulos (`auth`, `metrics`, `orgs`, `chat`, `ui`) é o investimento que mais
economiza tempo daqui para frente.

**4. Anexos do chat em base64 dentro do documento**, até 600 KB cada, contra 1 GiB
de armazenamento total no plano gratuito. Umas 1.700 imagens enchem a conta.
O lugar certo é o Firebase Storage.

**5. 164 `alert()` ainda no código.** Já existe o sistema de toast por trás, mas
vale trocar as chamadas nos fluxos principais para ter títulos e ações.

---

## 3. O que já está bom e não deve ser mexido

O modelo de permissões por módulo (VIEW/EDIT com papéis) é sólido e agora tem
correspondência no servidor. O planejador de missões, depois da reorganização em
abas, cobre o fluxo real de ponta a ponta. A camada de resiliência com espelho
local e modo local evita que uma queda do Firebase derrube o painel inteiro.

---

## 4. Ordem sugerida daqui

1. Publicar a V9.6.0 e acompanhar o painel de consumo por um dia inteiro.
2. Confirmar que `firestore.rules` publicado é o do repositório.
3. Paginação de `historico` e `metricas` por período.
4. Anexos do chat para o Storage.
5. Quebrar o `app.js` em módulos.

Se o volume de métricas crescer muito, vale considerar o plano Blaze **com teto
de gastos configurado** — com o consumo já corrigido, a conta tende a ficar em
zero ou centavos, e some o risco de o sistema parar no meio do mês.
