// HIGH OS — modelos dos avisos de ENTREGA e RECOLHIMENTO que vão para a webhook do Discord.
// Mantidos do sistema anterior (texto, cor, banner e rodapé), para o canal continuar igual.
export const BASE_IMAGENS = 'https://alvesjardimitalo-oss.github.io/high-os/assets/avisos/';
export const IMG_ENTREGA = BASE_IMAGENS + 'faccoes-entregues.jpg';
export const IMG_RECOLHIMENTO = BASE_IMAGENS + 'faccoes-retomadas.jpg';
export const COR_ILEGAL = 0x8d35ff;
export const RODAPE = 'H | Ilegal High Season 3';

/* Campo vazio vira o marcador entre colchetes, para quem lê saber o que falta. */
const ou = (v, marcador) => String(v ?? '').trim() || `[${marcador}]`;

function montar(titulo, linhas, imagem, rodape) {
  const corpo = linhas.filter((l) => l !== null && l !== undefined).join('\n');
  return {
    titulo,
    texto: `**${titulo}**\n\n${corpo}`,
    embed: { title: titulo, description: corpo, color: COR_ILEGAL, image: { url: imagem }, footer: { text: rodape || RODAPE }, timestamp: new Date().toISOString() },
  };
}

export function avisoEntrega(d = {}) {
  const beneficios = (Array.isArray(d.beneficios) ? d.beneficios : String(d.beneficios || '').split(/\r?\n/)).map((b) => String(b).trim()).filter(Boolean);
  return montar('ENTREGA DE ORGANIZAÇÃO — HIGH ILEGAL', [
    `Group: ${ou(d.group, 'Group aqui')}`,
    `QG / Local: ${ou(d.local, 'Local aqui')}`,
    `Segmento: ${ou(d.segmento, 'Eixo/segmento aqui')}`,
    `Facção: ${ou(d.faccao, 'Nome da facção aqui')}`,
    `Líder: ${ou(d.lider, 'ID e nome do líder aqui')}`,
    `Staff responsável: ${ou(d.responsavel, 'Nome do Resp. aqui')}`,
    `Data: ${ou(d.data, 'Data aqui')}`,
    `Oferta: ${ou(d.oferta, 'O que ofereceu para a Org ficar.')}`,
    `Observação: ${String(d.observacao || '').trim() || 'Vip Org Ultra caso bater a meta.'}`,
    `Meta de Rec: ${ou(d.metaRec, 'quantidade de rec por semana ou dias específicos')}`,
    '', 'Benefícios entregues:', '',
    ...(beneficios.length ? beneficios.map((b) => b.toUpperCase()) : ['[Benefícios aqui]']),
  ], IMG_ENTREGA, d.rodape);
}

export function avisoRecolhimento(d = {}) {
  return montar('RECOLHIMENTO DE FACÇÃO — HIGH ILEGAL', [
    `Group: ${ou(d.group, 'Group aqui')}`,
    `QG / Local: ${ou(d.local, 'Local aqui')}`,
    `Segmento: ${ou(d.segmento, 'Eixo/segmento aqui')}`,
    `Facção recolhida: ${ou(d.faccao, 'Facção aqui')}`,
    `Líder: ${ou(d.lider, 'ID e nome aqui')}`,
    `Motivo: ${ou(d.motivo, 'Motivo aqui, exemplo; Solicitação da liderança')}`,
    `Data: ${ou(d.data, 'Data aqui')}`,
    `Hora: ${ou(d.hora, 'Hora aqui')}`,
    `Responsável: ${ou(d.responsavel, 'Resp aqui')}`,
    `Justificativa: ${ou(d.justificativa, 'Justificativa aqui, exemplo; Líder desistiu')}`,
    '', `Status final: ${String(d.statusFinal || '').trim() || 'Facção vazia.'}`,
  ], IMG_RECOLHIMENTO, d.rodape);
}

/** Corpo pronto para POST na webhook do Discord. */
export const corpoWebhook = (aviso, { username = 'Ilegal High - Bot Central' } = {}) => ({ username, embeds: [aviso.embed] });

/** Webhook do Discord válida (só aceita o endereço oficial). */
export const webhookValida = (url) => /^https:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+$/.test(String(url || '').trim());

/** Benefícios que o cadastro já conhece, para pré-preencher a entrega. */
export function beneficiosDaFaccao(f) {
  if (!f) return [];
  const b = f.beneficios || {};
  const ok = (v) => v && !/^(NÃO POSSUI|NAO POSSUI|NÃO SE APLICA|)$/i.test(String(v).trim());
  return [
    ...f.vips.map((v) => v.nome),
    ok(f.garagemVip) && 'Garagem VIP',
    ok(b.radio) && 'Rádio exclusiva',
    ok(b.chat) && 'Chat de facção',
    ok(b.uniforme) && 'Uniforme: ' + b.uniforme,
    ok(b.salario) && 'Salário: ' + b.salario + ' / 40 min',
    ok(b.bau) && 'Baú: ' + b.bau,
  ].filter(Boolean);
}
