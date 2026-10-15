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
