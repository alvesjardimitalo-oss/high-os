/* HIGH OS · Catálogo de eventos do painel /evento
 * ---------------------------------------------------------------
 * Script clássico (sem import/export): o Planejador é um IIFE e
 * carrega antes do app.js. Expõe window.HighEventCatalog.
 *
 * Espelha o painel in-game /evento: o jogador escolhe o EVENTO e
 * depois a ZONA. Cada tipo define se usa gás/safe, quantas zonas a
 * equipe costuma manter e o texto de mecânica que entra na
 * solicitação padronizada enviada à cidade.
 * --------------------------------------------------------------- */
(() => {
  const PANEL_PADRAO = '/evento';

  const MEC_FACXFAC = [
    'Cada facção deverá nascer em uma coordenada diferente da zona selecionada.',
    'Todos os participantes deverão receber automaticamente os itens necessários no inventário conforme o padrão atual do Fac x Fac.',
    'Deverão existir caixas de loot espalhadas pelo mapa conforme o funcionamento atual do evento.',
    'Após alguns minutos, a zona de vitória/safe deverá ser ativada e iniciar o fechamento progressivo.',
    'Quem permanecer fora da zona deverá receber dano do gás conforme o sistema atual.',
    'Ao morrer, o jogador deverá dropar uma caixa contendo seus itens, conforme o funcionamento atual do Fac x Fac.',
    'O comando /evento deverá continuar permitindo escalar a facção de qualquer lugar do mapa, salvar a escalação e aguardar o horário do evento.',
    'O sistema de ranking próprio e as premiações mensais do Fac x Fac deverão permanecer inalterados.',
    'Os membros poderão utilizar o N para pingar o mapa para seus aliados, conforme o padrão atual do evento.'
  ];

  const MEC_GAS = [
    'Todos os spawns deverão iniciar dentro da safe inicial.',
    'Após o início, o fechamento da safe/gás deverá seguir a configuração e funcionamento atuais do evento.'
  ];

  const MEC_DOMINACAO = [
    'Os spawns poderão ficar dentro ou fora da área de Dominação conforme a distribuição planejada.',
    'A área de Dominação deverá permanecer fixa, sem fechamento progressivo de gás/safe.'
  ];

  /* Padrão dos eventos com zona de gás — solicitação de alteração de
     sistema enviada à cidade em 13/10/2026 ([ILG] Alves). Vale para Modo
     Sobrevivência, Fac x Fac e Battle Royale. As regras entram em toda
     solicitação de zona desses eventos; os testes viram o checklist de
     validação quando a zona é confirmada no jogo. */
  const PADRAO_GAS = {
    id: 'gas-2026-10-13',
    titulo: 'PADRÃO DOS EVENTOS COM ZONA DE GÁS',
    eventos: 'Modo Sobrevivência, Fac x Fac e Battle Royale',
    solicitadoEm: '13/10/2026',
    regras: [
      'Após a última fase, a safe deverá fechar COMPLETAMENTE (raio zero), sem deixar nenhuma área segura.',
      'Depois de fechada, o gás deverá continuar causando dano contínuo a todos os players vivos até restar apenas UMA equipe viva.',
      'A última equipe viva é declarada campeã e o evento é encerrado automaticamente. Em morte simultânea, manter a regra de desempate já definida no sistema.',
      'HUD do player, inventário inicial (Mochila Média equipada e slots 1 a 4 preenchidos), morte com espectador somente da própria equipe, /surrender e comemoração de vitória deverão seguir o padrão já solicitado para os eventos com zona de gás.'
    ],
    zonasIguais: 'Esta zona deverá seguir exatamente as mesmas fases da safe, tempos, dano, HUD, inventário, encerramento e comemoração das demais zonas do evento, sem configuração própria.',
    resumo: [
      { titulo: 'Safe final', itens: ['Fecha até raio zero', 'Dano contínuo até sobrar 1 equipe', 'Campeã declarada e encerramento automático'] },
      { titulo: 'HUD', itens: ['Não cobre logo, ID, horário, voz, gemas, notificações e status', 'Topo: logo HIGH + logo/título do evento', 'Direita: vivos na partida + colegas vivos (sem nomes de outras equipes)', 'Esquerda: painel da equipe (até 15) com foto, nome, vida + e colete em %', 'Inferior esquerdo: Mochila Média + slots 1–4', 'Centro inferior: fase da safe + contagem', 'Atalhos: CAPS rádio · N pingar · M ocultar · H energético · Q scoreboard'] },
      { titulo: 'Inventário', itens: ['Mochila Média equipada', 'Slots 1–4 com o kit do evento', 'Player pode reorganizar'] },
      { titulo: 'Morte', itens: ['Espectador só da própria equipe', 'Sem colegas vivos: volta ao mundo 0', '/surrender após tempo mínimo, sem retorno'] },
      { titulo: 'Vitória', itens: ['Gás para na hora', 'Equipe campeã: aplausos e assobio', 'Tela "VITÓRIA" + Group campeão + coroa animada', 'Depois todos voltam ao mundo 0'] }
    ],
    testes: [
      'A última safe fecha até raio zero',
      'O gás continua causando dano após o fechamento até sobrar uma equipe',
      'O evento encerra e anuncia a equipe campeã automaticamente',
      'A HUD do evento não cobre nenhum elemento fixo da cidade',
      'HUD: logo da HIGH, logo e título do evento, total de vivos e colegas vivos, sem nomes de outras equipes',
      'Painel da equipe: nome do Group, foto, nome, vida (+) e colete (escudo) em % para até 15 players',
      'Slots 1 a 4 lado a lado no canto inferior esquerdo, com a Mochila Média no início',
      'Aviso da safe no centro inferior com contagem regressiva',
      'Legenda de atalhos (CAPS, N, M, H, Q) aparece e as teclas funcionam',
      'Player entra com Mochila Média e slots 1 a 4 preenchidos, e consegue reorganizar',
      'Espectador mostra apenas colegas da própria equipe',
      'Volta ao mundo 0 quando a equipe é eliminada ou com /surrender após o tempo mínimo',
      'Equipe vencedora executa a animação de aplauso e assobio',
      'Tela mostra "VITÓRIA", o Group campeão e a coroa com efeito visual'
    ],
    testeZonasIguais: 'Esta zona se comporta de forma idêntica às demais zonas do evento'
  };

  const TIPOS = [
    { id: 'dominacao', label: 'DOMINAÇÃO', category: 'dominacao', gas: false,
      match: /domina/i, mechanic: MEC_DOMINACAO,
      notes: ['Área de disputa fixa', 'Spawns podem ficar dentro ou fora do raio', 'Sem fechamento progressivo de gás'] },
    { id: 'facxfac', label: 'FAC X FAC', category: 'gas', gas: true, padrao: PADRAO_GAS,
      match: /fac\s*x\s*fac/i, mechanic: MEC_FACXFAC,
      notes: ['Safe inicial obrigatória cobrindo todos os spawns', 'Fechamento progressivo do gás', 'Spawn individual por organização', 'Loot/caixas e drop ao morrer conforme padrão Fac x Fac', 'Ranking e regras próprias preservados', 'Segue o padrão dos eventos com gás (13/10)'] },
    { id: 'sobrevivencia', label: 'MODO SOBREVIVÊNCIA', category: 'gas', gas: true, zonasPrevistas: 3, zonasSeparadas: true, zonasIguais: true, padrao: PADRAO_GAS,
      match: /sobreviv/i,
      mechanic: [
        'O Modo Sobrevivência deverá seguir o mesmo funcionamento do Fac x Fac (spawn individual por facção, loot, fechamento progressivo do gás e drop ao morrer), mantendo as configurações próprias do Modo Sobrevivência.',
        'Cada facção deverá nascer em uma coordenada diferente da zona selecionada.',
        'Todos os spawns deverão iniciar dentro da safe inicial.',
        'Quem permanecer fora da zona deverá receber dano do gás conforme o sistema atual.',
        'As zonas do Modo Sobrevivência ficam em localizações diferentes; a zona escolhida no /evento define onde a partida acontece.'
      ],
      notes: ['Cópia do Fac x Fac', '3 zonas em localizações diferentes, com regras idênticas', 'Safe inicial obrigatória cobrindo todos os spawns', 'Segue o padrão dos eventos com gás (13/10)'] },
    { id: 'battle-royale', label: 'BATTLE ROYALE', category: 'gas', gas: true, padrao: PADRAO_GAS,
      match: /battle\s*royale/i,
      mechanic: [
        'Todos os spawns deverão iniciar dentro da safe inicial.',
        'O loot e a premiação deverão seguir o funcionamento atual do Battle Royale.'
      ],
      notes: ['Safe inicial obrigatória cobrindo todos os spawns', 'Fechamento progressivo do gás', 'Segue o padrão dos eventos com gás (13/10)'] },
    { id: 'dia-de-guerra', label: 'HOJE É DIA DE GUERRA', category: 'gas', gas: true,
      match: /dia\s*de\s*guerra/i, mechanic: MEC_GAS,
      notes: ['Safe inicial obrigatória cobrindo todos os spawns', 'Fechamento progressivo do gás'] },
    { id: 'zona-conflito', label: 'ZONA DE CONFLITO', category: 'gas', gas: true,
      match: /conflito/i, mechanic: MEC_GAS,
      notes: ['Safe inicial obrigatória cobrindo todos os spawns', 'Fechamento progressivo do gás'] },
    { id: 'outro-gas', label: 'OUTRO · COM GÁS', category: 'gas', gas: true,
      match: null, mechanic: MEC_GAS,
      notes: ['Safe inicial obrigatória cobrindo todos os spawns', 'Regras específicas do evento preservadas'] },
    { id: 'outro-dominacao', label: 'OUTRO · ÁREA FIXA', category: 'dominacao', gas: false,
      match: null, mechanic: MEC_DOMINACAO,
      notes: ['Área de disputa fixa', 'Sem fechamento progressivo de gás'] }
  ];

  const porId = Object.fromEntries(TIPOS.map(t => [t.id, t]));

  /* Tipo de uma zona: o salvo vence; depois o nome do evento; por fim a
     categoria. Zonas antigas funcionam sem migração. */
  function tipoDe(m) {
    if (m && m.eventType && porId[m.eventType]) return porId[m.eventType];
    const nome = String(m?.event || '');
    const achado = TIPOS.find(t => t.match && t.match.test(nome));
    if (achado) return achado;
    return (m?.category || 'dominacao') === 'gas' ? porId['outro-gas'] : porId['outro-dominacao'];
  }

  /* Ciclo da solicitação de uma zona */
  const ETAPAS = {
    rascunho:  { label: 'RASCUNHO',          tom: 'muted' },
    pronta:    { label: 'PRONTA P/ ENVIAR',   tom: 'brand' },
    enviada:   { label: 'AGUARDANDO CIDADE', tom: 'warn' },
    nojogo:    { label: 'NO /EVENTO',        tom: 'ok' },
    alterada:  { label: 'ALTERADA APÓS ENVIO', tom: 'bad' }
  };

  function tempoDesde(iso) {
    const t = Date.parse(iso || '');
    if (!Number.isFinite(t)) return '';
    const min = Math.max(0, Math.round((Date.now() - t) / 60000));
    if (min < 60) return `há ${min} min`;
    const h = Math.round(min / 60);
    if (h < 48) return `há ${h} h`;
    return `há ${Math.round(h / 24)} dias`;
  }

  /* Distância mínima (m) entre um spawn de evento e a CDS de um QG/favela */
  const RAIO_QG_M = 150;

  /* Duração alvo dos eventos com gás (min) e divisão do tempo da safe:
     fecha 1 · move · fecha 2 · move · fecha 3 · fechamento final até zero */
  const DURACAO_ALVO_MIN = 20;
  const SAFE_TEMPO = { close1: .25, move1: .08, close2: .20, move2: .08, close3: .17, final: .22 };
  /* Raio de cada fase em fração do raio inicial da safe */
  const SAFE_RAIOS = [ .70, .48, .28, .12 ];   /* SAFE dinâmica: S1→S4, a última fecha até raio 0 */
  const SAFE_DANO = [ 5, 10, 20, 35 ];

  /* Horas sem retorno da cidade até a zona aparecer como ATRASADA */
  const PRAZO_RETORNO_H = 48;

  window.HighEventCatalog = { PANEL_PADRAO, TIPOS, porId, tipoDe, ETAPAS, tempoDesde, PRAZO_RETORNO_H, PADRAO_GAS, RAIO_QG_M, DURACAO_ALVO_MIN, SAFE_TEMPO, SAFE_RAIOS, SAFE_DANO };
})();
