/* High OS V13 - itens que o sistema ja conhece.
   Gerado de ITEM_META e das artes em assets/itens/. Serve para o
   cadastro de receita OFERECER o item em vez de exigir que alguem
   lembre o spawn de cabeca - digitar errado ali vira uma rota que o
   jogador nunca acha.
   A lista nao e um limite: qualquer spawn novo continua aceito. */

export const ITENS_CONHECIDOS={
 "acetone":{"nome":"Acetona","imagem":"acetone.png"},
 "acid":{"nome":"Ácido","imagem":"acid.png"},
 "adrenalina":{"nome":"","imagem":"adrenalina.png"},
 "adrenalineclandestineplus":{"nome":"","imagem":"adrenalineclandestineplus.png"},
 "ak102":{"nome":"","imagem":"ak102.png"},
 "ak74n":{"nome":"","imagem":"ak74n.png"},
 "alcohol":{"nome":"Álcool","imagem":"alcohol.png"},
 "attachbox":{"nome":"","imagem":"attachbox.png"},
 "ballisticplate":{"nome":"","imagem":"ballisticplate.png"},
 "blocksignal":{"nome":"","imagem":"blocksignal.png"},
 "c4":{"nome":"","imagem":"c4.png"},
 "caixa_m_pistola":{"nome":"","imagem":"caixa_m_pistola.png"},
 "caixa_m_rifle":{"nome":"","imagem":"caixa_m_rifle.png"},
 "caixa_m_smg":{"nome":"","imagem":"caixa_m_smg.png"},
 "dismantleplus":{"nome":"","imagem":"dismantleplus.png"},
 "dollar":{"nome":"Dólar","imagem":"dollar.png"},
 "elastic":{"nome":"Elástico","imagem":"elastic.png"},
 "electroniccomponents":{"nome":"Componentes Eletrônicos","imagem":"electroniccomponents.png"},
 "explosives":{"nome":"Explosivos","imagem":"explosives.png"},
 "fibrasin":{"nome":"Fibra Sintética","imagem":"fibrasin.png"},
 "glock":{"nome":"","imagem":"glock.png"},
 "gunpowder":{"nome":"Frasco de Pólvora","imagem":"gunpowder.png"},
 "handcuff":{"nome":"","imagem":"handcuff.png"},
 "hood":{"nome":"","imagem":"hood.png"},
 "infectedbandage":{"nome":"","imagem":"infectedbandage.png"},
 "kunk":{"nome":"Kunk","imagem":"weedbud.png"},
 "lavagem":{"nome":"","imagem":"lavagem.png"},
 "lockpick":{"nome":"","imagem":"lockpick.png"},
 "lockpickplus":{"nome":"","imagem":"lockpickplus.png"},
 "misturaquimica":{"nome":"Mistura Química","imagem":"misturaquimica.png"},
 "notebook":{"nome":"","imagem":"notebook.png"},
 "packdrug1":{"nome":"","imagem":"packdrug1.png"},
 "packdrug2":{"nome":"","imagem":"packdrug2.png"},
 "packdrug3":{"nome":"","imagem":"packdrug3.png"},
 "packdrug4":{"nome":"","imagem":"packdrug4.png"},
 "pager":{"nome":"","imagem":"pager.png"},
 "paper":{"nome":"Papel","imagem":"paper.png"},
 "pendrive1":{"nome":"","imagem":"pendrive1.png"},
 "pendrive2":{"nome":"","imagem":"pendrive2.png"},
 "pendrive3":{"nome":"","imagem":"pendrive3.png"},
 "pendrive4":{"nome":"","imagem":"pendrive4.png"},
 "pendrive5":{"nome":"","imagem":"pendrive5.png"},
 "pistolbody":{"nome":"Corpo de Pistola","imagem":"pistolbody.png"},
 "plastic":{"nome":"Plástico","imagem":"plastic.png"},
 "projectile":{"nome":"Projétil","imagem":"projectile.png"},
 "racesticketplus":{"nome":"","imagem":"racesticketplus.png"},
 "riflebody":{"nome":"Corpo de Rifle","imagem":"riflebody.png"},
 "rubber":{"nome":"Borracha","imagem":"rubber.png"},
 "saline":{"nome":"Soro Fisiológico","imagem":"saline.png"},
 "sheetmetal":{"nome":"Chapa de Metal","imagem":"sheetmetal.png"},
 "sigsauer556":{"nome":"","imagem":"sigsauer556.png"},
 "smgbody":{"nome":"Corpo de Sub","imagem":"smgbody.png"},
 "sulfuric":{"nome":"Ácido Sulfúrico","imagem":"sulfuric.png"},
 "syringe":{"nome":"Seringa","imagem":"syringe.png"},
 "t54":{"nome":"","imagem":"t54.png"},
 "tarp":{"nome":"Lona","imagem":"tarp.png"},
 "techtrash":{"nome":"Lixo Eletrônico","imagem":"techtrash.png"},
 "washbleach":{"nome":"Alvejante","imagem":"washbleach.png"},
 "WEAPON_ASSAULTRIFLE":{"nome":"","imagem":"WEAPON_ASSAULTRIFLE.png"},
 "WEAPON_ASSAULTRIFLE_MK2":{"nome":"","imagem":"WEAPON_ASSAULTRIFLE_MK2.png"},
 "WEAPON_ASSAULTSMG":{"nome":"","imagem":"WEAPON_ASSAULTSMG.png"},
 "WEAPON_FNFAL":{"nome":"","imagem":"WEAPON_FNFAL.png"},
 "WEAPON_MACHINEPISTOL":{"nome":"","imagem":"WEAPON_MACHINEPISTOL.png"},
 "WEAPON_PISTOL50":{"nome":"","imagem":"WEAPON_PISTOL50.png"},
 "WEAPON_SPECIALCARBINE_MK2":{"nome":"","imagem":"WEAPON_SPECIALCARBINE_MK2.png"},
 "WEAPON_VINTAGEPISTOL":{"nome":"","imagem":"WEAPON_VINTAGEPISTOL.png"},
 "weedbud":{"nome":"Bud de Maconha","imagem":"weedbud.png"},
 "woodlog":{"nome":"Tora de Madeira","imagem":"woodlog.png"},
 "ziplock":{"nome":"Ziplock","imagem":"ziplock.png"}
};

export function listaDeItens(extras=[]){
 const saida=new Map();
 for(const [spawn,v] of Object.entries(ITENS_CONHECIDOS))saida.set(spawn.toLowerCase(),{spawn,nome:v.nome||spawn,imagem:v.imagem||''});
 for(const x of extras||[]){
  const sp=String(x?.spawn||x?.__name||x||'').trim();
  if(!sp)continue;
  const k=sp.toLowerCase();
  if(!saida.has(k))saida.set(k,{spawn:sp,nome:String(x?.nome||x?.__name||sp),imagem:''});
 }
 return [...saida.values()].sort((a,b)=>a.spawn.localeCompare(b.spawn));
}

export function nomeDoItem(spawn=''){
 const v=ITENS_CONHECIDOS[String(spawn).trim()]||ITENS_CONHECIDOS[String(spawn).trim().toLowerCase()];
 return v?.nome||'';
}
