# HIGH OS

Central interna de gestão do Ilegal do High Roleplay.

## Versão operacional

**V12.5.0** — segurança, automação e Planejador de Missões.

A documentação histórica permanece no Git. Este README descreve somente a estrutura atualmente útil do sistema.

## Organização funcional

### Visão Geral
- Dashboard operacional.

### Operação Ilegal
- Organizações / Groups.
- Ocupação, QG/Favela, liderança e histórico.
- Entregas, recolhimentos e solicitações relacionadas à operação.

### Inteligência
- Métricas 14H / 16H / 21H / 23H.
- Visão geral, facção, comparativos, relatórios, boletim e gestão.

### Eventos e Missões
- Planejador de Missões.
- Eventos, zonas, spawns, validação de coordenadas, safe/gás e entrega técnica.

### Sistema
- Usuários e níveis de acesso.
- Administração, integrações e rotinas técnicas.

## Estrutura técnica

- `index.html` — estrutura das telas.
- `assets/app.js` — aplicação legada em processo de modularização.
- `assets/mission-planner.js` — Planejador de Missões.
- `assets/modules/eventos-painel.js` — catálogo dos eventos do painel `/evento` (tipos, mecânica e etapas da solicitação); script clássico carregado antes do Planejador.
- `assets/modules/estado.js` — estado compartilhado.
- `assets/modules/formatadores.js` — utilitários e formatação.
- `assets/modules/metricas-parser.js` — parser isolado das métricas.
- `assets/style.css` — estilos legados/base.
- `assets/high-refresh.css` — camada visual atual.
- `assets/mission-planner.css` — estilos do Planejador.
- `assets/ui-kit.css` / `assets/ui-kit.js` — componentes comuns.
- `firestore.rules` / `firestore.indexes.json` — segurança e índices.
- `tools/` — diagnóstico, migração, backup e verificações de integridade.

## Regra de manutenção

Código novo deve entrar no módulo responsável pela função. Evitar adicionar novas regras diretamente ao `app.js` quando a função puder ser isolada.

Antes de remover código legado:
1. confirmar que não há referência ativa;
2. executar as verificações de integridade e regras;
3. testar no ambiente DEV;
4. só depois integrar à branch principal.

## Verificação

As rotinas em `tools/verificar-integridade.mjs` e `tools/verificar-regras.mjs` devem continuar verdes antes de publicação.

## Segurança

Não alterar ou remover regras do Firestore apenas por parecerem sem uso. Coleções, permissões e rotinas de persistência devem ser validadas contra o código antes de qualquer limpeza.

Para detalhes da V12.5, consulte `LEIA-ME-V12.5.md`.


## V13 — padrão atual

A V13 organiza o sistema por domínio e adota uma apresentação operacional baseada em cards, KPIs, tendências, barras e comparativos, deixando tabelas extensas para detalhamento.

Módulos extraídos do controlador principal:
- estado e formatadores;
- parser/configuração de métricas e boletim;
- configuração de solicitações;
- utilitários de chat;
- base de Groups;
- defaults do Dashboard;
- parâmetros da camada de cache/Firestore.

O High OS Bot segue a mesma separação por domínio: administração, anúncios, facções, métricas, eventos e consultas. A especificação inclui `/anunciar`, limpeza manual de conversas, retenção automática configurável, permissões e auditoria.

Regra de manutenção: configuração estática e funções puras não devem voltar para `assets/app.js`. Novos recursos devem entrar no módulo do domínio correspondente.


## V12.8 — Planejador alinhado ao painel /evento

- Tipo do evento (Dominação, Fac x Fac, Modo Sobrevivência, Battle Royale, Hoje é Dia de Guerra, Zona de Conflito) define a mecânica escrita na solicitação.
- Cada zona segue o ciclo: Rascunho → Pronta p/ enviar → Aguardando cidade → No /evento; qualquer mudança de geografia depois do envio vira "Alterada após envio".
- Zonas oficiais já existentes entram como "No /evento" (linha de base).
- Solicitação do evento inteiro: um único texto com todas as zonas prontas, no padrão Evento > Zona do /evento.
- Modo Sobrevivência avisa quando faltam zonas (3 previstas) ou quando as áreas se sobrepõem.


## V12.9 — Planejador: rastreio da solicitação e checagens do /evento

- **O que mudou:** cada envio/aplicação guarda uma cópia da geografia. Zona "Alterada após envio" mostra exatamente o que mudou (centro, raio, spawns movidos/novos/removidos, safe) e a solicitação de alteração já sai com o bloco "ALTERAÇÕES EM RELAÇÃO À VERSÃO ATUAL NO JOGO".
- **Cancelar envio:** quando a cidade recusa/pede ajuste ou o envio foi marcado por engano, a zona volta para a versão que está no jogo (ou para Pronta, se é nova).
- **Capacidade:** 1 spawn por facção; cada zona mostra quantas facções comporta e o evento avisa quando as zonas do /evento comportam números diferentes. O pacote informa o limite de inscrições pela menor zona.
- **Equilíbrio dos spawns (aviso, não bloqueia nem altera CDS):** spawns muito mais perto/longe do centro que a média e pares colados em relação ao espaçamento típico da zona.
- **Discord:** textos acima de 2.000 caracteres são divididos em partes numeradas, sem cortar CDS.
- **Prazo da cidade:** solicitação sem retorno há mais de 48 h (`PRAZO_RETORNO_H` em `eventos-painel.js`) aparece como ATRASADA na central.
- **Histórico:** cada zona mostra o histórico do ciclo (enviada, reenviada, cancelada, aplicada) com data e usuário.


## V12.10 — Padrão dos eventos com zona de gás (solicitação de 13/10)

- `PADRAO_GAS` em `eventos-painel.js` registra a solicitação de sistema enviada à cidade para Modo Sobrevivência, Fac x Fac e Battle Royale: safe final até raio zero, dano contínuo até sobrar uma equipe, HUD do player, inventário inicial, espectador/`/surrender` e comemoração de vitória.
- Toda solicitação de zona desses eventos sai com o bloco do padrão; a movimentação da safe termina em "fechamento final até raio zero".
- Modo Sobrevivência: aviso quando as fases da safe (tempos/dano) de uma zona diferem das demais; a solicitação exige comportamento idêntico entre as 3 zonas.
- Botão **PADRÃO GÁS** (central e zona): resumo da HUD/regras e situação dos testes por zona.
- **Testes no jogo:** confirmar uma zona como aplicada abre os 15 critérios de validação da solicitação; pendências ficam visíveis na zona e na central até serem testadas.


## V12.11 — Meta de facções e geração dos spawns que faltam

- **Meta do evento:** por padrão, o número de facções com Group ATIVO no High OS (`HighOSMissionCloud.faccoesAtivas`); o botão **META** na central fixa outro número por evento (vazio volta ao automático).
- A central avisa quais zonas têm menos spawns que a meta; a zona mostra "Faltam X spawns".
- **GERAR X SPAWNS QUE FALTAM:** cria só os spawns que faltam, sem alterar nenhum existente, na mesma faixa de distância do centro, nos vãos entre os spawns atuais, virados para o centro e (eventos com gás) dentro da safe inicial. Entram PENDENTES e seguem o fluxo normal de validação da CDS real no FiveM.


## V12.12 — Spawns longe da água e dos QGs

- **Água:** o Planejador lê a cor do próprio mapa (tiles Atlas em Los Santos/condado e o satélite de Cayo Perico; fora da ilha é mar). Vale para oceano, Alamo Sea, represas, rios e canais.
- **QG:** CDS de QG/favela dos Groups (`HighOSMissionCloud.qgs`); distância mínima `RAIO_QG_M` = 150 m em `eventos-painel.js`.
- **GERAR SPAWNS QUE FALTAM** descarta candidatos na água ou perto de QG antes de escolher; se a faixa não comportar todos, avisa quantos conseguiu.
- Checklist da zona avisa spawns existentes na água ou perto de QG (aviso: píer, ponte e barco podem enganar a leitura; nada é movido).


## V12.13 — Spawn de risco: cria, marca e ajusta no mouse

- O gerador nunca deixa faltar spawn: se não houver espaço seguro suficiente, cria os restantes mesmo em área de risco.
- Pinos na água ou perto de QG ficam com contorno LARANJA no mapa (popup diz o motivo).
- Em modo edição, arrastar um pino remove a validação e abre direto a aba VALIDAÇÃO com o campo de CDS em foco (validador nativo).


## V12.14 — Partidas e Planejador inteligente

- **PARTIDAS** (central e zona): registra zona, data/hora, nº de facções, campeã (lista das facções ativas) e spawn da campeã. O spawn é guardado com a CDS, então a análise resiste a renumeração.
- **Zona sugerida:** entre as zonas no jogo, a que está há mais tempo sem partida (rodízio automático).
- **Vantagem de spawn:** spawn que vence ≥3 vezes e ≥2,5× o esperado (partidas ÷ spawns) vira aviso na zona, na central e no pino (🏆).
- **Vantagem de lado:** com 6+ partidas, um lado (norte/leste/sul/oeste) com metade ou mais das vitórias vira aviso.
- **Facção dominante:** facção com 40%+ das vitórias nas últimas 10 partidas aparece na central.
- **Participação real:** média e pico de facções; aviso quando o pico já passou do número de spawns da zona; a META sugere o pico registrado.


## V12.15 — Montagem inteligente (gás e Dominação)

- **⚡ SAFE AUTOMÁTICA:** tempos pela duração alvo (`DURACAO_ALVO_MIN` = 20), raios por fase (`SAFE_RAIOS`), dano por fase (`SAFE_DANO`), fechamento final até zero (`finalCloseSeconds`) e 3 opções de SAFE 2 e de SAFE 3 em terra firme, longe de QG, com toda SAFE 3 válida para qualquer SAFE 2 sorteada. A solicitação passa a informar o fechamento final e a duração prevista do ciclo.
- **⚖ CENTRO JUSTO:** calcula pelas CDS dos spawns o centro mais equidistante (ajuste de círculo + refinamento do pior caso). Na Dominação reposiciona a área disputada; no gás leva a safe e ajusta o raio inicial. O checklist avisa quando o centro pode ficar mais justo.
- **🔎 SUGERIR LOCAIS:** varre a área visível do mapa e marca até 3 locais (L1–L3) com mais terra firme, sem QG e sem sobrepor zonas do evento; "usar este local" leva centro (e, se quiser, os spawns no mesmo desenho).
- **✨ OTIMIZAR SPAWNS:** reposiciona só os spawns na água, perto de QG, fora da safe, colados ou fora da faixa de distância, mantendo a numeração.
- **Altura suspeita:** CDS validada muito acima/abaixo da mediana da zona (risco de limbo ou de nascer no alto) vira aviso para revalidar.
- Correções: `fitZone` quebrava ao enquadrar a zona; círculos de spawn herdavam a cor da camada anterior no canvas. Versões dos assets atualizadas no `index.html` (12.15.0) para o navegador baixar o código novo.


## V12.16 — Varredura de erros e acabamento visual

- Corrigido: o estilo global `.brand` (logo do topo) quebrava cards e etapas com tom "brand" (ex.: PRONTAS P/ ENVIAR).
- Corrigido: a barra da zona grudava em `top:0` e cobria o topo do site; agora fica logo abaixo (calculado pela altura real do topo). No celular quebra em linhas e as ações rolam na horizontal.
- Corrigido: zona oficial sem nenhum spawn (Cayo Perico do preset) aparecia como "No /evento"; agora é Rascunho e não conta como zona no jogo.
- Novo aviso: centro com altura suspeita (CDS do centro muito acima/abaixo dos spawns — ex.: Dominação Sul com z=481).
- Checklist agrupado: pendências que bloqueiam, avisos, e verificações OK recolhidas.
- Cards de zona com barra de validação e nº de partidas; excluir evento virou ícone; janelas rolam por dentro em telas baixas; painel de camadas começa recolhido no celular.


## V12.17 — TP de teste com Z estimado (sem limbo)

- Ponto pendente não vai mais com Z=0 no TP: o Z é estimado pelas CDS já validadas por perto (spawns e centros de todas as zonas + CDS de QG dos Groups), com média ponderada pela distância (até 600 m, 6 mais próximas).
- Margem de segurança acima do chão conforme a confiança: alta (CDS a < 80 m) +1,5 m · média (< 250 m) +3 m · baixa +6 m. Em terreno irregular usa a maior altura próxima para nunca nascer enterrado.
- CDS com altura suspeita (ex.: centro em z=481) ficam fora da base de alturas.
- A validação continua obrigatória: o Z estimado serve só para o TP; o ponto fica pendente até colar a CDS real.
- Vale para COPIAR TP do ponto, cópia por linha, COPIAR CDS PARA TESTE e COPIAR TP DO CENTRO; a tela de validação mostra o Z estimado e a confiança.
## V14 — Ocupação dos Groups, Entrega e Dashboard refeitos

### Regra única (`assets/modules/ocupacao.js`)
- **ASSUMIDA:** status ATIVA **e** facção preenchida · **DISPONÍVEL:** sem facção, com QG · **SEM QG:** sem facção e sem QG · **REVISAR:** dados contraditórios.
- Organizações, Dashboard e Entrega usam a mesma função (`situacaoGroup`). Antes eram três regras diferentes.
- A rotina V8.20, que gravava status ATIVA sozinha em qualquer Group com facção preenchida, foi desligada. As contradições agora vão para a revisão.
- O perfil do Group não deixa mais salvar facção com status vago nem a mesma facção em dois Groups.

### Entrega (`assets/modules/entrega.js`)
- Etapas: Group → Facção → Benefícios → Revisão, com validação em cada passo.
- Bloqueia Group SEM QG / REVISAR e facção que já ocupa outro Group.
- **Troca de ocupante:** Group ocupado pode ser entregue com motivo, justificativa e confirmação. Grava o recolhimento da anterior (histórico `RECOLHIMENTO`, organização `SEM_GROUP`) e a entrega (`ENTREGA_GROUP`), para o bot anunciar os dois.
- Mesmas coleções e campos de antes (`entregas`, `faccoes`, `organizacoes`, `historico`); as escritas de ocupação vão num lote único (tudo ou nada). A data aceita dd/mm/aa ou dd/mm/aaaa.
- O modal antigo `#newDeliveryModal` continua no HTML só por compatibilidade; `openNewDelivery()` abre o fluxo novo.

### Dashboard (`assets/modules/painel-ocupacao.js`)
- **Facções disponíveis:** lista pronta para entrega com segmento, QG, há quanto tempo está vago, status do anúncio no Discord e as ações ANÚNCIO (copiar texto), MARCAR POSTADO e ASSUMIR.
- **Ocupação do Ilegal:** assumidas, disponíveis, sem QG e a revisar, barra de distribuição e ocupação por segmento (assumidos + livres).
- **Revisar ocupação:** lista contradições e cadastros incompletos com as correções possíveis. "Aplicar" em lote só para os casos sem ambiguidade. Cada correção gera histórico `CORRECAO_OCUPACAO`, que não é anunciado.


## V14.1 — Métricas por facção (`assets/modules/metricas-motor.js`)

- **A métrica pertence à facção que ocupava o Group no horário da coleta.** O motor monta a linha do tempo de cada Group com entregas, recolhimentos, trocas (V14) e transferências de painel (histórico `TRANSFERENCIA_PAINEL`), e reparte cada linha da planilha por horário de coleta.
- O histórico segue a facção: as coletas no Group antigo aparecem no Group atual dela, com a marcação "no Drogas03" no histórico diário.
- Os dias da facção anterior não entram mais na conta da nova. Facção que saiu fica fora das visões operacionais, e o total aparece em "registros de facções que saíram (fora)".
- Antes do primeiro registro de ocupação: vale a data de entrega do cadastro; se não houver data e o Group está assumido, vale a facção atual (o cadastro incompleto aparece em Revisar ocupação).
- Coleta em Group vago no horário vira anomalia ("Group vago com player"), fora de ranking e relatórios.
- **Coleta parcial:** "parcial — aguardando +N coletas" (horário ainda não chegou) e "N coletas sem registro" (já passou), no histórico diário, no resumo da competência (HOJE x/4) e na cobertura do painel de evolução, que agora conta os 4 horários padrão. A comparação com o período anterior usa só os mesmos horários quando o dia está parcial.
- Alertas semanais do Dashboard passam a comparar a mesma facção; `metricGroupOccupied` usa a regra única de ocupação.
- `estado.metricasCache` continua com as linhas brutas (sincronização com planilha/espelho intacta); `estado.metricas` é a versão atribuída.
