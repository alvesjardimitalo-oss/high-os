/* High OS V13 - QGs da season.
   ---------------------------------------------------------------------
   O FIREBASE E O BANCO. A planilha de blips e coordenadas serve para
   semear a season uma vez e para a equipe alimentar quando quiser, mas
   quem manda e o que esta gravado aqui. Por isso esta tela EDITA: o
   staff corrige uma coordenada no painel e pronto, sem depender de
   ninguem abrir o Google Sheets.

   A virada de season inverteu a unidade do sistema. Antes o Group era a
   coisa principal e carregava o QG dentro dele - tanto que existe um
   estado SEM_QG, um Group sem lugar. Agora e o contrario: existem 25
   lugares mapeados e nenhum Group. O estado que faltava e QG sem Group,
   e e nele que a equipe trabalha durante a virada. */

/* Os 16 pontos que a aba da Season 3 oferece, na ordem em que fazem
   sentido para quem esta montando a favela no jogo. */
export const CAMPOS_CDS=[
 ['farm','Iniciar farm'],
 ['craft','Craft'],
 ['bau','Baú'],
 ['barbearia','Barbearia'],
 ['lojaRoupas','Loja de roupas'],
 ['tatuagem','Tatuagem'],
 ['garagemVipBlip','Garagem VIP · blip'],
 ['garagemVipSpawn','Garagem VIP · spawn'],
 ['garagemPublicaBlip','Garagem pública · blip'],
 ['garagemPublicaSpawn','Garagem pública · spawn'],
 ['helipontoBlip','Heliponto · blip'],
 ['helipontoSpawn','Heliponto · spawn'],
 ['garagemBlindadosBlip','Blindados · blip'],
 ['garagemBlindadosSpawn','Blindados · spawn'],
 ['shopDeluxe','Shop deluxe'],
 ['shopExclusivo','Shop exclusivo'],
 ['arena','Arena'],
 ['atm','ATM'],
 ['bar','Bar'],
 ['telaoCds','Telão']
];

/* Minimo para um QG poder ser entregue. Sem farm e craft a favela nao
   funciona; o resto e beneficio. */
export const ESSENCIAIS=['farm','craft','bau'];

export const ESTADOS={
 INCOMPLETO:{label:'INCOMPLETO',classe:'incompleto',ajuda:'Faltam coordenadas essenciais'},
 MAPEADO:   {label:'MAPEADO',   classe:'mapeado',   ajuda:'Local pronto, sem Group vinculado'},
 COM_GROUP: {label:'COM GROUP', classe:'comgroup',  ajuda:'Group vinculado, ainda não divulgado'},
 DISPONIVEL:{label:'DISPONÍVEL',classe:'disponivel',ajuda:'Divulgado, aceitando candidatos'},
 ENTREGUE:  {label:'ENTREGUE',  classe:'entregue',  ajuda:'Facção assumiu'}
};

const norm=v=>String(v==null?'':v).normalize('NFD').replace(/[̀-ͯ]/g,'').trim().toUpperCase();

export function estadoQg(qg={},faccoes=[]){
 const faltam=ESSENCIAIS.filter(k=>!String(qg.cds?.[k]||'').trim());
 if(faltam.length)return 'INCOMPLETO';
 const g=norm(qg.group);
 if(!g)return 'MAPEADO';
 const f=faccoes.find(x=>norm(x.group)===g);
 if(f&&String(f.faccao||'').trim()&&f.status==='ATIVA')return 'ENTREGUE';
 if(f&&f.anuncioDiscordStatus?.postado)return 'DISPONIVEL';
 return 'COM_GROUP';
}

export function contarCds(qg={}){
 return CAMPOS_CDS.filter(([k])=>String(qg.cds?.[k]||'').trim()).length;
}

export function resumoQgs(qgs=[],faccoes=[]){
 const r={total:qgs.length,INCOMPLETO:0,MAPEADO:0,COM_GROUP:0,DISPONIVEL:0,ENTREGUE:0,setores:{}};
 for(const q of qgs){
  const e=estadoQg(q,faccoes);
  r[e]++;
  const s=q.setor||'(sem setor)';
  r.setores[s]=(r.setores[s]||0)+1;
 }
 return r;
}

/* Sugere o proximo nome de Group seguindo a convencao do segmento:
   ARMAS01, ARMAS02... Olha os Groups que ja existem para nao repetir. */
export function sugerirGroup(setor='',faccoes=[],qgs=[]){
 const base=norm(setor).replace(/[^A-Z]/g,'').slice(0,12)||'GROUP';
 const usados=new Set([
  ...faccoes.map(f=>norm(f.group)),
  ...qgs.map(q=>norm(q.group)).filter(Boolean)
 ]);
 for(let i=1;i<100;i++){
  const tent=base+String(i).padStart(2,'0');
  if(!usados.has(tent))return tent;
 }
 return base+Date.now().toString(36).slice(-3).toUpperCase();
}

/* ---------- tela ---------- */
export function qgsHtml({season,faccoes=[],esc,filtro={}}){
 if(!season?.carregada){
  return `<div class="placeholder"><b>◆</b><h3>NENHUMA SEASON ATIVA</h3>
   <p>Escolha uma season no topo da página para ver os QGs dela.</p></div>`;
 }
 const qgs=season.qgs||[];
 const r=resumoQgs(qgs,faccoes);
 const fSetor=filtro.setor||'', fEstado=filtro.estado||'', busca=norm(filtro.busca||'');

 const lista=qgs.filter(q=>{
  if(fSetor&&(q.setor||'(sem setor)')!==fSetor)return false;
  if(fEstado&&estadoQg(q,faccoes)!==fEstado)return false;
  if(busca&&!norm([q.local,q.group,q.produto,q.setor].join(' ')).includes(busca))return false;
  return true;
 });

 const kpi=(chave,rotulo)=>`<button type="button" class="qg-kpi ${fEstado===chave?'on':''}" data-qg-estado="${chave}">
   <b>${r[chave]}</b><span>${rotulo}</span></button>`;

 return `
 <div class="qg-resumo">
  <button type="button" class="qg-kpi ${!fEstado?'on':''}" data-qg-estado=""><b>${r.total}</b><span>TODOS</span></button>
  ${kpi('MAPEADO','SEM GROUP')}
  ${kpi('COM_GROUP','COM GROUP')}
  ${kpi('DISPONIVEL','DIVULGADOS')}
  ${kpi('ENTREGUE','ENTREGUES')}
  ${r.INCOMPLETO?kpi('INCOMPLETO','INCOMPLETOS'):''}
 </div>

 <div class="qg-filtros">
  <input id="qgBusca" placeholder="Buscar favela, Group ou produto..." value="${esc(filtro.busca||'')}">
  <select id="qgSetor">
   <option value="">TODOS OS SETORES</option>
   ${Object.keys(r.setores).sort().map(s=>`<option value="${esc(s)}"${s===fSetor?' selected':''}>${esc(s)} (${r.setores[s]})</option>`).join('')}
  </select>
 </div>

 ${lista.length?`<div class="qg-grid">${lista.map(q=>cartaoQg(q,faccoes,esc)).join('')}</div>`
  :`<div class="placeholder"><b>◆</b><h3>NADA AQUI</h3><p>Nenhum QG bate com esse filtro.</p></div>`}`;
}

function cartaoQg(q,faccoes,esc){
 const e=estadoQg(q,faccoes), est=ESTADOS[e];
 const n=contarCds(q), totalCds=CAMPOS_CDS.length;
 const f=q.group?faccoes.find(x=>norm(x.group)===norm(q.group)):null;
 const faltam=ESSENCIAIS.filter(k=>!String(q.cds?.[k]||'').trim());

 return `<article class="qg-card ${est.classe}" data-qg="${esc(q.chave)}">
  <header>
   <div>
    <span class="qg-setor">${esc(q.setor||'—')}</span>
    <h3>${esc(q.local||q.chave)}</h3>
   </div>
   <span class="qg-estado ${est.classe}" title="${esc(est.ajuda)}">${est.label}</span>
  </header>

  <div class="qg-linha">
   <span>GROUP</span>
   <b>${q.group?esc(q.group):'<i>sem vínculo</i>'}</b>
  </div>
  ${f?`<div class="qg-linha"><span>FACÇÃO</span><b>${esc(f.faccao||'—')}</b></div>`:''}
  ${q.produto?`<div class="qg-linha"><span>PRODUTO</span><b>${esc(q.produto)}</b></div>`:''}
  <div class="qg-linha"><span>CRAFT</span><b>${f?.perfilTecnico?.craft?.receitas?.length?esc(String(f.perfilTecnico.craft.receitas.length))+' receita(s)':'<i>'+(q.group?'sem receita':'precisa de Group')+'</i>'}</b></div>

  <div class="qg-cds">
   <div class="qg-barra"><i style="width:${Math.round(n/totalCds*100)}%"></i></div>
   <small>${n} de ${totalCds} coordenadas${faltam.length?` · falta ${faltam.map(k=>CAMPOS_CDS.find(c=>c[0]===k)?.[1]||k).join(', ')}`:''}</small>
  </div>

  <div class="qg-acoes">
   <button type="button" class="mini-btn" data-qg-editar="${esc(q.chave)}">COORDENADAS</button>
   <button type="button" class="mini-btn" data-qg-craft="${esc(q.chave)}">CRAFT${f?.perfilTecnico?.craft?.receitas?.length?' ('+f.perfilTecnico.craft.receitas.length+')':''}</button>
   ${q.group
     ?`<button type="button" class="mini-btn" data-qg-abrir="${esc(q.group)}">ABRIR GROUP</button>`
     :`<button type="button" class="mini-btn primaria" data-qg-vincular="${esc(q.chave)}">DEFINIR GROUP</button>`}
  </div>
 </article>`;
}

/* ---------- editor de coordenadas ---------- */
export function editorHtml(q,esc){
 return `<div class="qg-editor">
  <p class="qg-editor-ajuda">O que vale é o que está gravado aqui. A planilha é um espelho que a equipe alimenta quando quiser — editar nela não substitui esta tela.</p>
  <div class="qg-editor-topo">
   <label><span>FAVELA / LOCAL</span><input data-qg-campo="local" value="${esc(q.local||'')}"></label>
   <label><span>SETOR</span><input data-qg-campo="setor" value="${esc(q.setor||'')}"></label>
   <label><span>PRODUTO</span><input data-qg-campo="produto" value="${esc(q.produto||'')}"></label>
  </div>
  <div class="qg-editor-grade">
   ${CAMPOS_CDS.map(([k,rot])=>`<label class="${ESSENCIAIS.includes(k)?'essencial':''}">
     <span>${esc(rot)}${ESSENCIAIS.includes(k)?' *':''}</span>
     <input data-qg-cds="${k}" value="${esc(q.cds?.[k]||'')}" placeholder="x, y, z, h">
    </label>`).join('')}
  </div>
  <p class="qg-editor-ajuda">* essenciais: sem eles o QG não pode ser entregue.</p>
 </div>`;
}

/* Le o editor de volta para um objeto de QG, preservando o resto. */
export function lerEditor(raiz,base={}){
 const out={...base,cds:{...(base.cds||{})}};
 raiz.querySelectorAll('[data-qg-campo]').forEach(el=>{out[el.dataset.qgCampo]=el.value.trim()});
 raiz.querySelectorAll('[data-qg-cds]').forEach(el=>{
  const v=el.value.trim();
  if(v)out.cds[el.dataset.qgCds]=v; else delete out.cds[el.dataset.qgCds];
 });
 return out;
}
