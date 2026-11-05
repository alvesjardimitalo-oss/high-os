# High OS V12.6 — Troca de Group (permissões)

## O que faz

Dois Groups trocam de lugar **sem nenhum blip sair do lugar**. Exemplo:
Drogas03 (Favela A) ⇄ Armas03 (Favela B).

- Todos os blips da Favela A passam a ter permissão **Armas03**, e os da Favela B
  passam a ter permissão **Drogas03**. Isso vale para craft, garagens, blindados,
  heliponto, barbearia, tatuagem, loja de roupas, arena, shop exclusivo, rádio,
  telão, baú e início de rota.
- O **CRAFT** da Favela A, que produzia drogas, passa a produzir armas (as
  receitas são do Group, o blip é do local).

## Onde fica

- **Administração › Groups**: botão **⇆ TROCA DE GROUP** na barra e
  **⇆ TROCAR GROUP** em cada linha, que já abre com a origem preenchida.
- **Editor do Group**: botão **⇆ TROCAR GROUP (PERMISSÕES)**, ao lado de
  TROCAR QG.

Só ADMIN executa a troca.

## A escolha da facção

| Opção | O que acontece |
|---|---|
| **Facção fica no local** (padrão) | Cada facção continua na sua favela e é setada no outro Group. É a troca de produto. |
| **Facção acompanha o Group** | Cada facção continua no seu Group e passa a usar a outra favela. |

Na segunda opção, a prévia avisa que o **conteúdo do baú** fica no local.

## O que fica com o Group e o que troca

**Fica com o Group** (identidade e permissão): nome, segmento, produto, receitas
do craft, itens de farm, rota exclusiva (nome e pontos), VIP Org, chat da
facção, salário, contingente, anúncio e métricas.

**Troca** (físico): QG, coordenada base, estrutura completa (V9 e legado), CDS de
todos os blips e imagem do anúncio.

## Segurança da operação

- **Prévia lado a lado** antes de confirmar, com cada blip, a CDS e a mudança de
  produto no craft.
- **Gravação atômica**: os dois Groups, os vínculos das organizações e o
  histórico vão num único `writeBatch`. Ou grava tudo, ou nada.
- **Histórico** `TROCA_GROUP` com o estado de antes e de depois dos dois Groups,
  o motivo e o texto da solicitação.
- **Solicitação pronta para o Discord** com CDS e permissão antiga → nova por
  local, e a setagem das facções. Ela é salva como PENDENTE e tem botão de
  copiar.
- **Planilha oficial** sincronizada em seguida, como na Troca de QG.
- Cada Group ganha o campo `trocaGroup` (par, modo, data, quem fez) e `localDe`.

## Ajuste interno necessário: `localDe`

As bases estáticas de CDS (`GROUP_PROFILE_SOURCE` e `GROUP_BASE_CORRECTIONS`) eram
buscadas pelo **nome do Group**. Depois de uma troca, isso puxaria as
coordenadas antigas de volta. Agora elas são buscadas por `localDe`, que indica
de qual local físico vieram os dados. Quando `localDe` não existe, continua
valendo o nome do Group, então nada muda para quem nunca trocou.

O botão "Atualizar perfis oficiais" também passou a casar pelo local, e deixa
de sobrescrever o produto de um Group que já foi trocado.

## Testado

Com base simulada (Drogas03 só com dados legados, Armas03 com estrutura V9):

- a estrutura de cada Group depois da troca é exatamente a do outro antes, com o
  craft já renomeado para o novo produto;
- as receitas não se movem;
- fazer a troca e desfazer devolve tudo ao estado original;
- nenhuma CDS antiga volta pelo preset estático;
- nenhum campo `undefined` vai para o Firestore.

## Métricas

As métricas continuam por Group. Depois de uma troca com a facção ficando no
local, o histórico de métricas do Drogas03 até aquele dia é da facção antiga.
Considere isso ao comparar semanas.

---

## Conferência de amenidades (origem × destino)

Amenidade **comprada pertence à facção**, não ao Group nem ao local. Antes de
confirmar, o modal mostra uma tabela com cada amenidade dos dois lados e o
resultado:

| Resultado | Quando |
|---|---|
| **EFETIVAR** | A facção comprou, o blip fica onde está, mas a permissão muda de Group. Aparece com a facção ficando no local. |
| **IMPLANTAR** | A facção comprou e no novo lugar não existe. A CDS fica "a definir" e aparece como pendência. |
| **TRANSFERIR** | É uma compra vinculada ao Group (rota exclusiva, rádio, VIP Org, chat, salário). Segue a facção para o novo Group. A rota é renomeada, por exemplo RotaExclusivaDrogas03 → RotaExclusivaArmas03, com os mesmos pontos. |
| **REMOVER** | Existe no novo lugar, mas foi comprada pela **outra** facção. Quem faz o caminho inverso não herda o que o outro pagou. |
| **MANTER** | As duas facções compraram a mesma amenidade. |

**Como o sistema sabe o que é compra:** é o que **não** está no Perfil Padrão
de Entrega do Group. Sem perfil cadastrado, contam como compradas: Farm AFK,
Rota Exclusiva, Telão, Arena, Shop Exclusivo e Rádio Exclusivo. O ADMIN pode
**clicar na célula** para alternar entre COMPRADA e BASE antes de confirmar.

As ações entram na solicitação do Discord, numa seção própria por Group. No
Firestore:
- REMOVER limpa o blip do Group, incluindo legado e preset, para ele não
  voltar sozinho;
- TRANSFERIR copia os dados da facção;
- cada Group guarda `pendenciasTroca` com o que falta executar.

Nos blocos por local, o blip que vai ser removido aparece marcado com "NÃO passa
para o …".

### Novo campo: Farm AFK

Farm AFK é um **blip**: o player fica parado na CDS e recebe os **insumos das
receitas do craft** do Group. Por isso ele é tratado assim:
- o ponto é do local, como os outros blips;
- os insumos **não são configurados**: o Farm AFK lê automaticamente a receita do
  craft do Group em que está implantado. Na troca, só muda a permissão, e ele
  passa sozinho a farmar a receita do novo Group. A solicitação mostra isso de
  forma informativa: "passa a farmar automaticamente a receita do Armas03:
  Corpo de Rifle, Chapa de Metal… (antes: Lona, Acetona…)";
- o modal avisa quando o Group que vai ficar com o Farm AFK não tem receita
  cadastrada, porque nesse caso o farm ficaria sem insumos.

Farm AFK passa a ser uma amenidade cadastrável, com CDS, no editor do Group (ao
lado de Arena). Também entra na estrutura e na lista de instalações.

---

## Métricas são da facção

A coleta é feita por Group, mas a métrica pertence à **facção que assumiu o
Group**. A série acompanha a facção em qualquer movimento:

| Movimento | O que acontece com as métricas |
|---|---|
| **Troca de Group** (facção fica no local) | O histórico inteiro da facção aparece sob o Group que ela ocupa agora. Peitanove: Drogas03 até 22/09 e Armas03 a partir de 23/09, numa série só. A data de virada fica no campo do modal. |
| **Transferir Painel** | Mesma regra, com virada na data da operação. |
| **Troca de Group** (facção acompanha) e **Trocar QG** | Nada muda, porque a facção continua no mesmo Group. |
| **Recolhimento** | O que a facção coletou sai da série do Group, contando até o dia do recolhimento. Se ela assumir outro Group depois, a série vai junto. |
| **Entrega** | O novo ocupante **não herda** o que foi coletado antes da data de entrega dele. |

O efeito aparece em ranking, comparação semana × semana, alertas do Dashboard,
triagem, boletim e relatórios, sem mudança nessas telas.

**Como é guardado** (nos próprios documentos dos Groups, sem coleção nova):
- `ocupacoesAnteriores`: períodos encerrados, com facção, Group, início e fim.
  É gravado na troca, na transferência de painel e no recolhimento.
- `ocupacaoDesde`: início da ocupação atual quando a facção chegou por troca
  ou transferência. Sem ele, vale a `dataEntrega`.

**Nada é regravado:** a planilha, o Firestore e `estado.metricasCache`
continuam com a coleta bruta. A linha remapeada guarda `groupColeta`. O que sai
da vista (facção que não está em Group nenhum, ou coleta de antes da entrega do
ocupante atual) fica em `estado.metricasForaDeOcupacao`.

**Atenção à Data de Entrega:** ela passa a marcar o início da série do ocupante.
Se estiver errada no cadastro, parte do histórico real some da vista. Se estiver
vazia, nada é cortado.

**Testado:**
- troca em 23/09;
- coletas de antes da entrega de cada facção;
- recolhimento da Peitanove seguido de ela assumir outro Group. A série a
  acompanhou até o Group novo, e a coleta da facção antiga desse Group saiu da
  vista;
- em todos os casos, a coleta bruta ficou intacta.

---

## Correção: "Erro ao recolher: historyMillis is not defined"

A função `historyMillis` era usada para ordenar as entregas no Dashboard
(anomalias) e no perfil da facção, mas **nunca tinha sido definida**. O erro só
aparecia quando um Group tinha duas ou mais entregas no histórico. Por isso
estourava no fim do recolhimento, na hora de recarregar as telas.

O recolhimento em si **já tinha sido gravado** quando o erro apareceu: Group
vago, histórico e evidência registrados. O que falhou foi a recarga da tela
logo depois.

Corrigido, junto com mais duas chamadas órfãs do mesmo tipo:
`updateRequestPreview` (modal de solicitação) e `renderTeamCallFiles` (sala de
chamada).

### Novo: `tools/verificar-chamadas.mjs`

Reprova o commit quando o código chama uma função que não existe em nenhum
arquivo. Roda no GitHub Actions. Contra a versão anterior ele aponta exatamente
esses três problemas; contra esta, aprova.

---

## Aviso de versões misturadas

Se o `index.html` e o `app.js` publicados forem de versões diferentes, os botões
novos aparecem na tela mas não têm código por trás, e o clique não faz nada.
Agora o `app.js` confere a própria versão contra o `?v=` que o `index.html` usa
para carregá-lo. Se não baterem, aparece um aviso vermelho logo ao entrar. O
console também passa a mostrar a versão certa (`HIGH OS V12.6.0 · sistema
carregado`).

**Ao publicar, suba sempre o pacote inteiro da mesma versão.**

---

## Correção: Transferir Painel / Trocar QG "não acontece nada"

Esse problema já existia antes desta versão. O botão abria o modal usando a
função `show()`, mas essa função serve para trocar a **tela inteira** do sistema
(login, acesso negado, painel) e escondia o painel. Ao confirmar e fechar o
modal, sobrava uma tela vazia. A operação chegava a gravar, mas parecia que nada
tinha acontecido.

Agora o modal abre por cima do painel, como os outros. Testado no navegador:
abrir, escolher o destino, confirmar, gravar, recarregar os Groups e mostrar o
aviso "Operação concluída".
