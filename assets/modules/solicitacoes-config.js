// Catálogo estático das solicitações operacionais do High OS.
export const REQUEST_TYPES=[
  ['GARAGEM',
'Garagem Pública'],

  ['HELIPONTO',
'Heliponto'],

  ['GARAGEM_VIP',
'Garagem VIP / VIP Fac'],

  ['GARAGEM_SERVICO',
'Garagem de Serviço / VIP Org'],

  ['GARAGEM_BLINDADOS',
'Garagem de Blindados'],

  ['ROTA_FARM',
'Rota de Farm Exclusiva'],

  ['BAU',
'Baú'],

  ['BLIP',
'Adição / Alteração de Blip'],

  ['REMOVER_BLIP',
'Remoção de Blip'],

  ['RADIO',
'Rádio Exclusiva'],

  ['BENEFICIOS',
'VIP Org / Benefícios e Setagens'],

  ['TELAO',
'Telão da Organização'],

  ['LOJA_FACCAO',
'Loja de Facção / Shop Exclusivo'],

  ['TELEPORT',
'Teleport'],

  ['WEBHOOK',
'Log / Webhook'],

  ['UNIFORME',
'Uniforme / Roupas'],

  ['ITENS',
'Criação / Alteração de Itens'],

  ['ALTERACAO_GROUP',
'Alteração de Group / Facção'],

  ['GERAL',
'Solicitação Geral']
];

export const TYPE_PLACEHOLDERS={
 GARAGEM:'Blip: {x,y,z,h}\nSpawn: {x,y,z,h}\nObservações:',

 HELIPONTO:'Blip: {x,y,z,h}\nSpawn: {x,y,z,h}\nObservações:',

 GARAGEM_VIP:'Veículos: LLMOTOSTIER2002, fooxcustomzlexrfc\nBlip: {x,y,z,h}\nSpawn: {x,y,z,h}\nObservações:',

 GARAGEM_SERVICO:'Tipo: SERVIÇO / VIP ORG\nVeículos: veiculo1, veiculo2\nBlip: {x,y,z,h}\nSpawn: {x,y,z,h}\nObservações:',

 GARAGEM_BLINDADOS:'Quantidade de vagas: 2\nBlip: {x,y,z,h}\nSpawn da garagem: {x,y,z,h}\nSpawn do veículo blindado: spawn_do_veiculo\nObservações:',

 ROTA_FARM:'Blips da rota nova:\n{x,y,z},\n{x,y,z},\n{x,y,z}\nObservações:',

 BAU:'CDS: {x,y,z,h}\nCapacidade: \nPermissão: \nObservações:',

 BLIP:'Tipo do blip: \nCDS: {x,y,z,h}\nSpawn: {x,y,z,h} (se houver)\nObservações:',

 REMOVER_BLIP:'Tipo do blip: \nCDS: {x,y,z,h}\nObservações:',

 RADIO:'Rádio: \nObservações:',

 BENEFICIOS:'Os benefícios são puxados automaticamente da ficha do Group.\nUse este campo somente para complemento/observação ou substituição pontual.\nObservações:',

 TELAO:'Os dados do telão são puxados automaticamente da ficha do Group.\nModelo do Telão: \nCDS/postit: \nCDS: \nObservações:',

 LOJA_FACCAO:'CDS: {x,y,z,h}\nObservações:',

 TELEPORT:'Entrada: {x,y,z,h}\nSaída: {x,y,z,h}\nObservações:',

 WEBHOOK:'Webhook: \nDiscord/Canal: \nPermissão: \nObservações:',

 UNIFORME:'Organização/Group: \nNome do uniforme: \nArquivo/anexo: \nCategoria/ajuste: \nObservações:',

 ITENS:'Nome do item: \nSpawn: \nArquivo PNG: spawn_do_item.png\nInteração/uso: \nDescrição: \nObservações:',

 ALTERACAO_GROUP:'Alteração solicitada: \nGroup atual: \nNovo Group: \nBlip/CDS relacionado: \nObservações:',

 GERAL:'Descreva de forma objetiva o que precisa ser realizado:\n\nDados técnicos / CDS / permissões:'
};
