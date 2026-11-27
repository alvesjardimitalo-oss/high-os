// HIGH OS — Firebase (login, perfil da staff, base das facções, avisos, métricas) e Google Sheets (só importar/exportar, ADMIN).
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import {
  getFirestore, doc, getDoc, setDoc, addDoc, collection, getDocs, query, orderBy, limit, serverTimestamp, deleteDoc, writeBatch, onSnapshot,
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { PLANILHAS, FAIXAS, CATALOGO_MN } from './dados.js';
import { CHAVES_ABAS, daMatriz, planoExportacao, idNovo } from './base.js';

const app = initializeApp({
  apiKey: 'AIzaSyBKtl3rCA9Id1RDMwGch-yi4hxAs83DraU',
  authDomain: 'high-os.firebaseapp.com',
  projectId: 'high-os',
  storageBucket: 'high-os.firebasestorage.app',
  messagingSenderId: '471862600170',
  appId: '1:471862600170:web:ff55af6f7e808ff393d293',
});
export const auth = getAuth(app);
export const db = getFirestore(app);

/* Login só com Google (sem planilha). A planilha só é usada pelo ADMIN, na importação e no
   "Enviar para a planilha": aí o Google pede a permissão de edição na hora (tokenPlanilhas). */
const provedor = new GoogleAuthProvider();
provedor.setCustomParameters({ prompt: 'select_account' });
const provedorPlanilhas = new GoogleAuthProvider();
provedorPlanilhas.addScope('https://www.googleapis.com/auth/spreadsheets');

const CHAVE_TOKEN = 'hos.sheets.token.v3';
function guardarToken(token) {
  if (!token) return;
  try { sessionStorage.setItem(CHAVE_TOKEN, JSON.stringify({ token, exp: Date.now() + 55 * 60 * 1000 })); } catch { /* sem armazenamento */ }
}
function tokenValido() {
  try {
    const t = JSON.parse(sessionStorage.getItem(CHAVE_TOKEN) || 'null');
    return t && t.exp > Date.now() ? t.token : '';
  } catch { return ''; }
}
/** Token da planilha: usa o guardado (vale ~1 h) ou abre o Google para liberar. Chamar a partir de um clique. */
async function tokenPlanilhas() {
  const t = tokenValido();
  if (t) return t;
  provedorPlanilhas.setCustomParameters({ login_hint: auth.currentUser?.email || '' });
  const r = await signInWithPopup(auth, provedorPlanilhas);
  const novo = GoogleAuthProvider.credentialFromResult(r)?.accessToken;
  if (!novo) throw new Error('O Google não liberou o acesso à planilha.');
  guardarToken(novo);
  return novo;
}

export async function entrar() {
  const r = await signInWithPopup(auth, provedor);
  return r.user;
}
export async function sair() {
  try { sessionStorage.removeItem(CHAVE_TOKEN); } catch { /* ok */ }
  await signOut(auth);
}
export const aoMudarLogin = (cb) => onAuthStateChanged(auth, cb);

/* ---------------- Perfil da staff (users/{email}) ----------------
   Papéis: ADMIN (tudo + configurações), CONSULTA e RH_* (só ver), demais (staff: ver,
   enviar avisos e editar o planejador). O cadastro de usuários é o mesmo de antes. */
export async function perfil(email) {
  const e = String(email || '').toLowerCase();
  const s = (await getDoc(doc(db, 'users', e)).catch(() => null)) || null;
  const d = s?.exists() ? s.data() : null;
  if (!d || d.active === false) return null;
  const papel = String(d.role || 'CONSULTA').toUpperCase();
  return {
    email: e, nome: d.name || d.nome || e.split('@')[0], papel,
    admin: papel === 'ADMIN',
    staff: papel === 'ADMIN' || !(papel === 'CONSULTA' || papel.startsWith('RH_')),
  };
}
export async function listarUsuarios() {
  const s = await getDocs(collection(db, 'users'));
  return s.docs.map((d) => ({ email: d.id, ...d.data() })).sort((a, b) => a.email.localeCompare(b.email));
}
export const salvarUsuario = (email, dados) => setDoc(doc(db, 'users', String(email).toLowerCase()), dados, { merge: true });
export const excluirUsuario = (email) => deleteDoc(doc(db, 'users', String(email).toLowerCase()));

/* ---------------- Base das facções (Firebase) ----------------
   hos/planilha                → { cabecalhos, importadoEm, importadoPor, exportadoEm, exportadoPor }
   hos/planilha/{aba}/{linha}  → { ordem, valores: { coluna: texto } }
   hos/dados/alteracoes/{id}   → log de cada alteração (antes/depois, quem, quando) */
const refMeta = () => doc(db, 'hos', 'planilha');
const colAba = (aba) => collection(db, 'hos', 'planilha', aba);
const eu = () => (auth.currentUser?.email || '').toLowerCase();

/**
 * Escuta a base em tempo real. cb({ meta, abas: { cadastro: { cabecalho, linhas }, ... } })
 * é chamado na primeira leitura e a cada alteração de qualquer pessoa. Devolve a função que para.
 */
export function ouvirBase(cb, aoErro = () => {}) {
  let meta = null; const linhas = {}; const prontos = new Set();
  const emitir = () => {
    if (!meta && prontos.size < CHAVES_ABAS.length + 1) return;
    if (prontos.size < CHAVES_ABAS.length + 1) return;
    const abas = Object.fromEntries(CHAVES_ABAS.map((k) => [k, { cabecalho: meta?.cabecalhos?.[k] || [], linhas: linhas[k] || [] }]));
    cb({ meta, abas });
  };
  const paradas = [
    onSnapshot(refMeta(), (s) => { meta = s.exists() ? s.data() : null; prontos.add('meta'); emitir(); }, aoErro),
    ...CHAVES_ABAS.map((k) => onSnapshot(colAba(k), (s) => {
      linhas[k] = s.docs.map((d) => ({ id: d.id, ordem: Number(d.data().ordem) || 0, valores: d.data().valores || {} }));
      prontos.add(k); emitir();
    }, aoErro)),
  ];
  return () => paradas.forEach((p) => p());
}

/** Grava alterações numa linha (só as colunas informadas) e deixa o log. */
export async function salvarLinha(aba, id, valores, { antes = {}, acao = 'edição', motivo = '' } = {}) {
  const lote = writeBatch(db);
  lote.set(doc(colAba(aba), id), { valores, atualizadoEm: serverTimestamp(), atualizadoPor: eu() }, { merge: true });
  lote.set(doc(collection(db, 'hos', 'dados', 'alteracoes')), { aba, linha: id, acao, motivo, antes, depois: valores, por: eu(), em: serverTimestamp() });
  await lote.commit();
}
/** Linha nova no fim da aba. */
export async function novaLinha(aba, valores, ordem, { motivo = '' } = {}) {
  const id = idNovo();
  const lote = writeBatch(db);
  lote.set(doc(colAba(aba), id), { ordem, valores, atualizadoEm: serverTimestamp(), atualizadoPor: eu() });
  lote.set(doc(collection(db, 'hos', 'dados', 'alteracoes')), { aba, linha: id, acao: 'nova linha', motivo, antes: {}, depois: valores, por: eu(), em: serverTimestamp() });
  await lote.commit();
  return id;
}
export async function excluirLinha(aba, id, antes = {}) {
  const lote = writeBatch(db);
  lote.delete(doc(colAba(aba), id));
  lote.set(doc(collection(db, 'hos', 'dados', 'alteracoes')), { aba, linha: id, acao: 'exclusão', antes, depois: {}, por: eu(), em: serverTimestamp() });
  await lote.commit();
}
export async function ultimasAlteracoes(n = 40) {
  const s = await getDocs(query(collection(db, 'hos', 'dados', 'alteracoes'), orderBy('em', 'desc'), limit(n)));
  return s.docs.map((d) => ({ id: d.id, ...d.data(), em: d.data().em?.toDate?.() || null }));
}

/* ---------------- Planilha (Google Sheets) — só ADMIN ---------------- */
const API = 'https://sheets.googleapis.com/v4/spreadsheets/';
async function chamarPlanilha(caminho, opcoes = {}) {
  const token = await tokenPlanilhas();
  const r = await fetch(API + PLANILHAS.faccoes.id + caminho, { ...opcoes, headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', ...(opcoes.headers || {}) } });
  if (r.status === 401) { try { sessionStorage.removeItem(CHAVE_TOKEN); } catch { /* ok */ } throw new Error('O acesso à planilha venceu. Clique de novo para liberar.'); }
  if (r.status === 403) throw new Error(`Sua conta Google não tem permissão de edição na planilha "${PLANILHAS.faccoes.nome}".`);
  if (!r.ok) throw new Error(`A planilha respondeu com erro (HTTP ${r.status}).`);
  return r.json();
}

/** Migração: lê todas as abas da planilha e SUBSTITUI a base do Firebase por elas. */
export async function importarDaPlanilha() {
  const faixas = FAIXAS.faccoes;
  const qs = CHAVES_ABAS.map((k) => 'ranges=' + encodeURIComponent(faixas[k])).join('&');
  const j = await chamarPlanilha(`/values:batchGet?${qs}&valueRenderOption=FORMATTED_VALUE`);
  const abas = Object.fromEntries(CHAVES_ABAS.map((k, i) => [k, daMatriz(j.valueRanges?.[i]?.values || [], k)]));
  if (!abas.cadastro.linhas.length) throw new Error('A aba Cadastro de Facções veio vazia. Nada foi alterado.');
  const ops = [];
  for (const k of CHAVES_ABAS) {
    const novos = new Set(abas[k].linhas.map((l) => l.id));
    const atuais = await getDocs(colAba(k));
    atuais.docs.filter((d) => !novos.has(d.id)).forEach((d) => ops.push((b) => b.delete(d.ref)));
    abas[k].linhas.forEach((l) => ops.push((b) => b.set(doc(colAba(k), l.id), { ordem: l.ordem, valores: l.valores, atualizadoEm: serverTimestamp(), atualizadoPor: eu() })));
  }
  for (let i = 0; i < ops.length; i += 400) { const b = writeBatch(db); ops.slice(i, i + 400).forEach((f) => f(b)); await b.commit(); }
  await setDoc(refMeta(), { cabecalhos: Object.fromEntries(CHAVES_ABAS.map((k) => [k, abas[k].cabecalho])), importadoEm: serverTimestamp(), importadoPor: eu() }, { merge: true });
  await addDoc(collection(db, 'hos', 'dados', 'alteracoes'), { aba: '*', linha: '*', acao: 'importação da planilha', antes: {}, depois: Object.fromEntries(CHAVES_ABAS.map((k) => [k, abas[k].linhas.length])), por: eu(), em: serverTimestamp() });
  return Object.fromEntries(CHAVES_ABAS.map((k) => [k, abas[k].linhas.length]));
}

/** O que a planilha tem hoje (cabeçalho e, por célula, se é fórmula ou tem valor). */
async function gradeDaPlanilha() {
  const faixas = FAIXAS.faccoes;
  const qs = CHAVES_ABAS.map((k) => 'ranges=' + encodeURIComponent(faixas[k])).join('&');
  const j = await chamarPlanilha(`?${qs}&includeGridData=true&fields=${encodeURIComponent('sheets(properties(title),data(rowData(values(userEnteredValue,formattedValue))))')}`);
  const porTitulo = new Map((j.sheets || []).map((s) => [s.properties.title, s]));
  return Object.fromEntries(CHAVES_ABAS.map((k) => {
    const titulo = faixas[k].slice(1, faixas[k].lastIndexOf("'!")).replace(/''/g, "'");
    const linhas = porTitulo.get(titulo)?.data?.[0]?.rowData || [];
    const [cab = {}, ...resto] = linhas;
    return [k, {
      cabecalho: (cab.values || []).map((c) => String(c.formattedValue ?? c.userEnteredValue?.stringValue ?? '').trim()),
      linhas: resto.map((r) => (r.values || []).map((c) => {
        const u = c.userEnteredValue || {};
        return { formula: u.formulaValue || '', cheio: Object.keys(u).length > 0 };
      })),
    }];
  }));
}

/** Manda a base do sistema para a planilha. Fórmulas da planilha são mantidas (e refeitas onde sumiram). */
export async function exportarParaPlanilha(abas) {
  const grade = await gradeDaPlanilha();
  const planos = Object.fromEntries(CHAVES_ABAS.map((k) => [k, planoExportacao(k, abas[k], grade[k])]));
  const data = CHAVES_ABAS.flatMap((k) => planos[k].dados);
  for (let i = 0; i < data.length; i += 60) {
    await chamarPlanilha('/values:batchUpdate', { method: 'POST', body: JSON.stringify({ valueInputOption: 'USER_ENTERED', data: data.slice(i, i + 60) }) });
  }
  await setDoc(refMeta(), { exportadoEm: serverTimestamp(), exportadoPor: eu() }, { merge: true });
  await addDoc(collection(db, 'hos', 'dados', 'alteracoes'), { aba: '*', linha: '*', acao: 'envio para a planilha', antes: {}, depois: Object.fromEntries(CHAVES_ABAS.map((k) => [k, planos[k].linhas])), por: eu(), em: serverTimestamp() });
  return planos;
}

/** Catálogo público do Mercado Negro (não precisa de login). */
const CHAVE_MN = 'hos.mercado';
export async function lerMercadoNegro() {
  const guardado = () => { try { return JSON.parse(localStorage.getItem(CHAVE_MN) || 'null'); } catch { return null; } };
  try {
    const r = await fetch(CATALOGO_MN + '?v=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) return guardado();
    const j = await r.json();
    try { localStorage.setItem(CHAVE_MN, JSON.stringify(j)); } catch { /* ok */ }
    return j;
  } catch { return guardado(); }
}

/* ---------------- Webhooks e avisos ---------------- */
const refWebhooks = () => doc(db, 'hos', 'config', 'privado', 'webhooks');
export async function lerWebhooks() {
  const s = await getDoc(refWebhooks());
  return s.exists() ? s.data() : {};
}
export const salvarWebhooks = (dados) => setDoc(refWebhooks(), { ...dados, atualizadoEm: serverTimestamp(), atualizadoPor: auth.currentUser?.email || '' }, { merge: true });

export async function registrarAviso(aviso) {
  return addDoc(collection(db, 'hos', 'dados', 'avisos'), { ...aviso, por: (auth.currentUser?.email || '').toLowerCase(), em: serverTimestamp() });
}
export async function ultimosAvisos(n = 30) {
  const s = await getDocs(query(collection(db, 'hos', 'dados', 'avisos'), orderBy('em', 'desc'), limit(n)));
  return s.docs.map((d) => ({ id: d.id, ...d.data(), em: d.data().em?.toDate?.() || null }));
}

/* ---------------- Métricas (gravadas pelo coletor em coletor/) ---------------- */
export async function lerMetricas() {
  const s = await getDoc(doc(db, 'hos', 'metricas'));
  return s.exists() ? s.data() : null;
}
/** Últimos dias do histórico, do mais novo para o mais antigo. */
export async function diasMetricas(n = 45) {
  const s = await getDocs(query(collection(db, 'hos', 'metricas', 'dias'), orderBy('dia', 'desc'), limit(n)));
  return s.docs.map((d) => d.data());
}

/** Fichas semanais (segunda a domingo), da mais antiga para a mais nova. */
export async function semanasMetricas() {
  const s = await getDocs(collection(db, 'hos', 'metricas', 'semanas'));
  return s.docs.map((d) => d.data()).sort((a, b) => a.de.localeCompare(b.de));
}

/** Perímetros das facções (hos/qgs), gravados pelo coletor. */
export async function lerQgs() {
  const s = await getDoc(doc(db, 'hos', 'qgs'));
  return s.exists() ? s.data() : null;
}

/* ---------------- Memória de CDS (alturas reais para o TP de validação) ---------------- */
const colMemoriaCds = () => collection(db, 'highos', 'data', 'cds_memoria');
export async function lerMemoriaCds() {
  const s = await getDocs(colMemoriaCds());
  return s.docs.map((d) => ({ id: d.id, ...d.data() }));
}
/** itens: [{ id, x, y, z, origem }] — grava em lotes de até 400. */
export async function gravarMemoriaCds(itens) {
  const por = (auth.currentUser?.email || '').toLowerCase();
  for (let i = 0; i < itens.length; i += 400) {
    const lote = writeBatch(db);
    itens.slice(i, i + 400).forEach((it) => lote.set(doc(colMemoriaCds(), it.id), { x: it.x, y: it.y, z: it.z, origem: String(it.origem || 'cds').slice(0, 40), por, em: serverTimestamp() }));
    await lote.commit();
  }
}

/* ---------------- Planejador de missões (uma zona por documento) ----------------
   Mesmo formato que o planejador já usa: highos/data/missoes_zonas/{id},
   com "rev" subindo de 1 em 1 para ninguém sobrescrever o trabalho de outro. */
// O documento usa o próprio id da zona (formato do sistema anterior: "facxfac-norte",
// "m_1789…"). Só ids com caracteres que o Firestore não aceita viram hash. Antes, todo id
// virava hash e salvar uma zona antiga criava uma CÓPIA em vez de atualizar a original.
const idDocZona = (id) => { const s = String(id || ''); return /^[A-Za-z0-9_.-]{1,150}$/.test(s) && s !== '.' && s !== '..' ? s : idZona(s); };
const refZona = (id) => doc(db, 'highos', 'data', 'missoes_zonas', idDocZona(id));
function idZona(id) {
  const s = String(id || '');
  let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return 'z_' + h.toString(36) + '_' + s.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 60);
}
export async function zonasDoPlanejador() {
  const s = await getDocs(collection(db, 'highos', 'data', 'missoes_zonas'));
  return s.docs.map((d) => {
    const x = d.data() || {}; let zona = null;
    if (!x.deleted) { try { zona = JSON.parse(x.json || 'null'); } catch { zona = null; } }
    return { id: String(x.zonaId || d.id), rev: Number(x.rev) || 0, deleted: !!x.deleted, zona, updatedAtText: x.updatedAtText || '', updatedBy: x.updatedBy || '', deletedAtText: x.deletedAtText || '', deletedBy: x.deletedBy || '' };
  });
}
export async function gravarZona(zona, baseRev, excluir) {
  const id = String(zona?.id || '');
  if (!id) return { ok: false, id, reason: 'sem-id' };
  const atual = await getDoc(refZona(id)).then((s) => (s.exists() ? s.data() : null)).catch(() => null);
  const remoto = atual ? Number(atual.rev) || 0 : 0;
  if (baseRev !== null && baseRev !== undefined && remoto !== (Number(baseRev) || 0)) return { ok: false, id, conflict: true, remoteRev: remoto, remote: atual };
  const limpa = JSON.parse(JSON.stringify(zona)); delete limpa._rev; delete limpa._syncConflict;
  const email = auth.currentUser?.email?.toLowerCase() || '', agora = new Date().toISOString();
  const json = excluir && atual?.json ? atual.json : JSON.stringify(limpa);
  await setDoc(refZona(id), {
    zonaId: id, rev: remoto + 1, json, nome: String(limpa.name || atual?.nome || ''), eventId: String(limpa.eventId || atual?.eventId || ''),
    evento: String(limpa.event || atual?.evento || ''), categoria: String(limpa.category || atual?.categoria || ''),
    updatedAtText: agora, updatedBy: email, deleted: !!excluir, deletedAtText: excluir ? agora : '', deletedBy: excluir ? email : '',
  });
  return { ok: true, id, rev: remoto + 1, deleted: !!excluir, updatedAtText: agora, updatedBy: email };
}
