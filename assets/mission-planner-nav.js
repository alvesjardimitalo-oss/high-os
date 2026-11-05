/* =====================================================================
   HIGH OS V12.8 · PLANEJADOR — RÓTULOS E ÍCONES DOS BOTÕES
   ---------------------------------------------------------------------
   O planejador cria e altera botões em vários pontos do código (inclusive
   trocando o texto em tempo real, ex.: "Gravar" → "Parar"). Em vez de
   espalhar mudanças de texto por todo o mission-planner.js, esta camada
   observa a página e padroniza cada botão:
   - legenda curta em texto normal (sem caixa alta, sem emoji);
   - botões que eram só símbolo (＋ ⧉ ⌫ ▶ ◉ …) ganham legenda;
   - ícone de linha via CSS (data-mp-icon), que sobrevive às trocas de texto.
   Não altera nenhuma função: só o texto visível e o atributo de ícone.
   ===================================================================== */
(function(){
  'use strict';
  const ROOT_ID='page-planejador';

  /* Legenda fixa por botão (vale enquanto o planejador não trocar o texto). */
  const BY_ID={
    mpBackLibrary:'Missões',mpNewZone:'Nova zona',mpReplicateZone:'Replicar',mpCloneZone:'Duplicar',
    mpDeleteMission:'Excluir zona',mpUndoEdit:'Desfazer',mpRedoEdit:'Refazer',mpEditMission:'Editar',
    mpSaveMission:'Salvar',mpCancelEdit:'Cancelar',
    mpFit:'Enquadrar',mpFitZone:'Enquadrar zona',mpGoLS:'Los Santos',mpGoCayo:'Cayo Perico',
    mpGenerateCircle:'Gerar em círculo',mpGenerateInsideZone:'Gerar spawns na zona',
    mpAddCoord:'Adicionar CDS',mpImport:'Importar CDS',mpClear:'Limpar pontos',mpRenumberSpawns:'Renumerar',
    mpCopyPointTp:'Copiar TPCDS',mpJumpPending:'Próximo pendente',mpValidateBtn:'Validar e avançar',
    mpInvalidateBtn:'Voltar a pendente',mpValidateBulkBtn:'Validar lote',mpForceValidate:'Validar assim mesmo',
    mpCopyCenterTp:'Copiar TPCDS do centro',mpValidateCenter:'Validar centro',mpGoCoordBtn:'Centralizar CDS',
    mpUseRecommendedRadius:'Cobrir todos',mpFocusProblems:'Ver problemáticos',
    mpExportBtn:'Copiar CDS validadas',mpExportXYBtn:'Copiar CDS de teste',mpCopyExportPro:'Copiar exportação',
    mpGenerateRequest:'Gerar solicitação',mpCopyRequest:'Copiar texto',mpCaptureBtn:'Atualizar print',
    mpAuditBtn:'Checar antes de publicar',mpChecklistBtn:'Checklist do evento',mpFullscreenBtn:'Mapa em tela cheia',
    mpSurvivalBtn:'Criar sobrevivência Fac x Fac',mpSavePresetBtn:'Salvar como preset',mpBackupDownload:'Baixar cópia',
    mpEnableDynamicSafe:'Criar safe dinâmica',mpAddSafeTop:'Adicionar safe',mpRemoveSafeTop:'Remover safe',
    mpDeleteSelectedSafe:'Excluir safe',mpPlaceSelectedSafe:'Posicionar safe',mpFocusSelectedSafe:'Focar safe',
    mpSafeFocus:'Ocultar spawns',mpSafePresent:'Apresentar',mpSafeTestPlayer:'Player de teste',
    mpSafePrevStage:'Safe anterior',mpSafeNextStage:'Próxima safe',
    mpDomPolygonAdd:'Adicionar vértice',mpDomPolygonBulkAdd:'Importar vértices',mpDomPolygonBulkReplace:'Substituir polígono',
    mpDomPolygonClear:'Limpar polígono',mpDomPolygonUndo:'Remover último',mpDomPolygonValidateAll:'Validar todos',
    mpDomProposalApply:'Aplicar proposta',mpDomProposalCancel:'Cancelar',
    mpRepClose:'Fechar',mpRepCancel:'Cancelar',mpRepCreate:'Criar cópia adaptada',mpMapDiagRefresh:'Atualizar',
    mpCentralNewEvent:'Novo evento',mpStepPrev:'Voltar'
  };

  /* Botões que eram só símbolo e têm o texto trocado em tempo real. */
  const BY_GLYPH={
    '←':'Missões','＋':'Adicionar','+':'Adicionar','⧉':'Replicar','⎘':'Duplicar','⌫':'Excluir',
    '↶':'Desfazer','↷':'Refazer','✎':'Editar','✓':'Salvar','×':'Cancelar',
    '▶':'Reproduzir','►':'Reproduzir','⏸':'Pausar','❚❚':'Pausar','⏮':'Anterior','⏭':'Próxima',
    '◉':'Focar','◎':'Focar','⛶':'Apresentar','●':'Gravar','■':'Parar','P':'Player de teste',
    '−':'Remover','-':'Remover','🗑':'Excluir','⌖':'Posicionar'
  };

  /* Palavras que não seguem a regra de minúsculas. */
  const KEEP=[
    ['tpcds','TPCDS'],['cds','CDS'],['tp','TP'],['nc','NC'],['json','JSON'],['xy','XY'],['z','Z'],
    ['gás / safe','Gás / Safe'],['firebase','Firebase'],['los santos','Los Santos'],['cayo perico','Cayo Perico'],['fac x fac','Fac x Fac'],
    ['high','High'],['discord','Discord'],['pro','Pro']
  ];

  /* Ícone pela legenda final (primeira regra que casar). */
  const ICONS=[
    [/^(Missões|Voltar)$/,'back'],[/^Próxima etapa|^Última etapa/,'next'],
    [/^Copiar|^Copiado/,'copy'],[/^Validar|^Checar|^Aplicar/,'check'],[/^Salvar/,'save'],
    [/^(Cancelar|Fechar)$/,'x'],[/^Excluir|^Limpar|^Remover/,'trash'],
    [/^Nov[oa]|^Adicionar|^Criar/,'plus'],[/^Desfazer/,'undo'],[/^Refazer/,'redo'],[/^Editar/,'edit'],
    [/^Sincroniz|^Atualizar/,'refresh'],[/^Enquadrar|tela cheia|^Apresentar/i,'expand'],
    [/^Marcar|^Posicionar|^Centralizar|^Parar de marcar|^Parar marcação/,'pin'],
    [/^Próximo|^Próxima|^Ir ao/,'next'],[/anterior$/i,'prev'],[/^Gerar/,'spark'],
    [/^Importar|^Restaurar|^Substituir/,'upload'],[/^Baixar/,'download'],[/^Reproduzir/,'play'],
    [/^Pausar/,'pause'],[/^Gravar/,'record'],[/^Parar$/,'stop'],[/^Focar|^Ver |^Ocultar|^Mostrar|^Antes/,'eye'],
    [/^Replicar|^Duplicar/,'duplicate'],[/^Checklist/,'list'],[/^Player/,'user'],
    [/^(Los Santos|Cayo Perico)$/,'map'],[/^Renumerar/,'list']
  ];

  function stripSymbols(t){
    return String(t||'')
      .replace(/^[\s☁↻⚠✓✔•·+＋←→⟳⧉⎘⌫↶↷✎▶⏸⏮⏭◉◎⛶●■⌖🗑]+/u,'')
      .replace(/[\s✓✔•·…]+$/u,'')
      .replace(/\.\.\.$/,'…')
      .trim();
  }
  function sentence(t){
    if(!/[A-ZÀ-Ý]/.test(t)||/[a-zà-ÿ]/.test(t))return t; // só mexe em texto todo em caixa alta
    let s=t.toLowerCase();
    KEEP.forEach(([a,b])=>{s=s.replace(new RegExp('(^|[^a-zà-ÿ0-9])'+a.replace(/ /g,'\\s')+'(?=$|[^a-zà-ÿ0-9])','g'),(m,p)=>p+b);});
    s=s.replace(/(^|[^a-zà-ÿ])v(\d)/g,'$1V$2');
    return s.charAt(0).toUpperCase()+s.slice(1);
  }
  function labelFor(btn,raw){
    const txt=raw.trim();
    if(btn.id&&BY_ID[btn.id]&&(btn.dataset.mpRaw0===undefined||btn.dataset.mpRaw0===txt))return BY_ID[btn.id];
    if(BY_GLYPH[txt])return BY_GLYPH[txt];
    const limpo=stripSymbols(txt);
    if(!limpo)return txt;
    return sentence(limpo);
  }
  function iconFor(label){for(const [re,ic] of ICONS)if(re.test(label))return ic;return '';}

  function isSkippable(btn){
    if(btn.closest('.leaflet-control,.leaflet-popup,.mp-point-row,.mp-row-actions'))return true; // controles do mapa e da lista
    if(btn.querySelector('svg,img,b,span,i,small,strong'))return true; // botões com conteúdo próprio (abas, cartões)
    return false;
  }
  function processButton(btn){
    if(isSkippable(btn))return;
    const raw=btn.textContent||'';
    if(btn.dataset.mpShown!==undefined&&raw===btn.dataset.mpShown)return; // já é o nosso texto
    if(btn.dataset.mpRaw0===undefined)btn.dataset.mpRaw0=raw.trim();
    const label=labelFor(btn,raw);
    if(!label||/^[+\-−]?\d/.test(label))return; // "+50", "-100", "1x", "+10s": ficam como estão
    if(label!==raw)btn.textContent=label;
    btn.dataset.mpShown=label;
    const ic=iconFor(label);
    if(ic)btn.dataset.mpIcon=ic;else delete btn.dataset.mpIcon;
    if(!btn.getAttribute('aria-label'))btn.setAttribute('aria-label',label);
  }
  function processTitle(h){
    if(h.children.length)return; // só texto puro
    const raw=h.textContent||'';
    if(h.dataset.mpShown===raw)return;
    const t=sentence(stripSymbols(raw));
    if(t&&t!==raw)h.textContent=t;
    h.dataset.mpShown=h.textContent;
  }
  function processCloud(el){
    const raw=el.textContent||'';
    if(el.dataset.mpShown===raw)return;
    const t=stripSymbols(raw);
    const s=t?sentence(t.split(' · ')[0])+(t.includes(' · ')?' · '+t.split(' · ').slice(1).join(' · '):''):raw;
    if(s!==raw)el.textContent=s;
    el.dataset.mpShown=el.textContent;
  }

  let agendado=false;
  function sweep(){
    agendado=false;
    const root=document.getElementById(ROOT_ID);if(!root)return;
    root.querySelectorAll('button').forEach(processButton);
    root.querySelectorAll('.mp-card > h3, .mp-card h3, .mp-card summary').forEach(processTitle);
    root.querySelectorAll('.mp-cloud-state').forEach(processCloud);
  }
  function schedule(){if(agendado)return;agendado=true;requestAnimationFrame(sweep);}

  function start(){
    const root=document.getElementById(ROOT_ID);
    if(!root){setTimeout(start,500);return;}
    sweep();
    new MutationObserver(schedule).observe(root,{subtree:true,childList:true,characterData:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
