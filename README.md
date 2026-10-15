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
