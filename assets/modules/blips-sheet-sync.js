/* HIGH OS DEV — sincronização segura da aba BLIPS COORDENADAS.
 * A planilha existente usa 11 quadros de 7 colunas por seção.
 * Nunca reutilizar um N/A que ainda contenha dados técnicos.
 * Não reordenar, mover ou apagar os quadros antigos.
 */
const SHEET_ID="1zs-LNN1XS8t9cYwHe4_6TMxRDIy6yS-cLv66Rx_K9C4";
const TAB_GID=2037219913;
const GROUP_COLS=Array.from({length:11},(_,i)=>6+i*7);
// Campos podem chegar a 45+ linhas após ampliação do quadro.
const MAX_FIELDS_SCAN=90;

function plain(v){if(v==null||typeof v==="boolean"||typeof v==="object")return "";return String(v).trim();}
function fold(v){
 return plain(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/[^A-Z0-9]/g,"");
}
function sector(f){
 const s=fold(f.segmento);
 const g=fold(f.group);
 // O identificador canônico do Group prevalece sobre o segmento editável.
 // Um cadastro com segmento desatualizado não deve colocar a ficha na aba errada.
 if(g==="MANICOMIO")return ["DROGAS","Drogas"];
 // Segmentos criados pela gestão prevalecem sobre o agrupamento legado APOIO.
 if(s==="MECANICAILEGAL"||s==="MECANICAILLEGAL")return ["MECANICAILEGAL","Mecânica Ilegal"];
 if(s==="HOSPITALILEGAL")return ["HOSPITALILEGAL","Hospital Ilegal"];
 if(g.startsWith("ILEGALMECHANIC"))return ["MECANICAILEGAL","Mecânica Ilegal"];
 if(g.startsWith("ILEGALMEDIC"))return ["HOSPITALILEGAL","Hospital Ilegal"];
 const byGroup=[
  ["ARMAS","ARMAS","Armas"],["MUNICAO","MUNICAO","Munição"],
  ["DROGAS","DROGAS","Drogas"],["LAVAGEM","LAVAGEM","Lavagem"],
  ["DESMANCHE","DESMANCHE","Desmanche"],
  ["ESTELIONATARIOS","ESTELIONATARIOS","Estelionatários"],
  ["GALPAO","GALPOES","Galpões"],["CONTRABANDO","CONTRABANDO","Contrabando"]
 ];
 for(const [prefix,key,title] of byGroup){
  if(g.startsWith(prefix))return [key,title];
 }
 if(s.includes("ARMA"))return ["ARMAS","Armas"];
 if(s.includes("MUNIC"))return ["MUNICAO","Munição"];
 if(s.includes("DROG"))return ["DROGAS","Drogas"];
 if(s.includes("LAVAG"))return ["LAVAGEM","Lavagem"];
 if(s.includes("DESMANC"))return ["DESMANCHE","Desmanche"];
 if(s.includes("ESTELION"))return ["ESTELIONATARIOS","Estelionatários"];
 if(s.includes("GALPAO"))return ["GALPOES","Galpões"];
 if(s.includes("CONTRABANDO"))return ["CONTRABANDO","Contrabando"];
 if(s.includes("MECAN"))return ["MECANICAILEGAL","Mecânica Ilegal"];
 if(s.includes("HOSPITAL"))return ["HOSPITALILEGAL","Hospital Ilegal"];
 if(s.includes("APOIO"))return ["APOIO","Apoio"];
 return [s||"OUTROS",plain(f.segmento)||"Outros"];
}
function cell(rows,r,c){return plain(rows[r]?.[c]);}
function first(...vs){return vs.map(plain).find(Boolean)||"";}
function pair(x){
 if(!x)return "";
 if(typeof x==="string")return plain(x);
 return [plain(x.blip||x.cds)?"BLIP: "+plain(x.blip||x.cds):"",plain(x.spawn)?"SPAWN: "+plain(x.spawn):""].filter(Boolean).join("\n");
}
function joinPairs(items){return (items||[]).map(pair).filter(Boolean).join("\n\n");}
export function valuesFor(f){
 const b=f.beneficios||{};
 const t=f.perfilTecnico||{};
 const op=t.operacional||{};
 const gs=Array.isArray(op.garagens)?op.garagens:[];
 const garage=type=>gs.filter(g=>fold(g.tipo)===type);
 const fromExtra=t.estruturaExtra||{};
 const hei=Array.isArray(op.helipontos)?op.helipontos:[];
 return {
  GROUP:plain(f.group),
  LOCAL:first(op.localizacao?.nome,f.qg),
  PRODUTO:first(f.produto),
  COORDENADA:first(op.localizacao?.cdsPrincipal,f.cds),
  CRAFT:first(t.craft?.cds,b.craft),
  BARBEARIA:first(op.barbearia?.cds,b.barbearia),
  BAU:first(op.bau?.cds,b.bau,b.bauCds,fromExtra.bau,f.perfilFonte?.BAU),
  LOJADEROUPAS:first(op.roupas?.cds,b.lojaRoupas,f.perfilFonte?.["LOJA DE ROUPAS"]),
  GARAGEMVIPFAC:first(joinPairs(garage("FACCAO")),pair({blip:b.garagemVipBlip,spawn:b.garagemVipSpawn})),
  GARAGEMPUBLICA:first(joinPairs(garage("PUBLICA").concat(garage("PUBLICA2"))),pair({blip:b.garagemPublicaBlip,spawn:b.garagemPublicaSpawn})),
  GARAGEMDELUXE:first(joinPairs(garage("SERVICO").concat(garage("DELUXE"))),pair({blip:b.garagemDeluxeBlip,spawn:b.garagemDeluxeSpawn}),b.garagemDeluxe,f.perfilFonte?.["GARAGEM DELUXE"]),
  SHOPDELUXE:first(op.lojaFac?.cds,b.shopDeluxe,f.perfilFonte?.["SHOP DELUXE"]),
  SHOPEXCLUSIVO:first(op.lojaFac?.cds,b.shopExclusivo,b.shopDeluxe),
  ACADEMIA:first(b.academia),
  BAR:first(op.bar?.cds,fromExtra.bar),
  HELIPONTO:first(joinPairs(hei),pair({blip:b.helipontoBlip,spawn:b.helipontoSpawn})),
  BLINDADOS:first(joinPairs(Array.isArray(op.blindados)?op.blindados:[op.blindados]),b.blindados),
  FARM:first(t.farm?.cds,b.farm,b.iniciarFarm),
  INICIARFARM:first(t.farm?.cds,b.farm,b.iniciarFarm),
  GARAGEMPUBLICA2:first(joinPairs(garage("PUBLICA2")),pair({blip:b.garagemPublica2Blip,spawn:b.garagemPublica2Spawn})),
  TATUAGEM:first(op.tatuagem?.cds,b.tatuagem),
  ATM:first(b.atm),
  ARENA:first(b.arena),
  TELAO:first(op.telao?.cds,b.telaoCds),
  TELAOMODELO:first(op.telao?.modelo,b.telaoNome),
  TELAOPOSTIT:first(op.telao?.postit,b.telaoPostit),
  TELAOCAIXA1:first(op.telao?.sons?.[0],b.telaoCaixa1),
  TELAOCAIXA2:first(op.telao?.sons?.[1],b.telaoCaixa2),
  TELAOCAIXA3:first(op.telao?.sons?.[2],b.telaoCaixa3),
  TELAOCAIXA4:first(op.telao?.sons?.[3],b.telaoCaixa4),
  /* Benefícios e rota exclusiva NÃO pertencem à aba de coordenadas. */
 };
}
async function sheets(url,token,method="GET",body){
 const opt={method,headers:{"Authorization":"Bearer "+token}};
 if(body!==undefined){opt.headers["Content-Type"]="application/json";opt.body=JSON.stringify(body);}
 const response=await fetch(url,opt);
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(data?.error?.message||("Google Sheets HTTP "+response.status));
 return data;
}
function put(reqs,sheetId,row,col,val){
 reqs.push({updateCells:{start:{sheetId,rowIndex:row,columnIndex:col},
  rows:[{values:[{userEnteredValue:{stringValue:String(val)}}]}],fields:"userEnteredValue"}});
}
function sectionsIn(rows){
 const sections=[];
 for(let i=0;i<rows.length;i++){
  const name=cell(rows,i,4),key=fold(name);
  if(!["ARMAS","MUNICAO","DROGAS","LAVAGEM","DESMANCHE","EXTRA1","APOIO","ESTELIONATARIOS","GALPOES","CONTRABANDO","OUTROS","MECANICAILEGAL","HOSPITALILEGAL"].includes(key))continue;
  const header=Array.from({length:Math.min(20,rows.length-i)},(_,d)=>i+d).find(r=>GROUP_COLS.some(c=>fold(cell(rows,r,c-1))==="GROUP"));
  if(header===undefined)continue;
  const footer=Array.from({length:Math.min(MAX_FIELDS_SCAN,rows.length-header)},(_,d)=>header+d)
   .find(r=>GROUP_COLS.some(c=>fold(cell(rows,r,c-1))==="TRUE"));
  if(footer===undefined)continue;
  sections.push({sector:key,title:name,sectionRow:i,headerRow:header,footerRow:footer,
   entries:GROUP_COLS.filter(c=>fold(cell(rows,header,c-1))==="GROUP").map(c=>({col:c,name:cell(rows,header,c)})),reserved:new Set()});
 }
 return sections;
}
function safeBlank(rows,sec,entry){
 if(fold(entry.name)!=="NA"&&plain(entry.name)!=="")return false;
 for(let r=sec.headerRow+1;r<Math.min(sec.footerRow,rows.length);r++){
  // A seção tem seis colunas de dados entre este Group e o próximo título.
  for(let c=entry.col;c<entry.col+6;c++){
   if(cell(rows,r,c))return false;
  }
 }
 return true;
}
/* Preenche apenas células pertencentes ao quadro do Group; novas seções são
   clonadas ao FIM da aba com o layout expandido, sem inserir linhas dentro de
   quadros vizinhos nem apagar coordenadas antigas. */
export async function syncBlipsCoordinates({token,groups=[],onlyMissing=false,preserveExisting=true,overwriteFieldsByGroup={}}={}){
 if(!token)throw new Error("Conecte o Google Sheets para sincronizar Blips e Coordenadas.");
 const list=[...new Map(groups.filter(g=>g&&plain(g.group)).map(g=>[fold(g.group),g])).values()];
 if(!list.length)return {created:0,updated:0,skipped:0};
 const root="https://sheets.googleapis.com/v4/spreadsheets/"+SHEET_ID;
 const meta=await sheets(root+"?fields=sheets.properties(sheetId,title,gridProperties)",token);
 const tab=(meta.sheets||[]).find(s=>Number(s.properties?.sheetId)===TAB_GID)?.properties;
 if(!tab)throw new Error("A aba BLIPS COORDENADAS não foi encontrada.");
 const a1="'"+String(tab.title).replace(/'/g,"''")+"'";
 const range=a1+"!A1:CD"+Math.min(tab.gridProperties?.rowCount||1006,4000);
 const data=await sheets(root+"/values/"+encodeURIComponent(range)+"?valueRenderOption=FORMATTED_VALUE",token);
 const rows=data.values||[];
 const sections=sectionsIn(rows);
 if(!sections.length)throw new Error("Quadros da planilha não reconhecidos. Nenhuma alteração feita.");
 const requests=[];
 let created=0,updated=0,skipped=0;
 const categoryMismatches=[],duplicates=[];
 let nextStart=Math.max(rows.length+3,150),capacity=Number(tab.gridProperties?.rowCount||1006);
 const sectionBlocks=new Map();
 const findSector=key=>sections.filter(s=>s.sector===key);
 const planNewSection=(key,title)=>{
  let s=sectionBlocks.get(key);
  if(s&&s.reserved.size<s.entries.length)return s;
  const template=sections.find(x=>x.sector==="MUNICAO"&&!x.newBlock)||sections.find(x=>!x.newBlock);
  if(!template)throw new Error("Modelo visual da planilha não encontrado.");
  const height=template.footerRow-template.sectionRow+3,start=nextStart;
  nextStart+=height+3;
  if(nextStart>=capacity){
   const extra=Math.max(150,nextStart-capacity+10);
   requests.push({appendDimension:{sheetId:TAB_GID,dimension:"ROWS",length:extra}});
   capacity+=extra;
  }
  requests.push({copyPaste:{
   source:{sheetId:TAB_GID,startRowIndex:template.sectionRow,endRowIndex:template.sectionRow+height,startColumnIndex:4,endColumnIndex:82},
   destination:{sheetId:TAB_GID,startRowIndex:start,endRowIndex:start+height,startColumnIndex:4,endColumnIndex:82},
   pasteType:"PASTE_NORMAL",pasteOrientation:"NORMAL"}});
  // Limpa só os valores da cópia NOVA. Formatação, bordas e validações continuam.
  requests.push({repeatCell:{range:{sheetId:TAB_GID,startRowIndex:start,endRowIndex:start+height,startColumnIndex:4,endColumnIndex:82},cell:{},fields:"userEnteredValue"}});
  const headerRow=start+template.headerRow-template.sectionRow;
  const footerRow=start+template.footerRow-template.sectionRow;
  const labels=Array.from({length:template.footerRow-template.headerRow},(_,i)=>cell(rows,template.headerRow+i,5));
  const cols=template.entries.map(x=>x.col);
  put(requests,TAB_GID,start,4,title);
  put(requests,TAB_GID,start,8,"0");
  for(let d=0;d<labels.length;d++)if(labels[d]){
   for(const col of cols)put(requests,TAB_GID,headerRow+d,col-1,labels[d]);
  }
  for(const col of cols){
   put(requests,TAB_GID,footerRow,col-1,"TRUE");
   put(requests,TAB_GID,footerRow,col,"COMPLETO");
  }
  s={sector:key,title,sectionRow:start,headerRow,footerRow,labels,
   entries:cols.map(col=>({col,name:""})),reserved:new Set(),newBlock:true};
  sections.push(s);sectionBlocks.set(key,s);
  return s;
 };
 for(const f of list){
  const key=fold(f.group),[sectorKey,title]=sector(f);
  const correct=findSector(sectorKey);
  let selected=null,isNew=false;
  // Primeiro tenta a ficha já existente NA categoria correta.
  for(const s of correct){
   const entry=s.entries.find(e=>fold(e.name)===key);
   if(entry){selected={s,entry};break;}
  }
  // Se já existe em uma seção histórica diferente, atualiza-a sem criar duplicata.
  if(!selected)for(const s of sections){
   const entry=s.entries.find(e=>fold(e.name)===key);
   if(entry){selected={s,entry};categoryMismatches.push({group:f.group,actual:s.sector,expected:sectorKey});break;}
  }
  const matches=sections.flatMap(sec=>sec.entries.filter(e=>fold(e.name)===key).map(e=>sec.sector));
  if(matches.length>1)duplicates.push({group:f.group,sectors:matches});
  if(selected&&onlyMissing){skipped++;continue;}
  if(!selected){
   for(const s of correct){
    const entry=s.entries.find(e=>!s.reserved.has(e.col)&&(s.newBlock||safeBlank(rows,s,e)));
    if(entry){selected={s,entry};isNew=true;s.reserved.add(entry.col);break;}
   }
  }
  if(!selected){
   const s=planNewSection(sectorKey,title);
   const entry=s.entries.find(e=>!s.reserved.has(e.col));
   if(!entry)throw new Error("Sem espaço para Group "+f.group);
   s.reserved.add(entry.col);
   selected={s,entry};isNew=true;
  }
  const {s,entry}=selected;
  const fields=valuesFor(f),col=entry.col,header=s.headerRow;
  const forceFields=new Set((overwriteFieldsByGroup[key]||overwriteFieldsByGroup[f.group]||[]).map(fold));
  // Campos por rótulo, não por posição fixa: há diferenças entre os segmentos.
  for(let r=header;r<Math.min(s.footerRow,header+MAX_FIELDS_SCAN);r++){
   const label=s.newBlock?s.labels[r-header]:cell(rows,r,col-1);
   if(!label||fold(label)==="TRUE")continue;
   const fieldKey=fold(label),value=fields[fieldKey];
   const explicitChange=forceFields.has(fieldKey);
   // Só uma alteração EXPLÍCITA pode limpar valor antigo.
   if(!value&&!explicitChange)continue;
   const found=s.newBlock?"":first(...Array.from({length:6},(_,i)=>cell(rows,r,col+i)));
   if(!value&&!found)continue;
   if(!isNew&&value===found)continue;
   if(!isNew&&onlyMissing)continue;
   if(!isNew&&preserveExisting&&found&&!explicitChange)continue; // entrega não altera instalações preexistentes
   const occupiedColumns=s.newBlock?[]:Array.from({length:6},(_,i)=>col+i)
    .filter(c=>Boolean(cell(rows,r,c)));
   // Há planilhas históricas com dados técnicos repartidos entre colunas.
   // Substituir só a primeira esconderia as demais CDS e criaria estado misto.
   if(explicitChange&&occupiedColumns.length>1){
    throw new Error("BLIPS COORDENADAS: "+f.group+" / "+label+
     " possui "+occupiedColumns.length+" células preenchidas. "+
     "Revise/consolide este campo na planilha antes de alterar; nada foi gravado.");
   }
   const existingAnchor=occupiedColumns[0]??col;
   put(requests,TAB_GID,r,existingAnchor,value);
  }
  if(s.newBlock)put(requests,TAB_GID,s.sectionRow,8,String(s.reserved.size));
  if(isNew){created++;entry.name=f.group;}else updated++;
 }
 if(requests.length){
  // Limite defensivo: uma falha não deve apagar a planilha preexistente.
  await sheets(root+":batchUpdate",token,"POST",{requests});
 }
 return {created,updated,skipped,groups:list.length,sectionsAdded:[...sectionBlocks.keys()],categoryMismatches,duplicates};
}
