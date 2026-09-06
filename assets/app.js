import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyBKtl3rCA9Id1RDMwGch-yi4hxAs83DraU',
  authDomain: 'high-os.firebaseapp.com',
  projectId: 'high-os',
  storageBucket: 'high-os.firebasestorage.app',
  messagingSenderId: '471862600170',
  appId: '1:471862600170:web:ff55af6f7e808ff393d293'
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

const $ = s => document.querySelector(s);
const loginView=$('#loginView'), deniedView=$('#deniedView'), appView=$('#appView'), sessionArea=$('#sessionArea');
function show(el){[loginView,deniedView,appView].forEach(x=>x.classList.add('hidden'));el.classList.remove('hidden')}
async function login(){try{await signInWithPopup(auth,provider)}catch(e){alert('Não foi possível entrar com Google: '+e.message)}}
async function logout(){await signOut(auth)}
$('#loginBtn').onclick=login; $('#loginBtnCard').onclick=login; $('#logoutBtn').onclick=logout; $('#logoutDenied').onclick=logout;

onAuthStateChanged(auth, async user => {
  if(!user){show(loginView);sessionArea.innerHTML='<button class="btn-google" id="loginTop">G&nbsp; Entrar com Google</button>';$('#loginTop').onclick=login;return}
  const email=(user.email||'').toLowerCase();
  try{
    const snap=await getDoc(doc(db,'users',email));
    if(!snap.exists() || snap.data().active !== true){
      show(deniedView); $('#deniedText').textContent=`${email} foi autenticado, mas não possui cadastro ativo no High OS.`;
      sessionArea.innerHTML=`<span class="top-email">${email}</span><button class="mini-btn" id="logoutTop">Sair</button>`;$('#logoutTop').onclick=logout; return;
    }
    const profile=snap.data(); const role=String(profile.role||'CONSULTA').toUpperCase();
    show(appView);
    $('#userName').textContent=profile.name||user.displayName||email;
    $('#userRole').textContent=role; $('#dashEmail').textContent=email; $('#dashRole').textContent=role;
    const photo=$('#userPhoto'); if(user.photoURL){photo.src=user.photoURL}else{photo.style.display='none'}
    document.querySelectorAll('.admin-only').forEach(el=>el.style.display=role==='ADMIN'?'flex':'none');
    sessionArea.innerHTML=`<span class="access-pill">● ${role}</span><span class="top-email">${email}</span>`;
  }catch(e){show(deniedView);$('#deniedText').textContent='Falha ao validar seu cadastro no Firestore: '+e.message;}
});

document.querySelectorAll('.nav-item').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));btn.classList.add('active');
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));$('#page-'+btn.dataset.page).classList.add('active');
}));
