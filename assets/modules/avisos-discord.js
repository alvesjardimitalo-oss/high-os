/* High OS V13 - modelos de aviso que a webhook posta no Discord.
   Duas saidas para o mesmo dado: texto puro (colar na mao) e embed
   (JSON que a webhook aceita). O modelo mora aqui e em lugar nenhum
   mais, para o texto do painel nunca divergir do que vai ao ar. */

export const BASE_IMAGENS='https://alvesjardimitalo-oss.github.io/high-os/assets/avisos/';

/* Cada banner pertence a um canal especifico do Discord: a arte do
   rodape identifica a postagem. Nunca reaproveitar um banner em outro
   aviso - quem le o canal reconhece a arte antes de ler o texto. */
export const BANNERS={
 'chat-geral':'Chat Geral',
 'valores-itens':'Valores dos Itens',
 'atualizacoes-gerais':'Atualizações Gerais',
 'cupons':'Cupons',
 'punicoes':'Punições',
 'mochilas-uniformes':'Mochilas & Uniformes',
 'live-on':'Live On',
 'sugestoes':'Sugestões',
 'hierarquia-staff':'Hierarquia Staff',
 'funcoes-staff':'Funções Staff',
 'faccoes-entregues':'Facções Entregues',
 'faccoes-retomadas':'Facções Retomadas',
 'gerar-convites':'Gerar Convites',
 'planilhas-ilg':'Planilhas ILG',
 'solicitacoes-ilg':'Solicitações ILG',
 'cronograma-ilg':'Cronograma ILG',
 'tier-faccoes':'Tier Facções',
 'tier-avisos':'Tier Avisos',
 'tier-infos':'Tier Infos',
 'tier-mensal':'Tier Mensal',
 'premiacoes-geral':'Premiações Geral',
 'ranking-geral-ilegal':'Ranking Geral Ilegal'
};
export function banner(slug=''){
 if(!BANNERS[slug])throw new Error(`Banner desconhecido: "${slug}". Use um dos slugs de BANNERS.`);
 return BASE_IMAGENS+slug+'.jpg';
}

export const IMG_ENTREGUES=banner('faccoes-entregues');
export const IMG_RETOMADAS=banner('faccoes-retomadas');
export const COR_ILEGAL=0x8d35ff;
export const RODAPE='H | Ilegal High Season 3';

/* Campo vazio vira o placeholder entre colchetes do modelo, para quem
   recebe saber que falta preencher em vez de ler uma linha em branco. */
const ou=(v,placeholder)=>{
 const t=String(v==null?'':v).trim();
 return t||`[${placeholder}]`;
};

function montar(titulo,linhas,imagem,rodape){
 const corpo=linhas.filter(l=>l!==null&&l!==undefined).join('\n');
 return {
  titulo,
  texto:`**${titulo}**\n\n${corpo}`,
  embed:{
   title:titulo,
   description:corpo,
   color:COR_ILEGAL,
   image:{url:imagem},
   footer:{text:rodape||RODAPE},
   timestamp:new Date().toISOString()
  }
 };
}

/* ---------- ENTREGA DE ORGANIZACAO ---------- */
export function avisoEntrega(d={}){
 const beneficios=(Array.isArray(d.beneficios)?d.beneficios:String(d.beneficios||'').split(/\r?\n/))
  .map(b=>String(b).trim()).filter(Boolean);

 const linhas=[
  `Group: ${ou(d.group,'Group aqui')}`,
  `QG / Local: ${ou(d.local,'Local aqui')}`,
  `Segmento: ${ou(d.segmento,'Eixo/segmento aqui')}`,
  `Facção: ${ou(d.faccao,'Nome da facção aqui')}`,
  `Líder: ${ou(d.lider,'ID e nome do líder aqui')}`,
  `Staff responsável: ${ou(d.responsavel,'Nome do Resp. aqui')}`,
  `Data: ${ou(d.data,'Data aqui')}`,
  `Oferta: ${ou(d.oferta,'O que ofereceu para a Org ficar.')}`,
  `Observação: ${String(d.observacao||'').trim()||'Vip Org Ultra caso bater a meta.'}`,
  `Meta de Rec: ${ou(d.metaRec,'quantidade de rec por semana ou dias específicos')}`,
  '',
  'Benefícios entregues:',
  '',
  ...(beneficios.length?beneficios.map(b=>b.toUpperCase()):['[Benefícios aqui]'])
 ];
 return montar('ENTREGA DE ORGANIZAÇÃO — HIGH ILEGAL',linhas,IMG_ENTREGUES,d.rodape);
}

/* ---------- RECOLHIMENTO DE FACCAO ---------- */
export function avisoRecolhimento(d={}){
 const linhas=[
  `Group: ${ou(d.group,'Group aqui')}`,
  `QG / Local: ${ou(d.local,'Local aqui')}`,
  `Segmento: ${ou(d.segmento,'Eixo/segmento aqui')}`,
  `Facção recolhida: ${ou(d.faccao,'Facção aqui')}`,
  `Líder: ${ou(d.lider,'ID e nome aqui')}`,
  `Motivo: ${ou(d.motivo,'Motivo aqui, exemplo; Solicitação da liderança')}`,
  `Data: ${ou(d.data,'Data aqui')}`,
  `Hora: ${ou(d.hora,'Hora aqui')}`,
  `Responsável: ${ou(d.responsavel,'Resp aqui')}`,
  `Justificativa: ${ou(d.justificativa,'Justificativa aqui, exemplo; Líder desistiu')}`,
  '',
  `Status final: ${String(d.statusFinal||'').trim()||'Facção vazia.'}`
 ];
 return montar('RECOLHIMENTO DE FACÇÃO — HIGH ILEGAL',linhas,IMG_RETOMADAS,d.rodape);
}

/* Corpo pronto para POST na webhook do Discord. */
export function corpoWebhook(aviso,{username='Ilegal High - Bot Central',avatar=''}={}){
 const body={username,embeds:[aviso.embed]};
 if(avatar)body.avatar_url=avatar;
 return body;
}

/* ---------- preenchimento a partir do cadastro ---------- */
/* Traz do registro da faccao o que o painel ja sabe, para o staff so
   completar o que e do atendimento (oferta, meta, justificativa). */
export function dadosDaFaccao(f={},extra={}){
 const b=f.beneficios||{};
 const marcados=[];
 if(b.garagemVipBlip||b.garagemVipSpawn||b.vipOrg)marcados.push('GARAGEM VIP');
 if(b.telao)marcados.push('TELÃO');
 if(b.farm)marcados.push('FARM');
 if(b.craft)marcados.push('CRAFT');
 if(b.garagemPublica)marcados.push('GARAGEM PÚBLICA');
 if(b.heliponto)marcados.push('HELIPONTO');
 if(b.rotaExclusiva)marcados.push('ROTA EXCLUSIVA');
 if(b.barbearia)marcados.push('BARBEARIA');
 if(b.lojaRoupas)marcados.push('LOJA DE ROUPAS');
 if(b.tatuagem)marcados.push('TATUAGEM');
 if(b.arena)marcados.push('ARENA');
 if(b.bau)marcados.push('BAÚ');

 const agora=new Date();
 return {
  group:f.group||'',
  local:f.qg||'',
  segmento:f.segmento||'',
  faccao:f.faccao||'',
  lider:f.lider||'',
  data:agora.toLocaleDateString('pt-BR'),
  hora:agora.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),
  beneficios:marcados,
  ...extra
 };
}
