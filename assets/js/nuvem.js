// HIGH OS — Firebase (login, perfil da staff, dados do sistema) e Google Sheets (só leitura).
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import {
  getFirestore, doc, getDoc, setDoc, addDoc, collection, getDocs, query, orderBy, limit, serverTimestamp, deleteDoc, writeBatch,
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { PLANILHAS, FAIXAS, CATALOGO_MN } from './dados.js';

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

/* Escopo SOMENTE LEITURA: o High OS não tem como alterar as planilhas. */
const ESCOPO = 'https://www.googleapis.com/auth/spreadsheets.readonly';
const provedor = new GoogleAuthProvider();
provedor.addScope(ESCOPO);
provedor.setCustomParameters({ prompt: 'select_account' });

const CHAVE_TOKEN = 'hos.sheets.token';
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
export const temAcessoPlanilhas = () => !!tokenValido();

/** Login com Google; já pede a leitura das planilhas no mesmo passo. */
export async function entrar() {
  const r = await signInWithPopup(auth, provedor);
  guardarToken(GoogleAuthProvider.credentialFromResult(r)?.accessToken);
  return r.user;
}
/** O acesso às planilhas vence em 1 hora: renova sem sair do sistema. */
export async function reconectarPlanilhas() {
  const r = await signInWithPopup(auth, provedor);
  guardarToken(GoogleAuthProvider.credentialFromResult(r)?.accessToken);
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

/* ---------------- Planilhas (Google Sheets API, só leitura) ---------------- */
export class SemAcessoPlanilha extends Error {}

async function lerFaixas(planilha, faixas) {
  const token = tokenValido();
  if (!token) throw new SemAcessoPlanilha('Acesso às planilhas expirou.');
  const qs = Object.values(faixas).map((f) => 'ranges=' + encodeURIComponent(f)).join('&');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${PLANILHAS[planilha].id}/values:batchGet?${qs}&valueRenderOption=FORMATTED_VALUE`;
  const r = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
  if (r.status === 401) { try { sessionStorage.removeItem(CHAVE_TOKEN); } catch { /* ok */ } throw new SemAcessoPlanilha('Acesso às planilhas expirou.'); }
  if (r.status === 403 || r.status === 404) throw new Error(`Sua conta Google não tem acesso à planilha "${PLANILHAS[planilha].nome}".`);
  if (!r.ok) throw new Error(`Falha ao ler a planilha "${PLANILHAS[planilha].nome}" (HTTP ${r.status}).`);
  const j = await r.json();
  const nomes = Object.keys(faixas);
  return Object.fromEntries((j.valueRanges || []).map((v, i) => [nomes[i], v.values || []]));
}

/** Lê as duas planilhas de uma vez. Guarda a última leitura para abrir rápido. */
export async function lerPlanilhas() {
  const [faccoes, mercado] = await Promise.all([lerFaixas('faccoes', FAIXAS.faccoes), lerMercadoNegro()]);
  const bruto = { faccoes, mercado, lidoEm: new Date().toISOString() };
  try { localStorage.setItem('hos.planilhas', JSON.stringify(bruto)); } catch { /* cheio ou bloqueado */ }
  return bruto;
}
/** Catálogo público do Mercado Negro (não precisa de login). */
export async function lerMercadoNegro() {
  try {
    const r = await fetch(CATALOGO_MN + '?v=' + Date.now(), { cache: 'no-store' });
    return r.ok ? await r.json() : (ultimaLeitura()?.mercado || null);
  } catch { return ultimaLeitura()?.mercado || null; }
}
export function ultimaLeitura() {
  try { return JSON.parse(localStorage.getItem('hos.planilhas') || 'null'); } catch { return null; }
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
