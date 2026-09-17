/* =========================================================
   HIGH OS V9.4 · UI KIT (script classico, carregado antes do app.js)
   - Toasts nao bloqueantes no lugar dos alert()
   - Drawer de navegacao no mobile
   - Rotulos de acessibilidade para os botoes so com icone
   Nenhuma regra de negocio vive aqui.
   ========================================================= */
(function(){
  'use strict';

  /* ---------- 1. TOASTS ---------- */
  var region = null;
  function ensureRegion(){
    if(region && document.body.contains(region)) return region;
    region = document.createElement('div');
    region.id = 'highToastRegion';
    region.setAttribute('role','status');
    region.setAttribute('aria-live','polite');
    document.body.appendChild(region);
    return region;
  }

  var ICONS = {ok:'✔', err:'⚠', warn:'!', info:'●'};

  // V9.9 - alem do tipo, o toast ganha titulo: um erro grave deixa de
  // parecer igual a um "salvo com sucesso".
  function classify(message){
    var m = String(message || '').toLowerCase();
    if(/(não foi possível|nao foi possivel|erro|falha|inválid|invalid|negad|não possui|nao possui|recusad|expirad|limite)/.test(m)) return 'err';
    if(/(salv|sucesso|atualizad|conclu|import|gerad|copiad|removid|exclu|sincroniz)/.test(m)) return 'ok';
    if(/(atenção|atencao|somente para visualização|somente leitura|verifique|confira|pendente)/.test(m)) return 'warn';
    return 'info';
  }
  var TITULOS = {ok:'Pronto', err:'Não deu certo', warn:'Atenção', info:'Aviso'};

  function toast(message, type, ms){
    if(message === undefined || message === null || message === '') return;
    var text = String(message);
    var kind = type || classify(text);
    var life = ms || (kind === 'err' ? 0 : kind === 'warn' ? 8000 : 4200); // 0 = so fecha no clique
    var host = ensureRegion();

    var el = document.createElement('div');
    el.className = 'high-toast ' + kind;
    var icon = document.createElement('span');
    icon.className = 'high-toast-icon';
    icon.textContent = ICONS[kind] || ICONS.info;
    var body = document.createElement('div');
    body.className = 'high-toast-body';
    var titulo = document.createElement('b');
    titulo.className = 'high-toast-title';
    titulo.textContent = TITULOS[kind] || TITULOS.info;
    var corpo = document.createElement('span');
    corpo.textContent = text;                // textContent: nunca injeta HTML
    body.appendChild(titulo); body.appendChild(corpo);
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'high-toast-close';
    close.setAttribute('aria-label','Fechar aviso');
    close.textContent = '×';

    el.appendChild(icon); el.appendChild(body); el.appendChild(close);
    host.appendChild(el);

    var timer = life ? setTimeout(dismiss, life) : null;
    function dismiss(){
      clearTimeout(timer);
      el.classList.add('out');
      setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 200);
    }
    close.addEventListener('click', dismiss);
    el.addEventListener('mouseenter', function(){ clearTimeout(timer); });
    el.addEventListener('mouseleave', function(){ timer = setTimeout(dismiss, 2200); });

    // no maximo 4 avisos visiveis
    while(host.children.length > 4) host.removeChild(host.firstChild);
    return dismiss;
  }

  window.highToast = toast;

  // Substitui o alert() nativo. Mantemos o confirm() nativo de proposito:
  // ele e sincrono e o codigo atual depende do retorno booleano.
  var nativeAlert = window.alert.bind(window);
  window.alert = function(message){ toast(message); };
  window.highNativeAlert = nativeAlert;

  /* ---------- 2. DRAWER DE NAVEGACAO (MOBILE) ---------- */
  function setupNav(){
    var app = document.querySelector('#appView.app, #appView');
    var sidebar = document.querySelector('.sidebar');
    var topbar = document.querySelector('.topbar-inner');
    if(!sidebar || !topbar) return;

    if(!document.querySelector('.high-nav-backdrop')){
      var backdrop = document.createElement('div');
      backdrop.className = 'high-nav-backdrop';
      backdrop.addEventListener('click', function(){ setOpen(false); });
      document.body.appendChild(backdrop);
    }

    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'high-nav-toggle';
    toggle.setAttribute('aria-label','Abrir menu de navegacao');
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-controls','highSidebar');
    toggle.innerHTML = '<span aria-hidden="true">☰</span><span>MENU</span>';
    topbar.insertBefore(toggle, topbar.firstChild);

    sidebar.id = sidebar.id || 'highSidebar';
    sidebar.setAttribute('role','navigation');
    sidebar.setAttribute('aria-label','Modulos do High OS');

    function setOpen(open){
      document.body.classList.toggle('nav-open', !!open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Fechar menu de navegacao' : 'Abrir menu de navegacao');
    }
    toggle.addEventListener('click', function(){ setOpen(!document.body.classList.contains('nav-open')); });
    sidebar.addEventListener('click', function(e){
      if(e.target.closest('.nav-item')) setOpen(false);
    });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && document.body.classList.contains('nav-open')) setOpen(false);
    });
    window.addEventListener('resize', function(){
      if(window.innerWidth > 900) setOpen(false);
    });
    if(app) app.setAttribute('id', app.id || 'appView');
  }

  /* ---------- 3. ROTULOS DE ACESSIBILIDADE ---------- */
  function labelIconButtons(){
    document.querySelectorAll('.nav-item').forEach(function(btn){
      var span = btn.querySelector('span');
      if(span && !btn.getAttribute('aria-label')) btn.setAttribute('aria-label', span.textContent.trim());
      // o glifo decorativo nao deve ser lido pelo leitor de tela
      Array.from(btn.childNodes).forEach(function(n){
        if(n.nodeType === 3 && n.textContent.trim()){
          var wrap = document.createElement('span');
          wrap.setAttribute('aria-hidden','true');
          wrap.textContent = n.textContent;
          n.replaceWith(wrap);
        }
      });
    });
    document.querySelectorAll('button[title]:not([aria-label])').forEach(function(btn){
      if(!btn.textContent.trim() || btn.textContent.trim().length <= 2){
        btn.setAttribute('aria-label', btn.getAttribute('title'));
      }
    });
    document.querySelectorAll('.page').forEach(function(sec){
      sec.setAttribute('role','region');
      var h = sec.querySelector('h2');
      if(h && !sec.getAttribute('aria-label')) sec.setAttribute('aria-label', h.textContent.trim());
    });
  }

  /* ---------- 4. LINK "PULAR PARA O CONTEUDO" ---------- */
  function skipLink(){
    var main = document.querySelector('main.shell');
    if(!main) return;
    main.id = main.id || 'highMain';
    var a = document.createElement('a');
    a.className = 'skip-link';
    a.href = '#' + main.id;
    a.textContent = 'Pular para o conteudo';
    document.body.insertBefore(a, document.body.firstChild);
  }

  /* ---------- 5. HELPERS PUBLICOS ---------- */
  window.highBusy = function(el, on){
    if(!el) return;
    el.classList.toggle('high-busy', on !== false);
    if(on === false) el.removeAttribute('aria-busy'); else el.setAttribute('aria-busy','true');
  };
  window.highSkeleton = function(rows){
    var n = rows || 3, out = '';
    for(var i = 0; i < n; i++) out += '<span class="high-skeleton card"></span>';
    return '<div class="high-skeleton-wrap" aria-busy="true">' + out + '</div>';
  };

  /* ---------- 6. ACESSIBILIDADE CONTINUA (V9.9) ----------
     O app redesenha telas inteiras com innerHTML o tempo todo, entao os
     rotulos precisam ser reaplicados quando o conteudo muda. */
  function rotularDinamicos(){
    document.querySelectorAll('button:not([aria-label])').forEach(function(b){
      var txt = (b.textContent || '').trim();
      if(txt.length > 2) return;                 // ja tem texto legivel
      var dica = b.getAttribute('title') || b.dataset.page || b.dataset.acao || '';
      if(dica) b.setAttribute('aria-label', dica);
      else if(txt) b.setAttribute('aria-label', 'Ação');
      if(txt) b.setAttribute('aria-hidden', 'false');
    });
    document.querySelectorAll('input:not([aria-label]):not([id])').forEach(function(i){
      if(i.placeholder) i.setAttribute('aria-label', i.placeholder);
    });
    document.querySelectorAll('table:not([role])').forEach(function(t){ t.setAttribute('role','table'); });
  }
  var observador = null;
  function observarMudancas(){
    if(observador || !window.MutationObserver) return;
    var agendado = false;
    observador = new MutationObserver(function(){
      if(agendado) return;
      agendado = true;
      setTimeout(function(){ agendado = false; rotularDinamicos(); }, 400);
    });
    observador.observe(document.body, {childList:true, subtree:true});
  }

  function boot(){ skipLink(); setupNav(); labelIconButtons(); rotularDinamicos(); observarMudancas(); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
