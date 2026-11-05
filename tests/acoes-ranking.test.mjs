import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const coreText=readFileSync(new URL('../assets/modules/acoes-core.js',import.meta.url),'utf8');
const coreUrl='data:text/javascript,'+encodeURIComponent(coreText);
const rankingsText=readFileSync(new URL('../assets/modules/acoes-ranking.js',import.meta.url),'utf8')
 .replace("from './acoes-core.js?v=5'",'from '+JSON.stringify(coreUrl));
const {RANKING_MODES,rankingMetrics,buildActionRankings}=
 await import('data:text/javascript,'+encodeURIComponent(rankingsText));

const catalog={itens:[
 {item:'PISTOLA T54',pista:38000,status:'ativo'},
 {item:'PISTOLA 100X',pista:13500,status:'ativo'},
 {item:'UZI',pista:47000,status:'ativo'},
 {item:'FAL',pista:180000,status:'ativo'},
 {item:'FUZIL 250X',pista:22000,status:'ativo'},
 {item:'COLETE',pista:13000,status:'ativo'},
 {item:'PENDRIVE 2',pista:10500,status:'ativo'},
 {item:'PENDRIVE 5',pista:30000,status:'ativo'}
]};
const create=(nome,players,prize,itens,status='ativo')=>({
 nome,status,premio_min:prize,premio_max:Math.round(prize*1.1),
 regras_confronto:[{invasores:players,policiais:players+2,refens:1}],itens
});
const pistol=(players)=>[
 {nome:'ARMA PISTOLA',quantidade:players},
 {nome:'MUNIÇÃO PISTOLA (x100)',quantidade:players},
 {nome:'COLETE',quantidade:players},
 {nome:'PENDRIVE 2',quantidade:1}
];
const rifle=(players)=>[
 {nome:'ARMA FUZIL',quantidade:players},
 {nome:'MUNIÇÃO FUZIL (x250)',quantidade:players},
 {nome:'COLETE',quantidade:players},
 {nome:'PENDRIVE 5',quantidade:1}
];
const actions=[
 create('BANCO MAIOR LUCRO',10,4000000,rifle(10)),
 create('MEGA RETORNO INDIVIDUAL',1,800000,pistol(1)),
 create('LOJA RETORNO MEDIO',2,700000,pistol(2)),
 create('BARBEARIA MENOR',1,150000,pistol(1)),
 create('INATIVA ALTO VALOR',1,99999999,pistol(1),'inativo'),
 create('INSUMO INDISPONIVEL',2,99999999,[...pistol(2),{nome:'PENDRIVE CLANDESTINO 3',quantidade:1}]),
 create('SEM EQUIPE',1,99999999,pistol(1))
];
actions[6].regras_confronto=[];
test('Gera rankings distintos para lucros absolutos, percentuais e por jogador',()=>{
 const report=buildActionRankings(actions,catalog);
 assert.equal(report.total,7);
 assert.equal(report.included.length,4);
 assert.equal(report.excluded.length,3);
 assert.equal(report.rankings['lucro-total'][0].action.nome,'BANCO MAIOR LUCRO');
 assert.equal(report.rankings['lucro-membro'][0].action.nome,'MEGA RETORNO INDIVIDUAL');
 assert.equal(report.rankings['rentabilidade'][0].action.nome,'MEGA RETORNO INDIVIDUAL');
 assert.equal(report.rankings['investimento'][0].action.nome,'BANCO MAIOR LUCRO');
 assert.equal(report.rankings['menos-rentaveis'][0].action.nome,'BARBEARIA MENOR');
 assert.equal(report.rankings['menor-lucro'][0].action.nome,'BARBEARIA MENOR');
 assert.deepEqual(report.rankings['lucro-total'].map(x=>x.position),[1,2,3,4]);
});
test('Exclui ações inativas, item sem preço ou equipe inválida',()=>{
 const report=buildActionRankings(actions,catalog);
 assert.ok(report.excluded.some(e=>e.action.nome==='INATIVA ALTO VALOR'&&e.reason==='inativa'));
 assert.ok(report.excluded.some(e=>e.action.nome==='INSUMO INDISPONIVEL'&&e.reason.includes('insumo sem preço')));
 assert.ok(report.excluded.some(e=>e.action.nome==='SEM EQUIPE'&&e.reason==='equipe sem regra válida'));
 for(const m of RANKING_MODES)assert.equal(report.rankings[m.id].length,4,m.id);
});
test('Maior investimento considera o kit integral e o máximo permitido de jogadores',()=>{
 const report=buildActionRankings(actions,catalog);
 const top=report.rankings['investimento'][0];
 assert.equal(top.calc.team,10);
 assert.equal(top.value,2180000);
 assert.equal(top.calc.kit.winCost,226000);
 assert.equal(top.calc.loss,-2180000);
});
test('Ranking usa o prêmio mínimo e a reposição para o lucro de vitória',()=>{
 const report=buildActionRankings(actions,catalog);
 const banco=report.rankings['lucro-total'][0];
 assert.equal(banco.value,2574000);
 assert.equal(banco.calc.netMax,2854000);
 assert.equal(report.rankings['lucro-membro'][0].value,523000);
});
test('Rentabilidade é lucro por capital em risco, não percentual sobre consumíveis',()=>{
 const report=buildActionRankings(actions,catalog);
 const r=report.rankings['rentabilidade'][0];
 assert.equal(r.calc.kit.total,75000);
 assert.ok(Math.abs(r.value-(523000/75000))<1e-10);
 assert.equal(report.rankings['menos-rentaveis'][0].value,68000/75000);
});
test('Premiação após lavagem varia sem misturar cenário de preço simulado',()=>{
 const a=actions[0];
 const base=rankingMetrics(a,catalog,{tax:.3});
 const higherTax=rankingMetrics(a,catalog,{tax:.4});
 assert.equal(base.valid,true);
 assert.ok(higherTax.fields.netMin<base.fields.netMin);
 const results=buildActionRankings(actions,catalog,{tax:.3,ammoUse:1,accessConsumed:false});
 assert.equal(results.rankings['investimento'][0].value,2180000);
 assert.ok(results.rankings['lucro-total'][0].value<base.fields.netMin+30000);
});
test('Painel, navegação para os detalhes e imagens integradas estão presentes',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../assets/modules/acoes-planejador-ui.js',import.meta.url),'utf8');
 const app=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
 for(const id of ['apRankingHeading','apRankingTabs','apRankingHighlights','apRankingLimit','apRankingResults','apRankingMethod'])
  assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(ui,/data-ap-ranked/);
 assert.match(ui,/rankBoard\(\);refreshPriceAlerts\(\);[\s\S]*?teamOptions\(\)/);
 assert.match(ui,/actionPhoto\(a\)/);
 assert.match(ui,/data-ap-rank/);
 assert.match(app,/acoes-planejador-ui\.js\?v=\d+/);
});

