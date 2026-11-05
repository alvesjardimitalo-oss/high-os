import {createEconomyVisual} from './economia-visual.js?v=3';
import {createSimpleEconomyPanel} from './acoes-gestao-simples.js?v=3';
import {createHouseWorkbench} from './roubos-loot-ui.js?v=6';
import {blankAction,cleanRegistry,mergeActionRegistry,normalizeActionName} from './acoes-cadastro.js?v=5';
import {createNpcWorkbench} from './acoes-npc-ui.js?v=7';

/** Navigation, profiles and Firestore-backed internal action registration.
 * The official market catalog is always read-only and remains the reference.
 */
export function createActionWorkspace({root,getActions,getPublished,getCatalog,getReference,getSelected,select,refresh,onReadRegistry,onMutateRegistry}){
 const $=id=>root.querySelector('#'+id);
 const safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 let registry=cleanRegistry(),ready=false,view='overview',tab='resumo',draft=null,original='',busy=false;
 let lastLoadError='',npc=null,houses=null,visual=null,simple=null,economyMode='atm';
 root.dataset.apTools='closed';
 const published=()=>getPublished()||[];
 const current=()=>getActions().find(x=>x.nome===getSelected())||null;
 const writable=()=>Boolean(onMutateRegistry&&ready);
 function merged(official){return mergeActionRegistry(official,registry);}
 function message(text=''){
  const target=$('apRegistryNotice');if(!target)return;
  target.hidden=!text;target.textContent=text;
 }
 async function load(){
  if(!onReadRegistry){ready=false;return;}
  try{
   registry=cleanRegistry(await onReadRegistry());ready=true;lastLoadError='';message('');npc?.refresh();houses?.refresh();simple?.refresh();
  }catch(e){ready=false;lastLoadError=String(e?.message||e);message('Cadastro interno indisponível: '+lastLoadError);}
 }
 function paint(){
  root.dataset.apSection=view;root.dataset.apProfileTab=tab;
  const area=view==='loot'?({casas:'roubados',npc:'lootnpc',portamalas:'portamalas'}[houses?.mode?.()]||'roubados'):view==='npc'?(npc?.market()==='ARMAS_QUEBRADAS'?'quebrados':'comerciante'):economyMode;
  visual?.selectArea(['portamalas','quebrados'].includes(area)?area:'');
  simple?.selectArea(area);
  const lootHeading=$('apLootHeading');if(lootHeading)lootHeading.textContent={roubados:'Roubo de residências',lootnpc:'Loot de NPC',portamalas:'Roubo de veículos e porta-malas'}[area]||'Gestão dos roubos';
  if($('apHouseMerchant'))$('apHouseMerchant').hidden=area!=='roubados';
  if($('apLootDetails')){if(area==='lootnpc')$('apLootDetails').open=true;else $('apLootDetails').open=false;}
  if($('apBackHouse'))$('apBackHouse').hidden=area!=='comerciante';
  root.dataset.economyArea=area;
  root.querySelectorAll('[data-economy-area]').forEach(btn=>{
   if(btn.dataset.economyArea===area)btn.setAttribute('aria-current','page');else btn.removeAttribute('aria-current');
  });
  root.querySelectorAll('[data-ap-nav]').forEach(btn=>{
   const on=btn.dataset.apNav===(view==='profile'?'catalog':view);
   if(on)btn.setAttribute('aria-current','page');else btn.removeAttribute('aria-current');
  });
  root.querySelectorAll('[data-ap-profile]').forEach(btn=>{
   if(btn.dataset.apProfile===tab)btn.setAttribute('aria-current','page');
   else btn.removeAttribute('aria-current');
  });
  const a=current();
  if($('apProfileName'))$('apProfileName').textContent=a?.nome||'Ação não selecionada';
  if($('apProfileOrigin'))$('apProfileOrigin').textContent=
   a?.origemCadastro==='OFICIAL'?'Origem: Mercado Negro oficial':
   a?.origemCadastro==='AJUSTE INTERNO'?'Ajuste interno • não publicado na cidade':
   'Cadastro interno • não publicado na cidade';
  for(const id of ['apNewAction','apCatalogNew','apEditAction','apDeleteAction']){
   const button=$(id);if(button)button.hidden=!writable()||(id==='apEditAction'||id==='apDeleteAction')&&!a;
  }
  if(a&&$('apDeleteAction'))$('apDeleteAction').textContent=a.origemCadastro==='OFICIAL'?
   'Arquivar do planejador':'Excluir cadastro';
  const archived=Object.keys(registry.hidden).filter(k=>registry.hidden[k]).map(key=>
   published().find(a=>normalizeActionName(a.nome)===key)?.nome||key);
  if($('apArchiveBox'))$('apArchiveBox').hidden=!writable()||!archived.length;
  if($('apArchivedActions'))$('apArchivedActions').innerHTML=archived.map(name=>
   '<div class="ap-archive-row"><span>'+safe(name)+'</span>'+
   '<button type="button" class="ap-button" data-ap-restore="'+safe(name)+'">Restaurar</button></div>').join('');
  if(view==='profile'&&!a){view='catalog';root.dataset.apSection=view;}
 }
 function navigate(next,subtab=tab,{tools=true}={}){
  if(next==='npc'&&subtab==='casas')npc?.selectMarket('CASAS');
  view=['overview','catalog','ranking','prices','npc','profile','loot'].includes(next)?next:'overview';
  tab=['resumo','custos','cenario','sugestao'].includes(subtab)?subtab:'resumo';
  root.dataset.apTools=tools?'open':'closed';
  paint();
  root.dispatchEvent(new Event('ap-economy-area-changed'));
  root.scrollIntoView({behavior:'smooth',block:'start'});
 }
 function openProfile(){navigate('profile','resumo');}
 function openSuggestion(){const d=$('apStrategyDetails');if(d)d.open=true;navigate('profile','sugestao');}
 function editorRows(){
  if(!draft)return;
  $('apEditorRules').innerHTML=draft.regras_confronto.map((r,i)=>
   '<div class="ap-editor-row ap-editor-rule">'+
   '<label>Invasores<input type="number" min="1" max="100" data-entry-field="invasores" value="'+safe(r.invasores)+'"></label>'+
   '<label>Policiais<input type="number" min="0" max="100" data-entry-field="policiais" value="'+safe(r.policiais)+'"></label>'+
   '<label>Reféns<input type="number" min="0" max="100" data-entry-field="refens" value="'+safe(r.refens??0)+'"></label>'+
   '<button type="button" class="ap-button ap-row-remove" data-ap-rule-remove="'+i+'" aria-label="Remover equipe">✕</button></div>').join('');
  $('apEditorItems').innerHTML=draft.itens.map((it,i)=>
   '<div class="ap-editor-row ap-editor-item">'+
   '<label>Item<input data-entry-field="nome" list="apItemNames" maxlength="100" value="'+safe(it.nome)+'" placeholder="Nome no Mercado Negro"></label>'+
   '<label>Quantidade<input type="number" min="1" max="10000" data-entry-field="quantidade" value="'+safe(it.quantidade)+'"></label>'+
   '<label>Preço unitário (vazio = Mercado Negro)<input type="number" min="0" step="1" data-entry-field="preco_unitario" placeholder="Preço dinâmico" value="'+safe(it.preco_unitario??'')+'"></label>'+
   '<label>Tratamento<select data-entry-field="categoria_item">'+
    [['','Automático'],['consumivel','Consumível'],['arma','Arma reutilizável'],['municao','Munição'],['colete','Colete'],['acesso','Acesso/pendrive']].map(([v,l])=>'<option value="'+v+'"'+((it.categoria_item||'')===v?' selected':'')+'>'+l+'</option>').join('')+'</select></label>'+
   '<button type="button" class="ap-button ap-row-remove" data-ap-item-remove="'+i+'" aria-label="Remover item">✕</button></div>').join('');
 }
 function collectRows(){
  if(!draft)return;
  const rows=selector=>[...root.querySelectorAll(selector)];
  const read=(row,field)=>row.querySelector('[data-entry-field="'+field+'"]')?.value??'';
  draft.regras_confronto=rows('.ap-editor-rule').map(row=>({
   invasores:read(row,'invasores'),policiais:read(row,'policiais'),refens:read(row,'refens')
  }));
  draft.itens=rows('.ap-editor-item').map(row=>({nome:read(row,'nome'),quantidade:read(row,'quantidade'),
   categoria_item:read(row,'categoria_item'),preco_unitario:read(row,'preco_unitario')}));
 }
 function updatePrizeInputs(){
  const variable=$('apEntryType')?.value==='casas';
  for(const [id,text] of [['apEntryMin','Receita variável calculada pelo NPC'],['apEntryMax','Receita variável calculada pelo NPC']]){
   const input=$(id);if(!input)continue;
   input.required=!variable;input.min=variable?'0':'1';
   input.placeholder=variable?text:'Prêmio (sujo)';
  }
 }
 function openEditor(a=null){
  if(!writable())return;
  original=a?.nome||'';
  draft=a?JSON.parse(JSON.stringify(a)):blankAction();
  $('apEditorHeading').textContent=a?'Editar ação • '+a.nome:'Cadastrar nova ação';
  $('apEntryName').value=draft.nome;
  $('apEntryType').value=draft.tipo_acao||'blipada';
  updatePrizeInputs();
  $('apEntryName').readOnly=!!a&&published().some(p=>normalizeActionName(p.nome)===normalizeActionName(a.nome));
  $('apEntryStatus').value=draft.status==='inativo'?'inativo':'ativo';
  $('apEntryMin').value=draft.premio_min||'';
  $('apEntryMax').value=draft.premio_max||'';
  $('apEntryCooldown').value=draft.cooldown_segundos||0;
  $('apEditorError').hidden=true;
  const names=[...new Set([...(getCatalog()?.itens||[]).map(i=>i.item),
   ...published().flatMap(p=>(p.itens||[]).map(x=>x.nome))])].filter(Boolean);
  $('apItemNames').innerHTML=names.map(n=>'<option value="'+safe(n)+'"></option>').join('');
  editorRows();
  $('apEditorDialog').showModal();
 }
 function closeEditor(){
  if($('apEditorDialog').open)$('apEditorDialog').close();
  draft=null;original='';
 }
 async function save(){
  if(!draft||!writable()||busy)return;
  collectRows();
  const entry={...draft,nome:$('apEntryName').value,tipo_acao:$('apEntryType').value,status:$('apEntryStatus').value,
   premio_min:$('apEntryMin').value,premio_max:$('apEntryMax').value,
   cooldown_segundos:$('apEntryCooldown').value};
  const button=$('apSaveEntry');busy=true;button.disabled=true;$('apEditorError').hidden=true;
  try{
   registry=cleanRegistry(await onMutateRegistry({kind:'save',entry,oldName:original,expectedRevision:registry.revision}));
   closeEditor();refresh();
   const name=getActions().find(a=>normalizeActionName(a.nome)===normalizeActionName(entry.nome))?.nome;
   if(name)select(name);else navigate('catalog');
  }catch(e){const err=$('apEditorError');err.textContent=String(e?.message||e);err.hidden=false;}
  finally{busy=false;button.disabled=false;}
 }
 async function mutation(kind,name){
  if(!writable()||busy)return;
  const prompt=kind==='archive'?'Arquivar esta ação apenas no High OS Dev? O Mercado Negro oficial permanecerá inalterado.':
   kind==='delete'?'Excluir o cadastro interno? Isso NÃO apaga dados do Mercado Negro.':
   'Restaurar esta ação no planejador?';
  if(!confirm(prompt))return;
  busy=true;
  try{
   registry=cleanRegistry(await onMutateRegistry({kind,name,expectedRevision:registry.revision}));
   refresh();navigate('catalog');
  }catch(e){message('Não foi possível salvar: '+String(e?.message||e));}
  finally{busy=false;}
 }
 async function reload(){
  await load();refresh();
 }
 root.addEventListener('click',ev=>{
  const area=ev.target.closest('button[data-economy-area]');
  if(area){
   const next=area.dataset.economyArea;
   if(next==='acoes'){economyMode='acoes';navigate('overview','resumo',{tools:false});}
   else if(next==='atm'||next==='registradora'){economyMode=next;navigate('catalog','resumo',{tools:false});}
   else if(next==='roubados'){economyMode=next;houses?.selectMode('casas');navigate('loot','resumo',{tools:false});}
   else if(['lootnpc','portamalas'].includes(next)){economyMode=next;houses?.selectMode({lootnpc:'npc',portamalas:'portamalas'}[next]);navigate('loot');}
   else if(next==='comerciante'){economyMode=next;npc?.selectMarket('CASAS');navigate('npc');}
   else{economyMode='quebrados';npc?.selectMarket('ARMAS_QUEBRADAS');navigate('npc');}
   return;
  }
  if(ev.target.closest('#apHouseMerchant')){npc?.selectMarket('CASAS');navigate('npc');return;}
  if(ev.target.closest('#apBackHouse')){houses?.selectMode('casas');navigate('loot');return;}
  const nav=ev.target.closest('[data-ap-nav]');
  if(nav){navigate(nav.dataset.apNav);return;}
  const profile=ev.target.closest('[data-ap-profile]');
  if(profile){navigate('profile',profile.dataset.apProfile);return;}
  if(ev.target.closest('#apBackCatalog')){navigate('catalog');return;}
  if(ev.target.closest('#apNewAction,#apCatalogNew')){openEditor();return;}
  if(ev.target.closest('#apEditAction')){openEditor(current());return;}
  if(ev.target.closest('#apDeleteAction')){
   const a=current();if(a)mutation(a.origemCadastro==='OFICIAL'?'archive':'delete',a.nome);return;
  }
  const restore=ev.target.closest('[data-ap-restore]');
  if(restore){mutation('restore',restore.dataset.apRestore);return;}
  if(ev.target.closest('#apReloadRegistry')){reload();return;}
  if(ev.target.closest('#apCloseEditor,#apCancelEditor')){closeEditor();return;}
  if(ev.target.closest('#apAddRule')){
   collectRows();draft.regras_confronto.push({invasores:2,policiais:4,refens:0});editorRows();return;
  }
  if(ev.target.closest('#apAddItem')){
   collectRows();draft.itens.push({nome:'',quantidade:1,categoria_item:'',preco_unitario:''});editorRows();return;
  }
  const remRule=ev.target.closest('[data-ap-rule-remove]');
  if(remRule){
   collectRows();draft.regras_confronto.splice(Number(remRule.dataset.apRuleRemove),1);editorRows();return;
  }
  const remItem=ev.target.closest('[data-ap-item-remove]');
  if(remItem){
   collectRows();draft.itens.splice(Number(remItem.dataset.apItemRemove),1);editorRows();return;
  }
 });
 root.addEventListener('change',ev=>{
  if(ev.target.id!=='apEntryType'||!draft)return;
  collectRows();draft.tipo_acao=ev.target.value;updatePrizeInputs();
  if(draft.tipo_acao==='atm'&&!draft.itens.length){draft.itens=[{nome:'C4',quantidade:1,categoria_item:'consumivel',preco_unitario:null}];editorRows();}
  if(draft.tipo_acao==='casas'&&!draft.itens.length){draft.itens=[{nome:'GAZUA ++',quantidade:1,categoria_item:'consumivel',preco_unitario:null}];editorRows();}
 });
 root.addEventListener('submit',ev=>{
  if(ev.target.id!=='apActionForm')return;
  ev.preventDefault();save();
 });
 root.addEventListener('keydown',ev=>{
  if(ev.key==='Escape'&&$('apEditorDialog').open)closeEditor();
 });
 $('apEditorDialog')?.addEventListener('close',()=>{draft=null;original='';});
 npc=createNpcWorkbench({
  root,getRegistry:()=>registry,getCatalog,canEdit:writable,onMarketChange:paint,
  onSave:async entry=>{
   if(!writable())throw Error('Sem permissão para alterar os compradores NPC.');
   registry=cleanRegistry(await onMutateRegistry({
    kind:'npc-save',entry,expectedRevision:registry.revision
   }));
   houses?.refresh();return registry;
  }
 });
 houses=createHouseWorkbench({root,getRegistry:()=>registry,getCatalog,canEdit:writable,onSave:async entry=>{
  if(!writable())throw Error('Sem permissão para registrar roubos.');
  registry=cleanRegistry(await onMutateRegistry({kind:'house-run-save',entry,expectedRevision:registry.revision}));
  return registry;
 }});
 visual=createEconomyVisual({root,getRegistry:()=>registry,getCatalog,getActions});
 simple=createSimpleEconomyPanel({root,getRegistry:()=>registry,getCatalog,getActions,getReference,
  onAreaChange:area=>{economyMode=area;
   if(area==='roubados'){houses?.selectMode('casas');navigate('loot','resumo',{tools:false});}
   else if(area==='acoes')navigate('overview','resumo',{tools:false});
   else navigate('catalog','resumo',{tools:false});
  },
  onOpenNpc:()=>{npc?.selectMarket('CASAS');navigate('npc');},
  onOpenHouse:()=>{houses?.selectMode('casas');navigate('loot');},
  onOpenAction:(name,preview)=>{if(!name)return;select(name);
   if(!preview||!Number.isFinite(preview.min)||!Number.isFinite(preview.max))return;
   for(const [id,value] of [['apManual',preview.min],['apManualMax',preview.max]]){
    const field=$(id);if(field){field.value=Math.max(1,Math.round(value));field.dispatchEvent(new Event('input',{bubbles:true}));}
   }
  },
  onNewAction:()=>{openEditor();const type=economyMode==='atm'?'atm':economyMode==='registradora'?'registradora':'blipada';
   const field=$('apEntryType');if(field&&type!=='blipada'){field.value=type;field.dispatchEvent(new Event('change',{bubbles:true}));}}
 });
 paint();
 return {load,merged,paint,openProfile,openSuggestion,navigate,reload};

}

