import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
const rules=readFileSync(new URL('../firestore.rules',import.meta.url),'utf8');

test('Transferência grava Groups, histórico e organizações juntos; ocupação auxiliar tem fallback',()=>{
 const from=app.indexOf("$('#movementConfirm')?.addEventListener");
 const to=app.indexOf('\nasync function wipeCollection(',from);
 const src=app.slice(from,to);
 assert.ok(from>=0 && to>from);
 assert.equal((src.match(/await batch\.commit\(\)/g)||[]).length,1);
 assert.match(src,/batch\.set\(doc\(histCol\)/);
 assert.match(src,/occupationBatch\.set\(doc\(db,'highos','data','ocupacoes'/);
 assert.match(src,/batch\.set\(doc\(db,'highos','data','organizacoes'/);
 assert.doesNotMatch(src,/await addDoc\(histCol/);
 assert.match(src,/await occupationBatch\.commit\(\)/);
 assert.match(src,/occupationSynced=false/);
 assert.doesNotMatch(src,/await orgMoveBatch\.commit\(\)/);
});
test('Recolhimento confirma todos os documentos na mesma transação',()=>{
 const from=app.indexOf('recollectInFlight=true;');
 const to=app.indexOf('\nfunction snapshot(o)',from);
 const src=app.slice(from,to);
 assert.ok(from>=0 && to>from);
 assert.equal((src.match(/await recollectBatch\.commit\(\)/g)||[]).length,1);
 assert.match(src,/recollectBatch\.set\(doc\(histCol\)/);
 assert.match(src,/recollectBatch\.set\(doc\(db,'highos','data','faccoes'/);
 assert.match(src,/recollectBatch\.set\(evidenceRef/);
 assert.doesNotMatch(src,/await addDoc\(histCol/);
 assert.doesNotMatch(src,/await setDoc\(doc\(db,'highos','data','faccoes'/);
});
test('Firestore permite histórico de ocupação, mas não sua edição',()=>{
 const p=rules.indexOf('match /highos/data/ocupacoes/{docId}');
 const e=rules.indexOf('match /highos/data/solicitacoes/{docId}',p);
 const src=rules.slice(p,e);
 assert.ok(p>0&&e>p);
 assert.match(src,/allow create: if canEdit\('faccoes'\)/);
 assert.match(src,/createdBy/);
 assert.match(src,/allow update: if false/);
});
