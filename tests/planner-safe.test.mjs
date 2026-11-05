import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const src=readFileSync(new URL('../assets/mission-planner.js',import.meta.url),'utf8');
const start=src.indexOf('function safeRouteAudit(m)');
const end=src.indexOf('function elevationSamples()',start);
assert.ok(start>=0&&end>start);
const fn=src.slice(start,end).trim();
const audit=(m,analysis=[])=>Function(
 'ensureSafeRoute','safeStageValid','safeTotalSeconds','safeInitialStage','safeWalkAnalysis',
 'return ('+fn+');'
)(
 x=>x.safeRoute||null,
 x=>!!x&&Number.isFinite(Number(x.x))&&Number.isFinite(Number(x.y))&&Number(x.radius)>0,
 x=>x.seconds||0,
 x=>({...x.center,radius:x.radius}),
 ()=>analysis
)(m);
const valid=(event='Modo Sobrevivência',seconds=1200)=>({
 category:'gas',event,seconds,
 center:{x:0,y:0},radius:1000,
 safeRoute:{stages:[
  {x:0,y:0,radius:700,closeSeconds:100,moveSeconds:200},
  {x:0,y:0,radius:400,closeSeconds:100,moveSeconds:200},
  {x:0,y:0,radius:100,closeSeconds:100,moveSeconds:200}
 ]}
});

test('Sobrevivência sem SAFE dinâmica não pode gerar solicitação',()=>{
 const issues=audit({category:'gas',event:'Modo Sobrevivência',center:{x:0,y:0},radius:1000});
 assert.ok(issues.some(x=>/não foi configurada/.test(x)));
});
test('SAFE com menos de 20 minutos é bloqueada em Sobrevivência e Battle Royale',()=>{
 for(const event of ['Modo Sobrevivência','Battle Royale']){
  const issues=audit(valid(event,1100));
  assert.ok(issues.some(x=>/1200/.test(x)),event);
 }
});
test('SAFE de 20 minutos bem posicionada não apresenta bloqueio',()=>{
 assert.deepEqual(audit(valid()),[]);
});
test('SAFE posicionada fora da etapa anterior é bloqueada',()=>{
 const m=valid();m.safeRoute.stages[1].x=500;
 assert.ok(audit(m).some(x=>/fora dos limites/.test(x)));
});
test('SAFE sem margem para fuga a pé é bloqueada',()=>{
 const issues=audit(valid(),[{from:'S1',to:'S2',canEscape:true,physicalMargin:8,pvpExtraNeeded:7}]);
 assert.ok(issues.some(x=>/margem de fuga/.test(x)));
});
test('Fac x Fac sem SAFE dinâmica continua permitido',()=>{
 assert.deepEqual(audit({category:'gas',event:'Fac x Fac',radius:1000}),[]);
});
test('Validação é chamada antes de gerar solicitação de evento',()=>{
 const from=src.indexOf('function generateRequest(opts='),to=src.indexOf('function highRequestExport()',from);
 assert.match(src.slice(from,from+850),/requireSafePreflight\(m,'gerar a solicitação'\)/);
 const pre=src.slice(src.indexOf('function requireSafePreflight('),src.indexOf('function highRequestExport()'));
 assert.match(pre,/return false/);
 assert.match(pre,/safeRouteAudit\(m\)/);
});
