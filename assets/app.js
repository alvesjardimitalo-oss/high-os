import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { getFirestore, doc, getDoc, collection, getDocs, setDoc, addDoc, serverTimestamp, writeBatch } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

const firebaseConfig={apiKey:'AIzaSyBKtl3rCA9Id1RDMwGch-yi4hxAs83DraU',authDomain:'high-os.firebaseapp.com',projectId:'high-os',storageBucket:'high-os.firebasestorage.app',messagingSenderId:'471862600170',appId:'1:471862600170:web:ff55af6f7e808ff393d293'};
const app=initializeApp(firebaseConfig), auth=getAuth(app), db=getFirestore(app), provider=new GoogleAuthProvider();
provider.setCustomParameters({prompt:'select_account'});
const sheetsProvider=new GoogleAuthProvider();
sheetsProvider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
const $=s=>document.querySelector(s), loginView=$('#loginView'),deniedView=$('#deniedView'),appView=$('#appView'),sessionArea=$('#sessionArea');
let currentUser=null,currentProfile=null,faccoes=[],solicitacoes=[],usuarios=[],organizacoes=[];
const facCol=collection(db,'highos','data','faccoes'), histCol=collection(db,'highos','data','historico'), reqCol=collection(db,'highos','data','solicitacoes'), deliveryCol=collection(db,'highos','data','entregas'), orgCol=collection(db,'highos','data','organizacoes'), usersCol=collection(db,'users');
const SEED=[{"numero": 1, "cds": "{1286.34,-266.43,99.7,303.31}", "anuncio": "", "qg": "Favela da Barragem", "group": "Armas01", "groupOriginal": "Armas01", "segmento": "ARMAS", "produto": "Pistola, Sub Metralhadora e Rifle", "faccao": "Imperial", "status": "ATIVA", "lider": "109 —Brunin Allef", "staff": "Ítalo Leonardo", "dataEntrega": "17/07/2026", "observacoes": ""}, {"numero": 2, "cds": "{2696.23,3400.29,58.82,90.71}", "anuncio": "", "qg": "Favela do MegaMall", "group": "Armas02", "groupOriginal": "Armas02", "segmento": "ARMAS", "produto": "Pistola, Sub Metralhadora e Rifle", "faccao": "Talibã", "status": "ATIVA", "lider": "4792—Grazzi Sette", "staff": "Italo Leonardo", "dataEntrega": "", "observacoes": ""}, {"numero": 3, "cds": "2355.39,-605.06,96.58,257.96", "anuncio": "NULO", "qg": "SEM LOCAL", "group": "Armas03", "groupOriginal": "Armas03", "segmento": "ARMAS", "produto": "Pistola, Sub Metralhadora e Rifle", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 4, "cds": "{-2390.91,-198.43,39.65,269.3}", "anuncio": "", "qg": "Favela da Praia 1", "group": "Armas04", "groupOriginal": "Armas04", "segmento": "ARMAS", "produto": "Pistola, Sub Metralhadora e Rifle", "faccao": "Peitanove", "status": "ATIVA", "lider": "2199—Boaventura P", "staff": "Ralf", "dataEntrega": "20/07/2026", "observacoes": ""}, {"numero": 5, "cds": "{2561.79,2437.52,55.47,110.56}", "anuncio": "SIM", "qg": "Favela do Dino", "group": "Armas05", "groupOriginal": "Armas05", "segmento": "ARMAS", "produto": "Pistola, Sub Metralhadora e Rifle", "faccao": "", "status": "INATIVA", "lider": "—", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 6, "cds": "{-2120.96,2482.66,10.03,133.23}", "anuncio": "", "qg": "Favela do Zancudo", "group": "Armas06", "groupOriginal": "Armas06", "segmento": "ARMAS", "produto": "Pistola, Sub Metralhadora e Rifle", "faccao": "Medellin", "status": "ATIVA", "lider": "7142—Alix Fainelli", "staff": "Italo Leonardo", "dataEntrega": "", "observacoes": ""}, {"numero": 7, "cds": "-113.73,-12.34,70.52,133.23", "anuncio": "", "qg": "Favela do Campinho", "group": "Armas07", "groupOriginal": "Armas07", "segmento": "ARMAS", "produto": "Pistola, Sub Metralhadora e Rifle", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": "", "semCraft": true}, {"numero": 8, "cds": "60.64,2602.08,87.1,303.31", "anuncio": "SIM", "qg": "Distrito 14 (apto norte)", "group": "Armas08", "groupOriginal": "Armas08", "segmento": "ARMAS", "produto": "Pistola, Sub Metralhadora e Rifle", "faccao": "", "status": "INATIVA", "lider": "—", "staff": "", "dataEntrega": "", "observacoes": "", "removido": true}, {"numero": 9, "cds": "2640.33,1789.71,33.62,102.05", "anuncio": "", "qg": "Favela da Indústria, Sul", "group": "Armas09", "groupOriginal": "Armas09", "segmento": "ARMAS", "produto": "Pistola, Sub Metralhadora e Rifle", "faccao": "Safadoes", "status": "ATIVA", "lider": "3182 / JUNIM SAFADO", "staff": "RALF PENA", "dataEntrega": "16/08/26", "observacoes": ""}, {"numero": 10, "cds": "-1431.37,2306.54,30.82,187.09", "anuncio": "SIM", "qg": "Favela da Cachoeira", "group": "Armas10", "groupOriginal": "Armas10", "segmento": "ARMAS", "produto": "Pistola, Sub Metralhadora e Rifle", "faccao": "Lotus", "status": "ATIVA", "lider": "12510 — Ray Hollow", "staff": "Italo Alves", "dataEntrega": "04/09/26", "observacoes": ""}, {"numero": 11, "cds": "{-480.22,1613.99,369.58,0.0}", "anuncio": "NAO", "qg": "FAVELA DO OBS 2", "group": "Armas11", "groupOriginal": "Armas 11", "segmento": "ARMAS", "produto": "Pistola, Sub Metralhadora e Rifle", "faccao": "Playboy", "status": "ATIVA", "lider": "12182 - Igor Mecktref", "staff": "Ralf Pena", "dataEntrega": "26/08/26", "observacoes": ""}, {"numero": 12, "cds": "1550.5,-728.82,111.51,204.1", "anuncio": "", "qg": "Clube de Festas, Açougue", "group": "Municao01", "groupOriginal": "Municao01", "segmento": "MUNIÇÃO", "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++", "faccao": "Golden Lotus", "status": "ATIVA", "lider": "9528—Maddy A Jhuns", "staff": "Jonh", "dataEntrega": "09/07/26", "observacoes": ""}, {"numero": 13, "cds": "{-779.26,985.57,249.23,195.6}", "anuncio": "NAO", "qg": "Favela do OBS 2", "group": "Municao02", "groupOriginal": "Municao02", "segmento": "MUNIÇÃO", "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 14, "cds": "-130.69,3220.77,73.72,255.12", "anuncio": "SIM", "qg": "Favela de Sandy Shores, Baixo", "group": "Municao03", "groupOriginal": "Municao03", "segmento": "MUNIÇÃO", "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++", "faccao": "Hidra", "status": "ATIVA", "lider": "12114- Jaque Miller", "staff": "Ralf Pena", "dataEntrega": "25/08/26", "observacoes": ""}, {"numero": 15, "cds": "1367.56,-2433.89,62.18,337.33", "anuncio": "", "qg": "Favela do Petróleo, Sul", "group": "Municao04", "groupOriginal": "Municao04", "segmento": "MUNIÇÃO", "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 16, "cds": "2047.86,5095.36,58.32,2.84", "anuncio": "", "qg": "QG da Plantação", "group": "Municao05", "groupOriginal": "Municao05", "segmento": "MUNIÇÃO", "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 17, "cds": "2473.01,4959.72,44.89,51.03", "anuncio": "NAO", "qg": "Mansao da Fazenda Queimada", "group": "Municao06", "groupOriginal": "Municao06", "segmento": "MUNIÇÃO", "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++", "faccao": "", "status": "INATIVA", "lider": "—", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 18, "cds": "-1896.6,2015.73,171.3,351.5", "anuncio": "", "qg": "Vinhedo", "group": "Municao07", "groupOriginal": "Municao07", "segmento": "MUNIÇÃO", "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++", "faccao": "Real Midia", "status": "ATIVA", "lider": "2323—Henrique Lewis", "staff": "Italo Leonardo", "dataEntrega": "", "observacoes": ""}, {"numero": 19, "cds": "-1771.7,-117.8,95.4", "anuncio": "", "qg": "Favela do Cemitério, Sul", "group": "Municao08", "groupOriginal": "Municao08", "segmento": "MUNIÇÃO", "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 20, "cds": "320.79,-2058.35,24.03,323.15", "anuncio": "NAO", "qg": "QG dos Vagos", "group": "Municao09", "groupOriginal": "Municao09", "segmento": "MUNIÇÃO", "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++", "faccao": "", "status": "INATIVA", "lider": "-", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 21, "cds": "-3694.8,3790.2,5.1", "anuncio": "", "qg": "Ilha Particular", "group": "Municao10", "groupOriginal": "Municao10", "segmento": "MUNIÇÃO", "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++", "faccao": "Black Angels", "status": "ATIVA", "lider": "4510—Gordao", "staff": "Ralf Pena", "dataEntrega": "11/06/26", "observacoes": ""}, {"numero": 22, "cds": "241.5,-3144.2,3.3", "anuncio": "SIM", "qg": "Club 77", "group": "Lavagem01", "groupOriginal": "Lavagem01", "segmento": "LAVAGEM", "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora", "faccao": "", "status": "INATIVA", "lider": "—", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 23, "cds": "1466.47,1119.43,119.13,0.0", "anuncio": "", "qg": "FAZENDA, SUL", "group": "Lavagem02", "groupOriginal": "Lavagem02", "segmento": "LAVAGEM", "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora", "faccao": "Yakuza", "status": "ATIVA", "lider": "101—Mel Conha", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 24, "cds": "768.49,441.9,149.73,215.44", "anuncio": "", "qg": "Bahamas", "group": "Lavagem03", "groupOriginal": "Lavagem03", "segmento": "LAVAGEM", "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora", "faccao": "Renegados", "status": "ATIVA", "lider": "51—Ana Konda", "staff": "Italo Leonardo", "dataEntrega": "", "observacoes": ""}, {"numero": 25, "cds": "-482.6,1606.5,369.6", "anuncio": "NULO", "qg": "SEM LOCAL", "group": "Lavagem04", "groupOriginal": "Lavagem04", "segmento": "LAVAGEM", "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 26, "cds": "{-1540.36,81.20,56.58}", "anuncio": "", "qg": "Mansão da Playboy", "group": "Lavagem05", "groupOriginal": "Lavagem05", "segmento": "LAVAGEM", "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora", "faccao": "ICE", "status": "ATIVA", "lider": "899—Mani Khalifa", "staff": "Italo Leonardo", "dataEntrega": "", "observacoes": ""}, {"numero": 27, "cds": "", "anuncio": "SIM", "qg": "Boate Arcade", "group": "Lavagem06", "groupOriginal": "Lavagem06", "segmento": "LAVAGEM", "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 28, "cds": "1876.33,1511.54,112.98,357.17", "anuncio": "NULO", "qg": "SEM LOCAL", "group": "Lavagem07", "groupOriginal": "Lavagem07", "segmento": "LAVAGEM", "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 29, "cds": "SEM QG", "anuncio": "NULO", "qg": "SEM LOCAL", "group": "Lavagem08", "groupOriginal": "Lavagem08", "segmento": "LAVAGEM", "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": "", "removido": true}, {"numero": 30, "cds": "342.68,293.21,118.13,354.34", "anuncio": "NAO", "qg": "Galaxy", "group": "Lavagem09", "groupOriginal": "Lavagem09", "segmento": "LAVAGEM", "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora", "faccao": "", "status": "INATIVA", "lider": "—", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 31, "cds": "1876.33,1511.54,112.98,357.17", "anuncio": "NAO", "qg": "Favela do Sapao", "group": "Estelionatarios01", "groupOriginal": "Estelionatarios01", "segmento": "ESTELIONATÁRIOS", "produto": "Cartão Nuhigh Prata e Ouro e Dinheiro Falso", "faccao": "", "status": "INATIVA", "lider": "—", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 32, "cds": "-1376.69,-621.82,35.89,31.19", "anuncio": "NAO", "qg": "Favela da Boa Vista", "group": "Estelionatarios02", "groupOriginal": "Estelionatarios02", "segmento": "ESTELIONATÁRIOS", "produto": "Cartão Nuhigh Prata e Ouro e Dinheiro Falso", "faccao": "", "status": "INATIVA", "lider": "—", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 33, "cds": "657.75,-174.98,69.86,59.53", "anuncio": "NULO", "qg": "SEM LOCAL", "group": "Drogas01", "groupOriginal": "Drogas01", "segmento": "DROGAS", "produto": "Metadona, Capuz e Placa Balistica", "faccao": "", "status": "INATIVA", "lider": "—", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 34, "cds": "-1682.63,931.86,180.38,334.49", "anuncio": "NULO", "qg": "SEM LOCAL", "group": "Drogas02", "groupOriginal": "Drogas02", "segmento": "DROGAS", "produto": "Metadona, Capuz e Placa Balistica", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 35, "cds": "1367.25,-1381.16,108.73,257.96", "anuncio": "SIM", "qg": "Favela morro dos Macacos", "group": "Drogas03", "groupOriginal": "Drogas03", "segmento": "DROGAS", "produto": "Heroina, Capuz e Placa Balistica", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 36, "cds": "SEM QG", "anuncio": "NULO", "qg": "SEM LOCAL", "group": "Drogas04", "groupOriginal": "Drogas04", "segmento": "DROGAS", "produto": "Heroina, Capuz e Placa Balistica", "faccao": "", "status": "INATIVA", "lider": "—", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 37, "cds": "SEM QG", "anuncio": "NULO", "qg": "SEM LOCAL", "group": "Drogas05", "groupOriginal": "Drogas05", "segmento": "DROGAS", "produto": "Heroina, Capuz e Placa Balistica", "faccao": "", "status": "INATIVA", "lider": "—", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 38, "cds": "1550.5,-728.82,111.51,204.1", "anuncio": "NAO", "qg": "Favela do Helipa", "group": "Drogas06", "groupOriginal": "Drogas06", "segmento": "DROGAS", "produto": "Metadona, Capuz e Placa Balistica", "faccao": "Helipa", "status": "ATIVA", "lider": "12380 - Megan Fox", "staff": "Italo Alves", "dataEntrega": "01/09/2026", "observacoes": ""}, {"numero": 39, "cds": "-9.29,-1441.26,31.1,215.44", "anuncio": "SIM", "qg": "Residência Clinton", "group": "Drogas07", "groupOriginal": "Drogas07", "segmento": "DROGAS", "produto": "Anfetamina, Capuz e Placa Balistica", "faccao": "", "status": "INATIVA", "lider": "—", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 40, "cds": "{-2902.94,1485.7,71.12,153.08}", "anuncio": "SIM", "qg": "Favela da Praia 3", "group": "Drogas08", "groupOriginal": "Drogas08", "segmento": "DROGAS", "produto": "Crack, Capuz e Placa Balistica", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 41, "cds": "{-1682.63,931.86,180.38,334.49}", "anuncio": "NAO", "qg": "Favela do Asilo", "group": "Drogas09", "groupOriginal": "Drogas09", "segmento": "DROGAS", "produto": "Anfetamina, Capuz e Placa Balistica", "faccao": "Black Eagles", "status": "ATIVA", "lider": "1149—Sergio Medina", "staff": "Italo Leonardo", "dataEntrega": "", "observacoes": ""}, {"numero": 42, "cds": "{1772.1,6474.44,60.04,240.95}", "anuncio": "NAO", "qg": "Favela de Paleto, Norte", "group": "Drogas10", "groupOriginal": "Drogas10", "segmento": "DROGAS", "produto": "Heroina, Capuz e Placa Balistica", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 43, "cds": "{-59.76,-2517.63,7.30}", "anuncio": "SIM", "qg": "Posto, Porto", "group": "Drogas11", "groupOriginal": "Drogas11", "segmento": "DROGAS", "produto": "Crack, Capuz e Placa Balistica", "faccao": "", "status": "INATIVA", "lider": "—", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 44, "cds": "{-1332.84,-1238.37,1.4,317.49}", "anuncio": "SIM", "qg": "QG Gang 1", "group": "Desmanche01", "groupOriginal": "Desmanche01", "segmento": "DESMANCHE", "produto": "Cartão Ilegivel, Cartao Ilegivel ++, Gazua, Gazua++, Desmanche", "faccao": "Desmanche01", "status": "ATIVA", "lider": "12359 — Gtres Bittencourt", "staff": "Italo Leonardo", "dataEntrega": "", "observacoes": ""}, {"numero": 45, "cds": "-572.99,286.48,79.18,184.26", "anuncio": "NAO", "qg": "Tequi-la-la", "group": "Desmanche02", "groupOriginal": "Desmanche02", "segmento": "DESMANCHE", "produto": "Cartão Ilegivel, Cartao Ilegivel ++, Gazua, Gazua++, Desmanche", "faccao": "Tequila-la", "status": "ATIVA", "lider": "11728 - TiToin Gaspar", "staff": "Jonh Smith", "dataEntrega": "25/08/26", "observacoes": ""}, {"numero": 46, "cds": "-1376.69,-621.82,35.89,31.19", "anuncio": "NAO", "qg": "Favela da Placa", "group": "Desmanche03", "groupOriginal": "Desmanche03", "segmento": "DESMANCHE", "produto": "Cartão Ilegivel, Cartao Ilegivel ++, Gazua, Gazua++, Desmanche", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 47, "cds": "983.12,-126.47,74.05,320.32", "anuncio": "", "qg": "Motoclube Lost MC", "group": "Desmanche04", "groupOriginal": "Desmanche04", "segmento": "DESMANCHE", "produto": "Cartão Ilegivel, Cartao Ilegivel ++, Gazua, Gazua++, Desmanche", "faccao": "Abutres Motoclube", "status": "ATIVA", "lider": "11181 Chefinho", "staff": "Ralf Pena", "dataEntrega": "17/08/2026", "observacoes": ""}, {"numero": 48, "cds": "{-616.13,-1621.95,32.88}", "anuncio": "NAO", "qg": "Roogers", "group": "Desmanche05", "groupOriginal": "Desmanche05", "segmento": "DESMANCHE", "produto": "Cartão Ilegivel, Cartao Ilegivel ++, Gazua, Gazua++, Desmanche", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 49, "cds": "471.44,-1311.00,29.26", "anuncio": "", "qg": "Hayes Auto", "group": "Desmanche06", "groupOriginal": "Desmanche06", "segmento": "DESMANCHE", "produto": "Cartão Ilegivel, Cartao Ilegivel ++, Gazua, Gazua++, Desmanche", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 50, "cds": "2201.62,4689.18,37.68,68.04", "anuncio": "NAO", "qg": "Favela de Sandy Shores, Alto", "group": "Desmanche07", "groupOriginal": "Desmanche07", "segmento": "DESMANCHE", "produto": "Cartão Ilegivel, Cartao Ilegivel ++, Gazua, Gazua++, Desmanche", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 51, "cds": "92.59,-1290.91,29.25", "anuncio": "NAO", "qg": "Vanilla", "group": "Vanilla", "groupOriginal": "Vanilla", "segmento": "OUTROS", "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora", "faccao": "Vannila Unicorn", "status": "ATIVA", "lider": "5128 - MECIN BARROS", "staff": "Ralf", "dataEntrega": "26/08/26", "observacoes": ""}, {"numero": 52, "cds": "227.44,-1388.25,32.45,36.86", "anuncio": "", "qg": "IML Centro", "group": "IlegalMedic1", "groupOriginal": "IlegalMedic1", "segmento": "OUTROS", "produto": "Bandagem Infectada, Metadona, Adrenalina Clandestina", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 53, "cds": "", "anuncio": "NULO", "qg": "SEM LOCAL", "group": "IlegalMedic2", "groupOriginal": "IlegalMedic2", "segmento": "OUTROS", "produto": "Bandagem Infectada, Metadona, Adrenalina Clandestina", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 54, "cds": "{2355.39,-605.06,96.58,257.96}", "anuncio": "", "qg": "Favela da DP", "group": "IlegalMecanic01", "groupOriginal": "IlegalMecanic01", "segmento": "OUTROS", "produto": "Nitro, Tablet de Corrida,  Cartao Descartavel, Cartão Descartável ++", "faccao": "Comando Central", "status": "ATIVA", "lider": "10711—Rabico silva", "staff": "Nala", "dataEntrega": "27/07/2026", "observacoes": ""}, {"numero": 55, "cds": "", "anuncio": "", "qg": "Galpão do Porto", "group": "Contrabando01", "groupOriginal": "Contrabando01", "segmento": "OUTROS", "produto": "Farme de todas as facções disponiveis", "faccao": "Capricorp", "status": "ATIVA", "lider": "819 - Joseph Capri", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 56, "cds": "", "anuncio": "NAO", "qg": "Casa do Lester", "group": "Contrabando02", "groupOriginal": "Contrabando02", "segmento": "OUTROS", "produto": "Farme de todas as facções disponiveis", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 57, "cds": "3899.68,4877.41,12.7,93.55", "anuncio": "", "qg": "Manicomio", "group": "Manicomio", "groupOriginal": "Manicomio", "segmento": "OUTROS", "produto": "LSD, Capuz e Placa Balistica, Glock Rajada, Gazua, Gazua ++, Adrenalina Clandestina", "faccao": "Manicomio", "status": "ATIVA", "lider": "15—Dark Rott", "staff": "Italo Leonardo", "dataEntrega": "", "observacoes": ""}];

function show(el){[loginView,deniedView,appView].forEach(x=>x.classList.add('hidden'));el.classList.remove('hidden')}
async function login(){try{await signInWithPopup(auth,provider)}catch(e){alert('Não foi possível entrar com Google: '+e.message)}}
async function logout(){await signOut(auth)}
$('#loginBtn').onclick=login;$('#loginBtnCard').onclick=login;$('#logoutBtn').onclick=logout;$('#logoutDenied').onclick=logout;

const METRIC_ONLY_ROLES=new Set(['RH_METRICAS','RH_VISUALIZADOR','RH_ANALISTA','RH_GESTOR']);
function applyRoleAccess(role='CONSULTA'){
 role=String(role||'CONSULTA').toUpperCase();
 const metricOnly=METRIC_ONLY_ROLES.has(role);
 document.body.classList.toggle('metric-only-access',metricOnly);
 document.querySelectorAll('.nav-item').forEach(btn=>{
  if(metricOnly)btn.style.display=btn.dataset.page==='metricas'?'flex':'none';
  else if(!btn.classList.contains('admin-only'))btn.style.display='flex';
 });
 if(metricOnly){activateAppPage('metricas');document.querySelector('.nav-item[data-page="metricas"]')?.classList.add('active')}
}

onAuthStateChanged(auth,async user=>{
 currentUser=user;
 if(!user){show(loginView);sessionArea.innerHTML='<button class="btn-google" id="loginTop">G&nbsp; Entrar com Google</button>';$('#loginTop').onclick=login;return}
 const email=(user.email||'').toLowerCase();
 try{
  const snap=await getDoc(doc(db,'users',email));
  if(!snap.exists()||snap.data().active!==true){show(deniedView);$('#deniedText').textContent=`${email} foi autenticado, mas não possui cadastro ativo no High OS.`;sessionArea.innerHTML=`<span class="top-email">${email}</span><button class="mini-btn" id="logoutTop">Sair</button>`;$('#logoutTop').onclick=logout;return}
  currentProfile=snap.data();const role=String(currentProfile.role||'CONSULTA').toUpperCase();show(appView);
  $('#userName').textContent=currentProfile.name||user.displayName||email;$('#userRole').textContent=role;$('#dashEmail').textContent=email;$('#dashRole').textContent=role;
  if(user.photoURL)$('#userPhoto').src=user.photoURL;else $('#userPhoto').style.display='none';
  document.querySelectorAll('.admin-only').forEach(el=>el.style.display=role==='ADMIN'?'flex':'none');
  applyRoleAccess(role);
  sessionArea.innerHTML=`<span class="access-pill">● ${role}</span><span class="top-email">${email}</span>`;
  if(METRIC_ONLY_ROLES.has(role))faccoes=[];else await loadFaccoes();
  await loadMetrics();
  if(!METRIC_ONLY_ROLES.has(role))loadMarketCatalog();
  if(role==='ADMIN') await loadUsers();
 }catch(e){show(deniedView);$('#deniedText').textContent='Falha ao validar seu cadastro no Firestore: '+e.message}
});

document.querySelectorAll('.nav-item').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));btn.classList.add('active');document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));$('#page-'+btn.dataset.page).classList.add('active')}));

// HIGH OS V6.7 · o perfil do Group passa a abrir como página interna, não como modal.
function activateAppPage(page){
 document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id==='page-'+page));
 document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.page===page));
 try{window.scrollTo({top:0,behavior:'smooth'})}catch{}
}
function showGroupProfilePage(f){
 const card=$('#facModal .fac-modal-card-wide')||$('.fac-modal-card-wide');
 const mount=$('#groupProfileMount');
 if(card&&mount&&card.parentElement!==mount){mount.appendChild(card);card.classList.add('profile-page-card')}
 $('#groupProfilePageTitle').textContent=f?.group||'GROUP';
 $('#groupProfilePageSubtitle').textContent=[f?.qg||'QG sem nome',f?.faccao?`Ocupante: ${f.faccao}`:'Group vago'].join(' • ');
 const st=$('#groupProfilePageStatus');if(st)st.innerHTML=`<span class="status-chip ${(f?.status||'INATIVA').toLowerCase()}">${esc(f?.status==='ATIVA'?'OCUPADO':'VAGO')}</span>`;
 activateAppPage('group-profile');
}
function closeGroupProfilePage(){activateAppPage('faccoes')}
$('#groupProfileBack')?.addEventListener('click',closeGroupProfilePage);


async function loadFaccoes(){
 try{const qs=await getDocs(facCol);faccoes=qs.docs.map(d=>({id:d.id,...d.data()}));faccoes.sort((a,b)=>(a.numero||999)-(b.numero||999));renderFaccoes()}catch(e){$('#facList').innerHTML=`<div class="placeholder"><h3>ERRO AO CARREGAR</h3><p>${e.message}</p></div>`}
}
function renderFaccoes(){
 const q=($('#facSearch').value||'').toLowerCase(),seg=$('#facSegment').value,st=$('#facStatus').value;
 const filtered=faccoes.filter(f=>(!seg||f.segmento===seg)&&(!st||f.status===st)&&(!q||[f.group,f.faccao,f.qg,f.lider,f.staff,f.produto].join(' ').toLowerCase().includes(q)));
 const at=faccoes.filter(f=>f.status==='ATIVA').length;
 $('#facStats').innerHTML=`<span><b>${faccoes.length}</b> POSIÇÕES</span><span><b>${at}</b> ATIVAS</span><span><b>${faccoes.length-at}</b> VAGAS</span><span><b>${filtered.length}</b> EXIBIDAS</span>`;
 if(!operacionais.length){$('#facList').innerHTML='<div class="placeholder"><b>◆</b><h3>BASE AINDA NÃO IMPORTADA</h3><p>ADMIN: clique em “IMPORTAR BASE INICIAL”.</p></div>';return}
 $('#facList').innerHTML=filtered.map(f=>`<article class="fac-card" data-id="${f.id}"><div class="fac-card-head"><h3>${esc(f.group)}</h3><span class="status-chip ${f.status==='ATIVA'?'ativa':'inativa'}">${f.status==='ATIVA'?'ATIVA':'VAGA'}</span></div><div class="fac-name">${esc(f.faccao||'— VAGA —')}</div><div class="muted">${esc(f.segmento)} • ${esc(f.qg||'SEM LOCAL')}</div><div class="muted">${f.lider?'Líder: '+esc(f.lider):''}${f.staff?'<br>Staff: '+esc(f.staff):''}</div><div class="product">${esc(f.produto||'')}</div><div class="card-actions"><button class="mini-btn req-from-fac" data-group="${esc(f.group)}">NOVA SOLICITAÇÃO</button></div></article>`).join('');
 document.querySelectorAll('.fac-card').forEach(c=>c.onclick=(e)=>{if(e.target.closest('.req-from-fac'))return;openFac(c.dataset.id)});document.querySelectorAll('.req-from-fac').forEach(b=>b.onclick=(e)=>{e.stopPropagation();openRequestModal('',b.dataset.group)});
}
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
['facSearch','facSegment','facStatus'].forEach(id=>$('#'+id).addEventListener(id==='facSearch'?'input':'change',renderFaccoes));

$('#seedBtn').onclick=async()=>{
 if(currentProfile?.role!=='ADMIN')return;
 if(faccoes.length){alert('A base já possui registros. A importação inicial foi bloqueada para evitar duplicidade.');return}
 if(!confirm(`Importar as ${SEED.length} posições do Documento das Facções para o Firestore?`))return;
 try{const batch=writeBatch(db);SEED.forEach(f=>batch.set(doc(db,'highos','data','faccoes',f.group),{...f,updatedAt:serverTimestamp(),updatedBy:currentUser.email}));await batch.commit();await addDoc(histCol,{tipo:'IMPORTACAO_INICIAL',descricao:`Base inicial importada: ${SEED.length} posições`,usuario:currentUser.email,data:serverTimestamp()});await loadFaccoes();alert('Base inicial importada com sucesso.')}catch(e){alert('Erro na importação: '+e.message)}
};

function getFormBenefits(){
 return {
  vipOrg:$('#fVipOrg').checked,
  chatFaccao:$('#fChatFaccao').checked,
  salario:$('#fSalario').value.trim(),
  salarioMinutos:$('#fSalarioMin').value.trim(),
  radio:$('#fRadio').value.trim(),
  garagemVipBlip:$('#fGaragemVipBlip').value.trim(),
  garagemVipSpawn:$('#fGaragemVipSpawn').value.trim(),
  garagemVipVeiculos:$('#fGaragemVipVeiculos').value.trim(),
  lojaRoupas:$('#fLojaRoupas').value.trim(),
  barbearia:$('#fBarbearia').value.trim(),
  tatuagem:$('#fTatuagem').value.trim(),
  shopExclusivo:$('#fShopExclusivo').value.trim(),
  bau:$('#fBau').value.trim(),
  bauCapacidade:$('#fBauCapacidade').value.trim(),
  arena:$('#fArena').value.trim(),
  farm:($('#fTechFarmCds')?.value||$('#fFarm').value).trim(),
  craft:($('#fTechCraftCds')?.value||$('#fCraft').value).trim(),
  rotaExclusiva:$('#fRotaExclusiva').checked,
  rotaBlips:($('#fTechRoutePoints')?.value||$('#fRotaBlips').value).trim(),
  telao:$('#fTelao').checked,
  telaoNome:$('#fTelaoNome').value.trim(),
  telaoPostit:$('#fTelaoPostit').value.trim(),
  telaoCds:$('#fTelaoCds').value.trim(),
  garagemPublica:$('#fGaragemPublica').checked,
  garagemPublicaBlip:$('#fGaragemPublicaBlip').value.trim(),
  garagemPublicaSpawn:$('#fGaragemPublicaSpawn').value.trim(),
  heliponto:$('#fHeliponto').checked,
  helipontoBlip:$('#fHelipontoBlip').value.trim(),
  helipontoSpawn:$('#fHelipontoSpawn').value.trim(),
  outros:$('#fOutrosBeneficios').value.trim()
 };
}
function setFormBenefits(b={}){
 $('#fVipOrg').checked=!!b.vipOrg;$('#fChatFaccao').checked=!!b.chatFaccao;
 $('#fSalario').value=b.salario||'';$('#fSalarioMin').value=b.salarioMinutos||'';$('#fRadio').value=b.radio||'';
 $('#fGaragemVipBlip').value=b.garagemVipBlip||'';$('#fGaragemVipSpawn').value=b.garagemVipSpawn||'';$('#fGaragemVipVeiculos').value=b.garagemVipVeiculos||'';
 $('#fLojaRoupas').value=b.lojaRoupas||'';$('#fBarbearia').value=b.barbearia||'';$('#fTatuagem').value=b.tatuagem||'';$('#fShopExclusivo').value=b.shopExclusivo||'';
 $('#fBau').value=b.bau||'';$('#fBauCapacidade').value=b.bauCapacidade||'';$('#fArena').value=b.arena||'';$('#fFarm').value=b.farm||'';$('#fCraft').value=b.craft||'';
 $('#fRotaExclusiva').checked=!!b.rotaExclusiva;$('#fRotaBlips').value=b.rotaBlips||'';$('#fTelao').checked=!!b.telao;$('#fTelaoNome').value=b.telaoNome||'';$('#fTelaoPostit').value=b.telaoPostit||'';$('#fTelaoCds').value=b.telaoCds||'';
 $('#fGaragemPublica').checked=!!b.garagemPublica;$('#fGaragemPublicaBlip').value=b.garagemPublicaBlip||'';$('#fGaragemPublicaSpawn').value=b.garagemPublicaSpawn||'';
 $('#fHeliponto').checked=!!b.heliponto;$('#fHelipontoBlip').value=b.helipontoBlip||'';$('#fHelipontoSpawn').value=b.helipontoSpawn||'';$('#fOutrosBeneficios').value=b.outros||'';
}
function selectedDefaultBenefits(){return [...document.querySelectorAll('[data-default-benefit]:checked')].map(x=>x.dataset.defaultBenefit)}
function currentFactionFromForm(){
 const old=faccoes.find(x=>x.group===$('#fGroup').value)||{};
 return {...old,group:$('#fGroup').value,status:$('#fStatus').value,faccao:$('#fFaccao').value.trim(),qg:$('#fQG').value.trim(),produto:$('#fProduto').value.trim(),lider:$('#fLider').value.trim(),staff:$('#fStaff').value.trim(),dataEntrega:$('#fData').value.trim(),anuncio:$('#fAnuncio').value.trim(),cds:$('#fCds').value.trim(),observacoes:$('#fObs').value.trim(),beneficios:getFormBenefits(),perfilEntrega:{planoPadrao:$('#fPlanoPadrao')?.value.trim()||'',observacao:$('#fPerfilObs')?.value.trim()||'',beneficiosPadrao:selectedDefaultBenefits()},perfilTecnico:getTechProfileFromForm()};
}
function benefitLines(f){
 const b=f?.beneficios||{}, out=[];
 if(b.vipOrg)out.push('VIP Org');
 if(b.salario)out.push(`Salário: R$ ${b.salario} a cada ${b.salarioMinutos||40} minutos`);
 if(b.chatFaccao)out.push('Chat da Facção');
 if(b.radio)out.push(`Rádio Exclusiva: ${b.radio}`);
 if(b.garagemVipBlip||b.garagemVipSpawn)out.push('Garagem VIP Org');
 if(b.lojaRoupas)out.push('Loja de Roupas');if(b.barbearia)out.push('Barbearia');if(b.tatuagem)out.push('Tatuagem');if(b.shopExclusivo)out.push('Shop Exclusivo');
 if(b.bau)out.push(`Baú${b.bauCapacidade?' ('+b.bauCapacidade+')':''}`);if(b.arena)out.push('Blip de Arena');if(b.farm)out.push('Farm');if(b.craft)out.push('Craft');
 if(b.rotaExclusiva)out.push('Rota Exclusiva');if(b.telao)out.push(`Telão${b.telaoNome?' ('+b.telaoNome+')':''}`);
 if(b.garagemPublica)out.push('Garagem Pública');if(b.heliponto)out.push('Heliponto');
 if(b.outros)out.push(...b.outros.split(/\r?\n/).map(x=>x.trim()).filter(Boolean));
 return out;
}
function buildDeliveryExtract(f=currentFactionFromForm()){
 const items=benefitLines(f), L=['ENTREGA DE ORGANIZAÇÃO — HIGH ILEGAL','','Facção: '+(f.faccao||'—'),'Group: '+(f.group||'—'),'Segmento: '+(f.segmento||'—'),'Local/QG: '+(f.qg||'—')];
 if(f.produto)L.push('Produto/Eixo: '+f.produto);if(f.lider)L.push('Líder: '+f.lider);if(f.staff)L.push('Staff responsável: '+f.staff);if(f.dataEntrega)L.push('Data da entrega: '+f.dataEntrega);
 L.push('','Benefícios / Setagens:');L.push(...(items.length?items.map(x=>'• '+x):['• Nenhum benefício/setagem cadastrado']));
 if(f.observacoes)L.push('','Observações: '+f.observacoes);
 return L.join('\n');
}
function changedBenefit(oldB={},newB={},keys=[]){return keys.some(k=>String(oldB?.[k]??'')!==String(newB?.[k]??''))}
function autoDeliveryRequests(f=currentFactionFromForm()){
 const old=faccoes.find(x=>x.group===f.group)||{}, ob=old.beneficios||{}, b=f.beneficios||{}, req=[];
 const add=(tipo,titulo,texto)=>req.push({tipo,titulo,texto});
 const vipKeys=['vipOrg','salario','salarioMinutos','chatFaccao','radio','garagemVipBlip','garagemVipSpawn','garagemVipVeiculos','lojaRoupas','barbearia','tatuagem','shopExclusivo','bau','bauCapacidade','arena','farm','craft','outros'];
 if(b.vipOrg && (!ob.vipOrg || changedBenefit(ob,b,vipKeys))){
   let L=['Assunto: Ativação de benefícios de uma organização e alguns blips','','Solicitação:','','- Ativação de benefícios de uma organização e alguns blips','',`- Group: ${f.group}`];
   if(b.salario)L.push('',`- Ativar salário de ${b.salario} (A cada ${b.salarioMinutos||40} minutos)`);
   if(b.radio)L.push('',`- Ativar Rádio exclusiva: ${b.radio}`); if(b.chatFaccao)L.push('','- Ativar Chat Facção.');
   if(b.garagemVipBlip||b.garagemVipSpawn){L.push('','- Ativar Garagem VIP:','','- Blip de Garagem VIP Org.');if(b.garagemVipVeiculos)L.push(`- Veículos: ${b.garagemVipVeiculos}`);L.push('',`- Blip: ${fmtCds(b.garagemVipBlip)}`,`- Spawn: ${fmtCds(b.garagemVipSpawn)}`)}
   [['Loja de roupas',b.lojaRoupas],['Barbearia',b.barbearia],['Tatuagem',b.tatuagem],['Shop Exclusivo',b.shopExclusivo],['Baú',b.bau],['Blip de arena',b.arena],['Farm',b.farm],['Craft',b.craft]].forEach(([n,v])=>{if(v)L.push('',`- ${n}: ${fmtCds(v)}`)}); if(b.bauCapacidade)L.push(`- Capacidade do Baú: ${b.bauCapacidade}`); if(b.outros)L.push('',...b.outros.split(/\r?\n/).filter(Boolean).map(x=>'- '+x));
   add('BENEFICIOS','VIP Org / Benefícios e Setagens',L.join('\n'));
 }
 if(b.rotaExclusiva && (!ob.rotaExclusiva || changedBenefit(ob,b,['rotaBlips']))){let pts=(b.rotaBlips||'').split(/\r?\n/).filter(Boolean);add('ROTA_FARM','Rota de Farm Exclusiva',['Assunto: Ativação de rota de farm exclusiva','','Solicitação:','','- Ativação de rota de farm exclusiva',`- Group: ${f.group}`,'','- Blips da rota nova:','',...(pts.length?pts:['{ CDS },'])].join('\n'))}
 if(b.telao && (!ob.telao || changedBenefit(ob,b,['telaoNome','telaoPostit','telaoCds']))){add('TELAO','Telão da Organização',['Assunto: Ativação de Telão Hall em uma Organização Ilegal','','Solicitação:','','- Ativação de Telão Hall em uma Organização Ilegal.','',`- Group: ${f.group}`,`- Telão usado: ${b.telaoNome||'{modelo_do_telao}'}`,'','- Local/Coordenadas de onde está o telão (coordenadas pega com postit):',`  ${fmtCds(b.telaoPostit)}`,'','- Local/Coordenadas de onde está o telão (coordenadas pega com cds):',`  ${fmtCds(b.telaoCds)}`].join('\n'))}
 if(b.garagemPublica && (!ob.garagemPublica || changedBenefit(ob,b,['garagemPublicaBlip','garagemPublicaSpawn']))){add('GARAGEM','Garagem Pública',['Assunto:','','- Solicitaçao de Garagem Publica;','','Solicitaçao:','','- Adicione uma garagem publica na CDS abaixo:','',`* Blip: ${fmtCds(b.garagemPublicaBlip)}`,`* Spawn: ${fmtCds(b.garagemPublicaSpawn)}`,'',`- Permissao : ${f.group}`].join('\n'))}
 if(b.heliponto && (!ob.heliponto || changedBenefit(ob,b,['helipontoBlip','helipontoSpawn']))){add('HELIPONTO','Heliponto',['Assunto: Adição de Heliponto','','Solicitação:','- Adicione um Heliponto na cds abaixo;',`- ${fmtCds(b.helipontoBlip)}`,...(b.helipontoSpawn?['',`- Spawn: ${fmtCds(b.helipontoSpawn)}`]:[]),'',`- Group: ${f.group}.`].join('\n'))}
 return req;
}
function renderDeliveryRequests(){const box=$('#deliveryRequestsPreview');if(!box)return;const rs=autoDeliveryRequests();box.innerHTML=rs.length?rs.map((r,i)=>`<article class="delivery-request-card"><div><b>${i+1}. ${esc(r.titulo)}</b><span>${esc(r.tipo)}</span></div><pre>${esc(r.texto)}</pre></article>`).join(''):'<div class="delivery-no-change">Nenhuma nova solicitação necessária com as alterações atuais.</div>'}
function updateDeliveryPreview(){if($('#deliveryPreview'))$('#deliveryPreview').value=buildDeliveryExtract();renderDeliveryRequests()}
async function copyDeliveryRequests(){const rs=autoDeliveryRequests(),t=rs.map((r,i)=>`===== ${i+1}. ${r.titulo.toUpperCase()} =====\n\n${r.texto}`).join('\n\n');if(!t)return alert('Nenhuma solicitação técnica nova foi identificada.');try{await navigator.clipboard.writeText(t);const b=$('#copyDeliveryRequestsBtn'),o=b.textContent;b.textContent='COPIADO ✓';setTimeout(()=>b.textContent=o,1400)}catch(e){alert('Não foi possível copiar automaticamente.') }}
async function copyDeliveryExtract(){const t=$('#deliveryPreview').value;try{await navigator.clipboard.writeText(t);const b=$('#copyDeliveryBtn'),o=b.textContent;b.textContent='COPIADO ✓';setTimeout(()=>b.textContent=o,1400)}catch(e){$('#deliveryPreview').select();document.execCommand('copy')}}

function resolveGroupIdentity(f={}){
 const seed=SEED.find(x=>x.group===f.group)||{};
 const org=organizacoes.find(o=>String(o.nome||'').trim().toLowerCase()===String(f.faccao||'').trim().toLowerCase())||{};
 const sameSeedOccupant=!!f.faccao && String(seed.faccao||'').trim().toLowerCase()===String(f.faccao||'').trim().toLowerCase();
 return {
  ...f,
  lider:f.lider||org.lider||(sameSeedOccupant?seed.lider:'')||'',
  staff:f.staff||(sameSeedOccupant?seed.staff:'')||'',
  dataEntrega:f.dataEntrega||org.desde||(sameSeedOccupant?seed.dataEntrega:'')||''
 };
}
function openFac(id){
 const raw=faccoes.find(x=>x.id===id);if(!raw)return;const f=resolveGroupIdentity(raw);
 $('#fGroup').value=f.group;$('#fGroupShow').value=f.group;$('#fStatus').value=f.status||'INATIVA';$('#fFaccao').value=f.faccao||'';$('#fQG').value=f.qg||'';$('#fProduto').value=f.produto||'';$('#fLider').value=f.lider||'';$('#fStaff').value=f.staff||'';$('#fData').value=f.dataEntrega||'';$('#fAnuncio').value=f.anuncio||'';$('#fCds').value=f.cds||'';$('#fObs').value=f.observacoes||'';setFormBenefits(f.beneficios||{});renderDefaultDeliveryProfile(f);renderTechProfile(f);$('#facModalTitle').textContent=f.group;showGroupProfilePage(f);updateDeliveryPreview();
 $('#recolherBtn').style.display=f.status==='ATIVA'?'block':'none';
}
$('#facModalClose').onclick=closeGroupProfilePage;

['fStatus','fFaccao','fQG','fProduto','fLider','fStaff','fData','fAnuncio','fCds','fObs','fVipOrg','fChatFaccao','fSalario','fSalarioMin','fRadio','fGaragemVipBlip','fGaragemVipSpawn','fGaragemVipVeiculos','fLojaRoupas','fBarbearia','fTatuagem','fShopExclusivo','fBau','fBauCapacidade','fArena','fFarm','fCraft','fRotaExclusiva','fRotaBlips','fTelao','fTelaoNome','fTelaoPostit','fTelaoCds','fGaragemPublica','fGaragemPublicaBlip','fGaragemPublicaSpawn','fHeliponto','fHelipontoBlip','fHelipontoSpawn','fOutrosBeneficios','fPlanoPadrao','fPerfilObs','fTechCraftCds','fTechCraftNome','fTechFarmCds','fTechRouteName','fTechRouteStart','fTechRoutePoints'].forEach(id=>$('#'+id)?.addEventListener('input',updateDeliveryPreview));
$('#copyDeliveryBtn').onclick=copyDeliveryExtract; $('#copyDeliveryRequestsBtn').onclick=copyDeliveryRequests;

$('#facForm').onsubmit=async e=>{
 e.preventDefault();const group=$('#fGroup').value,old=faccoes.find(x=>x.group===group);const data={...old,status:$('#fStatus').value,faccao:$('#fFaccao').value.trim(),qg:$('#fQG').value.trim(),produto:$('#fProduto').value.trim(),lider:$('#fLider').value.trim(),staff:$('#fStaff').value.trim(),dataEntrega:$('#fData').value.trim(),anuncio:$('#fAnuncio').value.trim(),cds:$('#fCds').value.trim(),observacoes:$('#fObs').value.trim(),beneficios:getFormBenefits(),perfilEntrega:{planoPadrao:$('#fPlanoPadrao')?.value.trim()||'',observacao:$('#fPerfilObs')?.value.trim()||'',beneficiosPadrao:selectedDefaultBenefits()},perfilTecnico:getTechProfileFromForm(),updatedAt:serverTimestamp(),updatedBy:currentUser.email};
 if(data.status==='ATIVA'&&!data.faccao){alert('Informe o nome da facção para marcar como ATIVA.');return}
 try{const generated=autoDeliveryRequests(data);await setDoc(doc(db,'highos','data','faccoes',group),data);await addDoc(histCol,{tipo:old?.status==='INATIVA'&&data.status==='ATIVA'?'ENTREGA':'EDICAO',group,antes:snapshot(old),depois:snapshot(data),solicitacoesGeradas:generated,extratoEntrega:buildDeliveryExtract(data),usuario:currentUser.email,data:serverTimestamp()});closeGroupProfilePage();await loadFaccoes()}catch(err){alert('Erro ao salvar: '+err.message)}
};
$('#recolherBtn').onclick=async()=>{
 const group=$('#fGroup').value,old=faccoes.find(x=>x.group===group);if(!old||!confirm(`Recolher ${old.faccao||group} e deixar ${group} VAGO? O histórico será preservado.`))return;
 const data={...old,status:'INATIVA',faccao:'',lider:'',staff:'',dataEntrega:'',observacoes:old.observacoes||'',updatedAt:serverTimestamp(),updatedBy:currentUser.email};
 try{await setDoc(doc(db,'highos','data','faccoes',group),data);if(old.faccao){const oid=orgKey(old.faccao);await setDoc(doc(db,'highos','data','organizacoes',oid),{nome:old.faccao,status:'SEM_GROUP',groupAtual:'',segmentoAtual:'',qgAtual:'',updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true})}await addDoc(histCol,{tipo:'RECOLHIMENTO',group,faccao:old.faccao||'',antes:snapshot(old),depois:snapshot(data),usuario:currentUser.email,data:serverTimestamp()});closeGroupProfilePage();await loadFaccoes()}catch(err){alert('Erro ao recolher: '+err.message)}
};
function snapshot(o){if(!o)return null;const x={...o};delete x.updatedAt;return x}


// ===== HIGH OS V4.2 · CENTRAL DE SOLICITAÇÕES · PADRÕES OFICIAIS HIGH =====
const REQUEST_TYPES=[
  ['GARAGEM','Garagem Pública'],
  ['HELIPONTO','Heliponto'],
  ['GARAGEM_VIP','Garagem VIP / VIP Fac'],
  ['ROTA_FARM','Rota de Farm Exclusiva'],
  ['BAU','Baú'],
  ['BLIP','Adição / Alteração de Blip'],
  ['REMOVER_BLIP','Remoção de Blip'],
  ['RADIO','Rádio Exclusiva'],
  ['BENEFICIOS','VIP Org / Benefícios e Setagens'],
  ['TELAO','Telão da Organização'],
  ['LOJA_FACCAO','Loja de Facção / Shop Exclusivo'],
  ['TELEPORT','Teleport'],
  ['WEBHOOK','Log / Webhook'],
  ['UNIFORME','Uniforme / Roupas'],
  ['ITENS','Criação / Alteração de Itens'],
  ['ALTERACAO_GROUP','Alteração de Group / Facção'],
  ['GERAL','Solicitação Geral']
];

const TYPE_PLACEHOLDERS={
 GARAGEM:'Blip: {x,y,z,h}\nSpawn: {x,y,z,h}\nObservações:',
 HELIPONTO:'Blip: {x,y,z,h}\nSpawn: {x,y,z,h}\nObservações:',
 GARAGEM_VIP:'Veículos: LLMOTOSTIER2002, fooxcustomzlexrfc\nBlip: {x,y,z,h}\nSpawn: {x,y,z,h}\nObservações:',
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

const BUILTIN_REQUEST_MODELS=REQUEST_TYPES.map(([tipo,nome])=>({
  id:'builtin-'+tipo,
  builtin:true,
  tipo,
  nome:nome,
  assunto:defaultSubject(tipo),
  detalhes:TYPE_PLACEHOLDERS[tipo]||'',
  origem:'Base padrão High OS'
}));

function initRequestUi(){
  const opts=REQUEST_TYPES.map(([v,n])=>`<option value="${v}">${n}</option>`).join('');
  $('#reqTipo').innerHTML=opts; $('#reqTypeFilter').innerHTML='<option value="">TODAS AS CATEGORIAS</option>'+opts;
  $('#newRequestBtn').onclick=()=>openRequestModal();
  $('#reqModalClose').onclick=()=>$('#reqModal').classList.add('hidden');
  $('#reqModal').addEventListener('click',e=>{if(e.target.id==='reqModal')$('#reqModal').classList.add('hidden')});
  $('#reqTipo').addEventListener('change',()=>{
    if(!$('#reqId').value){
      $('#reqDetalhes').value=TYPE_PLACEHOLDERS[$('#reqTipo').value]||'';
      $('#reqAssunto').value=defaultSubject($('#reqTipo').value);
      $('#reqModelName').value=requestTypeName($('#reqTipo').value);
    }
    updateRequestPreview();syncRouteRequestAction();
  });
  ['reqGroup','reqAssunto','reqDetalhes','reqModelName'].forEach(id=>$('#'+id).addEventListener('input',()=>{if(id==='reqGroup')syncRequestFaction();updateRequestPreview();syncRouteRequestAction()}));
  $('#reqSearch').addEventListener('input',renderRequests); $('#reqTypeFilter').addEventListener('change',renderRequests);
  $('#copyReqBtn').onclick=copyRequestText; $('#applyRouteRequestBtn')?.addEventListener('click',applyRouteRequestToProfile); $('#reqForm').addEventListener('submit',saveRequestModel);
}
function requestTypeName(v){return REQUEST_TYPES.find(x=>x[0]===v)?.[1]||v||'Solicitação Geral'}
function updateRequestGroupOptions(selected=''){
  $('#reqGroup').innerHTML='<option value="">SEM GROUP / GERAL</option>'+faccoes.map(f=>`<option value="${esc(f.group)}">${esc(f.group)}${f.faccao?' — '+esc(f.faccao):''}</option>`).join('');
  $('#reqGroup').value=selected||''; syncRequestFaction();
}
function syncRequestFaction(){const f=faccoes.find(x=>x.group===$('#reqGroup').value);$('#reqFaccao').value=f?.faccao||''}
function defaultSubject(type){return ({
 GARAGEM:'Solicitaçao de Garagem Publica',
 HELIPONTO:'Adição de Heliponto',
 GARAGEM_VIP:'Ativação de garagem VIP',
 ROTA_FARM:'Ativação de rota de farm exclusiva',
 BAU:'Adição de baú',
 BLIP:'Adição de blip',
 REMOVER_BLIP:'Remover blip',
 RADIO:'Ativação de rádio exclusiva para uma facção',
 BENEFICIOS:'Ativação de benefícios de uma organização e alguns blips',
 TELAO:'Ativação de Telão Hall em uma Organização Ilegal',
 LOJA_FACCAO:'Adição de blip de loja de facção',
 TELEPORT:'Criação de blip de teleport',
 WEBHOOK:'Ativação de log através da Webhook',
 UNIFORME:'Adição de uniforme',
 ITENS:'Criação / alteração de itens',
 ALTERACAO_GROUP:'Alteração de Group / facção',
 GERAL:'Solicitação operacional'
})[type]||'Solicitação operacional'}

function getDetailValue(label, detalhes=''){
 const safe=String(label).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const rx=new RegExp('^\\s*[-*]?\\s*'+safe+'\\s*[:=-]\\s*(.+)$','im');
 const m=String(detalhes||'').match(rx);
 return m?m[1].trim():'';
}
function getDetailBlock(label, detalhes=''){
 const lines=String(detalhes||'').split(/\r?\n/); let on=false,out=[];
 for(const raw of lines){const t=raw.trim();if(!t)continue;
   if(new RegExp('^[-*]?\\s*'+label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*:?$','i').test(t)){on=true;continue}
   if(on && /^[A-Za-zÀ-ÿ][^{}]*:\s*/.test(t))break;
   if(on)out.push(t);
 }
 return out;
}
function fmtCds(v){if(!v)return '{CDS}';return v.startsWith('{')?v:`{${v.replace(/^\{|\}$/g,'')}}`}
function pushObs(lines,detalhes){const obs=getDetailValue('Observações?',detalhes)||getDetailValue('Obs',detalhes);if(obs)lines.push('',`- Observação: ${obs}`)}

function buildRequestText(){
 const group=$('#reqGroup').value.trim();
 const tipo=$('#reqTipo').value;
 const d=$('#reqDetalhes').value.trim();
 const subject=$('#reqAssunto').value.trim()||defaultSubject(tipo);
 const G=group||'{Nome do Group}';
 const fac=faccoes.find(x=>x.group===group); const b=fac?.beneficios||{};
 let L=[];

 if(tipo==='GARAGEM'){
   L=['Assunto:','','- Solicitaçao de Garagem Publica;','','Solicitaçao:','','- Adicione uma garagem publica na CDS abaixo:','',`* Blip: ${fmtCds(getDetailValue('Blip',d))}`,`* Spawn: ${fmtCds(getDetailValue('Spawn',d))}`,'',`- Permissao : ${G}`];
 }
 else if(tipo==='HELIPONTO'){
   const blip=getDetailValue('Blip',d)||getDetailValue('Heliponto',d)||getDetailValue('CDS',d),spawn=getDetailValue('Spawn',d);
   L=['Assunto:','',`- ${subject};`,'','Solicitação:','','- Adicione um Heliponto na CDS abaixo:','',`* Blip: ${fmtCds(blip)}`];
   if(spawn)L.push(`* Spawn: ${fmtCds(spawn)}`); L.push('',`- Permissão: ${G}`); pushObs(L,d);
 }
 else if(tipo==='GARAGEM_VIP'){
   const veic=getDetailValue('Veículos?',d)||'"LLMOTOSTIER2002" e "fooxcustomzlexrfc"';
   L=[`Assunto: ${subject}`,'','Solicitação:','','- Ativação de garagem VIP','','- Garagem VIP:','','- Blip de Garagem VIP Org.',`- Veículos: ${veic}`,'',`- Group: ${G}`,'',`- Blip:`,`  ${fmtCds(getDetailValue('Blip',d))}`,'',`- Spawn:`,`  ${fmtCds(getDetailValue('Spawn',d))}`];pushObs(L,d);
 }
 else if(tipo==='ROTA_FARM'){
   let pts=getDetailBlock('Blips da rota nova',d); if(!pts.length)pts=d.split(/\r?\n/).map(x=>x.trim()).filter(x=>/^\{.*\},?$/.test(x)); if(!pts.length&&b.rotaBlips)pts=String(b.rotaBlips).split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
   L=[`Assunto: ${subject}`,'','Solicitação:','','- Ativação de rota de farm exclusiva',`- Group: ${G}`,'','- Blips da rota nova:',''];
   L.push(...(pts.length?pts:['{ CDS },','{ CDS },'])); pushObs(L,d);
 }
 else if(tipo==='BAU'){
   L=[`Assunto: ${subject}`,'','Solicitação:','','- Adição de baú.',`- Group: ${G}`,'',`- Local/Coordenadas:`,`  ${fmtCds(getDetailValue('CDS',d)||getDetailValue('Blip',d))}`];
   const cap=getDetailValue('Capacidade',d),perm=getDetailValue('Permissão',d);if(cap)L.push(`- Capacidade: ${cap}`);L.push(`- Permissão: ${perm||G}`);pushObs(L,d);
 }
 else if(tipo==='BLIP'){
   const bt=getDetailValue('Tipo do blip',d)||'blip';
   L=[`Assunto: ${subject}`,'','Solicitação:','',`- Adição de ${bt}.`,`- Group: ${G}`,'',`- Local/Coordenadas:`,`  ${fmtCds(getDetailValue('CDS',d)||getDetailValue('Blip',d))}`];
   const sp=getDetailValue('Spawn',d);if(sp)L.push('',`- Spawn:`,`  ${fmtCds(sp)}`);pushObs(L,d);
 }
 else if(tipo==='REMOVER_BLIP'){
   const bt=getDetailValue('Tipo do blip',d)||'blip';L=[`Assunto: ${subject}`,'','Solicitação:','',`- Remover ${bt}.`,`- Group: ${G}`,'',`- Local/Coordenadas:`,`  ${fmtCds(getDetailValue('CDS',d)||getDetailValue('Blip',d))}`];pushObs(L,d);
 }
 else if(tipo==='RADIO'){
   const radio=getDetailValue('Rádio(?: Exclusiva)?',d)||getDetailValue('Radio(?: exclusiva)?',d)||'{Número da rádio}';
   L=[`Assunto: ${subject}`,'','Solicitação:','',`- Ativação de rádio exclusiva para uma facção.`,`- Group: ${G}`,'',`- Rádio Exclusiva: ${radio}.`];pushObs(L,d);
 }
 else if(tipo==='BENEFICIOS'){
   L=[`Assunto: ${subject}`,'','Solicitação:','','- Ativação de benefícios de uma organização e alguns blips','',`- Group: ${G}`];
   const salario=getDetailValue('Salário',d)||b.salario; const mins=b.salarioMinutos||'40'; if(salario)L.push('',`- Ativar salário de ${salario} (A cada ${mins} minutos)`);
   const radio=getDetailValue('Rádio',d)||b.radio; if(radio)L.push('',`- Ativar Rádio exclusiva: ${radio}`);
   const chatOverride=getDetailValue('Chat Facção',d); if(b.chatFaccao||/^sim|ativar|sim$/i.test(chatOverride))L.push('','- Ativar Chat Facção.');
   const gvB=getDetailValue('Garagem VIP - Blip',d)||b.garagemVipBlip,gvS=getDetailValue('Garagem VIP - Spawn',d)||b.garagemVipSpawn,veic=getDetailValue('Veículos',d)||b.garagemVipVeiculos;
   if(gvB||gvS){L.push('','- Garagem VIP:','','- Blip de Garagem VIP Org.');if(veic)L.push(`- Veículos: ${veic}`);L.push('',`- Blip:`,`  ${fmtCds(gvB)}`,'',`- Spawn:`,`  ${fmtCds(gvS)}`)}
   const singles=[['Loja de roupas',b.lojaRoupas],['Barbearia',b.barbearia],['Tatuagem',b.tatuagem],['Shop Exclusivo',b.shopExclusivo],['Farm',b.farm],['Craft',b.craft],['Baú',b.bau],['Arena',b.arena]];
   for(const [label,saved] of singles){const v=getDetailValue(label,d)||saved;if(v)L.push('',`- ${label}:`,`  ${fmtCds(v)}`)}
   if(b.bauCapacidade)L.push(`- Capacidade do Baú: ${b.bauCapacidade}`);
   if(b.outros){L.push('','- Outros benefícios / setagens:');L.push(...String(b.outros).split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(x=>`- ${x}`))}
   pushObs(L,d);
 }
 else if(tipo==='TELAO'){
   const nome=getDetailValue('Modelo do Telão',d)||getDetailValue('Telão usado',d)||b.telaoNome||'{modelo_do_telao}';
   const postit=getDetailValue('CDS/postit',d)||b.telaoPostit||'{CDS postit}'; const cds=getDetailValue('CDS',d)||b.telaoCds||'{CDS jogador}';
   L=[`Assunto: ${subject}`,'','Solicitação:','','- Ativação de Telão Hall em uma Organização Ilegal.','',`- Group: ${G}`,`- Telão usado: ${nome}`,'','- Local/Coordenadas de onde está o telão (coordenadas pega com postit):',`  ${fmtCds(postit)}`,'','- Local/Coordenadas de onde está o telão (coordenadas pega com cds):',`  ${fmtCds(cds)}`];pushObs(L,d);
 }
 else if(tipo==='LOJA_FACCAO'){
   L=[`Assunto: ${subject}`,'','Solicitação:','',`- Adicionar uma loja na cds abaixo com acesso exclusivo para o group ${G};`,`- ${fmtCds(getDetailValue('CDS',d)||getDetailValue('Blip',d))}`,'',`- Group: ${G}.`];pushObs(L,d);
 }
 else if(tipo==='TELEPORT'){
   L=[`Assunto: ${subject}`,'','Solicitação:','','- Criação de blip de teleport','',`- Entrada: ${fmtCds(getDetailValue('Entrada',d))}`,`- Saída: ${fmtCds(getDetailValue('Saída',d)||getDetailValue('Saida',d))}`,'',`- Group: ${G}.`];pushObs(L,d);
 }
 else if(tipo==='WEBHOOK'){
   L=[`Assunto: ${subject}`,'','Solicitação:','','- Ativação de log através da Webhook.',`- Webhook: ${getDetailValue('Webhook',d)||'{Webhook}'}`,`- Discord para colocar a log: ${getDetailValue('Discord/Canal',d)||getDetailValue('Discord',d)||'{Canal/Discord}'}`,'',`- Permissão que o recurso está: ${getDetailValue('Permissão',d)||G}.`];pushObs(L,d);
 }
 else if(tipo==='UNIFORME'){
   const org=getDetailValue('Organização/Group',d)||group;const nome=getDetailValue('Nome do uniforme',d);const arq=getDetailValue('Arquivo/anexo',d);
   L=[`Assunto: ${subject}`,'','Solicitação:','','- Adição de uniforme.','- Cidade: High','','- Arquivo/anexo:'];
   if(nome||org)L.push(`Uniforme ${org?org+' ':''}${nome||''}`.trim()+'.');if(arq)L.push(arq);const ajuste=getDetailValue('Categoria/ajuste',d);if(ajuste)L.push('',`- Ajuste solicitado: ${ajuste}`);pushObs(L,d);
 }
 else if(tipo==='ITENS'){
   const nome=getDetailValue('Nome do item',d)||'{Nome do item}',spawn=getDetailValue('Spawn',d)||'{spawn_do_item}',png=getDetailValue('Arquivo PNG',d)||`${spawn}.png`,uso=getDetailValue('Interação/uso',d),desc=getDetailValue('Descrição',d);
   L=[`Assunto: ${subject}`,'','Solicitação:','','- Criação / alteração de item.','',`- Nome do item: ${nome}`,`- Spawn: ${spawn}`,`- Arquivo PNG: ${png}`];if(uso)L.push(`- Interação/uso: ${uso}`);if(desc)L.push(`- Descrição: ${desc}`);if(group)L.push('',`- Group/Permissão: ${group}`);pushObs(L,d);
 }
 else if(tipo==='ALTERACAO_GROUP'){
   L=[`Assunto: ${subject}`,'','Solicitação:','',`- ${getDetailValue('Alteração solicitada',d)||'Alteração de Group / permissão.'}`,`- Group atual: ${getDetailValue('Group atual',d)||'{Group atual}'}`,`- Novo Group: ${getDetailValue('Novo Group',d)||group||'{Novo Group}'}`];const cds=getDetailValue('Blip/CDS relacionado',d);if(cds)L.push(`- Blip/CDS relacionado: ${fmtCds(cds)}`);pushObs(L,d);
 }
 else if(tipo==='GERAL'){
   L=[`Assunto: ${subject}`,'','Solicitação:',''];if(d)L.push(d);
 }
 else {
   L=[`Assunto: ${subject}`,'','Solicitação:',''];if(group)L.push(`- Group: ${group}`);if(d)L.push(d);
 }
 return L.join('\n');
}

function openRequestModal(id='',group=''){
 const model=id?[...BUILTIN_REQUEST_MODELS,...solicitacoes].find(x=>x.id===id):null;
 $('#reqId').value=model?.builtin?'':(model?.id||'');
 updateRequestGroupOptions(group||model?.group||'');
 $('#reqTipo').value=model?.tipo||'GERAL';
 $('#reqModelName').value=model?.nome||requestTypeName($('#reqTipo').value);
 $('#reqAssunto').value=model?.assunto||defaultSubject($('#reqTipo').value);
 $('#reqDetalhes').value=model?.detalhes||TYPE_PLACEHOLDERS[$('#reqTipo').value]||'';
 $('#reqOrigem').value=model?.origem||(model?.builtin?'Base padrão High OS':'Biblioteca de modelos');
 $('#reqModalTitle').textContent=model?'GERAR A PARTIR DO MODELO':'NOVO MODELO / SOLICITAÇÃO';
 syncRequestFaction();updateRequestPreview();syncRouteRequestAction();$('#reqModal').classList.remove('hidden');
}
async function loadRequests(){
 try{
   const qs=await getDocs(reqCol);
   solicitacoes=qs.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.isModelo===true);
   solicitacoes.sort((a,b)=>(a.nome||a.assunto||'').localeCompare(b.nome||b.assunto||'','pt-BR'));
   renderRequests();
 }catch(e){$('#reqList').innerHTML=`<div class="placeholder"><h3>ERRO AO CARREGAR</h3><p>${esc(e.message)}</p></div>`}
}
function allRequestModels(){return [...BUILTIN_REQUEST_MODELS,...solicitacoes]}
function renderRequests(){
 const q=($('#reqSearch').value||'').toLowerCase(),tp=$('#reqTypeFilter').value;
 const models=allRequestModels();
 const list=models.filter(r=>(!tp||r.tipo===tp)&&(!q||[r.nome,r.assunto,r.tipo,requestTypeName(r.tipo),r.group,r.origem,r.detalhes].join(' ').toLowerCase().includes(q)));
 const custom=solicitacoes.length;
 $('#reqStats').innerHTML=`<span><b>${models.length}</b> MODELOS</span><span><b>${BUILTIN_REQUEST_MODELS.length}</b> PADRÃO HIGH</span><span><b>${custom}</b> PERSONALIZADOS</span><span><b>${list.length}</b> EXIBIDOS</span>`;
 if(!list.length){$('#reqList').innerHTML='<div class="placeholder"><b>▤</b><h3>NENHUM MODELO ENCONTRADO</h3><p>Ajuste os filtros ou crie um novo modelo de referência.</p></div>';return}
 $('#reqList').innerHTML=list.map(r=>`<article class="req-card model-card" data-id="${esc(r.id)}"><div class="req-card-top"><div><span class="protocol">${r.builtin?'PADRÃO HIGH':'MODELO SALVO'}</span><h3>${esc(r.nome||r.assunto||requestTypeName(r.tipo))}</h3></div><span class="req-status s-concluida">${esc(requestTypeName(r.tipo))}</span></div><div class="req-meta">${esc(r.assunto||defaultSubject(r.tipo))}</div><p>${esc((r.detalhes||TYPE_PLACEHOLDERS[r.tipo]||'').slice(0,210))}</p><div class="req-footer"><span>${esc(r.origem||'Biblioteca High OS')}</span><button class="mini-btn generate-model" data-id="${esc(r.id)}">GERAR / COPIAR</button></div></article>`).join('');
 document.querySelectorAll('.generate-model').forEach(b=>b.onclick=e=>{e.stopPropagation();openRequestModal(b.dataset.id)});
 document.querySelectorAll('.model-card').forEach(c=>c.onclick=()=>openRequestModal(c.dataset.id));
}
function requestRoutePoints(){
 const d=$('#reqDetalhes')?.value||'';
 let pts=getDetailBlock('Blips da rota nova',d);
 if(!pts.length)pts=String(d).split(/\r?\n/).map(x=>x.trim()).filter(x=>/^\{?\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?(?:\s*,\s*-?\d+(?:\.\d+)?)?\s*\}?,?$/.test(x));
 return pts.map(x=>x.replace(/,$/,'').trim()).filter(Boolean);
}
function syncRouteRequestAction(){
 const box=$('#routeRequestSyncBox'),btn=$('#applyRouteRequestBtn');if(!box||!btn)return;
 const isRoute=$('#reqTipo')?.value==='ROTA_FARM',group=$('#reqGroup')?.value||'',pts=isRoute?requestRoutePoints():[];
 box.classList.toggle('hidden',!isRoute);
 const note=box.querySelector('span');
 if(!group){btn.disabled=true;btn.textContent='SELECIONE UM GROUP';if(note)note.textContent='Selecione o Group para conectar esta solicitação ao Perfil Técnico.';return}
 btn.disabled=!pts.length;btn.textContent=pts.length?`CRIAR SOLICITAÇÃO + SALVAR ${pts.length} CDS`:'ADICIONE AS CDS DO TAKEFARM';
 if(note)note.textContent=pts.length?`${pts.length} CDS detectadas. Esta é a exceção do fluxo: a Solicitação alimentará o Perfil Técnico e marcará a rota como EXCLUSIVA.`:'Cole abaixo as CDS recebidas pelo takefarm. Para os demais recursos, o fluxo continua Perfil → comparação → Solicitação.';
}
async function applyRouteRequestToProfile(){
 const group=$('#reqGroup')?.value||'',tipo=$('#reqTipo')?.value||'';if(tipo!=='ROTA_FARM')return;
 if(!group)return alert('Selecione o Group da rota.');
 const pts=requestRoutePoints();if(!pts.length)return alert('Não encontrei CDS válidas em “Blips da rota nova”.');
 const f=faccoes.find(x=>x.group===group);if(!f)return alert('Group não encontrado na base atual.');
 const oldT=mergedTechProfile(f),nextT=clonePlain(oldT);nextT.rota=nextT.rota||{};nextT.rota.nome=`RotaExclusiva${group}`;nextT.rota.pontos=pts.join('\n');nextT.rota.origem='SOLICITACAO_TAKEFARM';nextT.rota.atualizadoPor=currentUser.email;nextT.rota.atualizadoEm=new Date().toISOString();
 // O início/farm do Group não é substituído pelas 35 CDS: elas são somente os pontos da rota exclusiva.
 syncFarmWithCraft(nextT);
 const benefits={...(f.beneficios||{}),rotaExclusiva:true,rotaBlips:pts.join('\n')};
 try{
  await setDoc(doc(db,'highos','data','faccoes',group),{perfilTecnico:nextT,beneficios,updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true});
  await addDoc(histCol,{tipo:'ROTA_EXCLUSIVA_SOLICITADA',group,descricao:`Solicitação de rota exclusiva criada e Perfil Técnico alimentado automaticamente • ${pts.length} CDS do takefarm`,rotaPontos:pts,solicitacaoTexto:buildRequestText(),origem:'SOLICITACAO_TAKEFARM',usuario:currentUser.email,data:serverTimestamp()});
  await loadFaccoes();
  try{await copyRequestText()}catch{}
  if(typeof currentGroupProfile!=='undefined'&&currentGroupProfile?.group===group){const fresh=faccoes.find(x=>x.group===group);if(fresh){renderTechProfile(fresh);$('#fRotaExclusiva').checked=true;renderRouteOverview();}}
  alert(`Solicitação criada para ${group}.\n\n${pts.length} CDS do takefarm foram salvas no Perfil Técnico.\nA rota foi marcada como EXCLUSIVA e o texto foi copiado para o Discord.`);
 }catch(err){alert('Erro ao salvar a rota no perfil: '+err.message)}
}

async function saveRequestModel(e){
 e.preventDefault();
 const id=$('#reqId').value;
 const tipo=$('#reqTipo').value;
 const payload={isModelo:true,tipo,nome:$('#reqModelName').value.trim()||requestTypeName(tipo),assunto:$('#reqAssunto').value.trim()||defaultSubject(tipo),detalhes:$('#reqDetalhes').value.trim(),origem:'Biblioteca High OS',updatedAt:serverTimestamp(),updatedBy:currentUser.email};
 try{
   if(id){await setDoc(doc(db,'highos','data','solicitacoes',id),payload,{merge:true});await addDoc(histCol,{tipo:'MODELO_SOLICITACAO_EDITADO',solicitacaoId:id,descricao:payload.nome,usuario:currentUser.email,data:serverTimestamp()});}
   else{const ref=await addDoc(reqCol,{...payload,createdAt:serverTimestamp(),createdBy:currentUser.email});await addDoc(histCol,{tipo:'MODELO_SOLICITACAO_CRIADO',solicitacaoId:ref.id,descricao:payload.nome,usuario:currentUser.email,data:serverTimestamp()});}
   $('#reqModal').classList.add('hidden');await loadRequests();
 }catch(err){alert('Erro ao salvar modelo: '+err.message)}
}
async function copyRequestText(){const text=$('#reqPreview').value;try{await navigator.clipboard.writeText(text);const b=$('#copyReqBtn'),old=b.textContent;b.textContent='COPIADO ✓';setTimeout(()=>b.textContent=old,1400)}catch(e){$('#reqPreview').select();document.execCommand('copy')}}
function slug(v){return (v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-')}

initRequestUi();
const _loadFaccoesV3=loadFaccoes;
loadFaccoes=async function(){await _loadFaccoesV3();updateRequestGroupOptions($('#reqGroup')?.value||'');await loadRequests()};


// ===== HIGH OS V4 · GESTÃO DE USUÁRIOS =====
function initUsersUi(){
 const nb=$('#newUserBtn'); if(!nb)return;
 nb.onclick=()=>openUserModal();
 $('#userModalClose').onclick=()=>$('#userModal').classList.add('hidden');
 $('#userModal').addEventListener('click',e=>{if(e.target.id==='userModal')$('#userModal').classList.add('hidden')});
 $('#userSearch').addEventListener('input',renderUsers);
 $('#userRoleFilter').addEventListener('change',renderUsers);
 $('#userStatusFilter').addEventListener('change',renderUsers);
 $('#userForm').addEventListener('submit',saveUser);
 $('#toggleUserBtn').onclick=toggleUserAccess;
}
function assertAdmin(){if(String(currentProfile?.role||'').toUpperCase()!=='ADMIN'){alert('Apenas ADMIN pode gerenciar usuários.');return false}return true}
async function loadUsers(){
 if(!assertAdmin())return;
 try{
  const qs=await getDocs(usersCol);
  usuarios=qs.docs.map(d=>({email:d.id,...d.data()})).sort((a,b)=>(a.name||a.email).localeCompare(b.name||b.email,'pt-BR'));
  renderUsers();
 }catch(e){$('#userList').innerHTML=`<div class="placeholder"><h3>ERRO AO CARREGAR</h3><p>${esc(e.message)}</p></div>`}
}
function renderUsers(){
 if(!$('#userList'))return;
 const q=($('#userSearch').value||'').toLowerCase(), role=$('#userRoleFilter').value, st=$('#userStatusFilter').value;
 const list=usuarios.filter(u=>(!role||String(u.role||'CONSULTA').toUpperCase()===role)&&(!st||(st==='ATIVO'?u.active===true:u.active!==true))&&(!q||[u.name,u.email,u.role,u.notes].join(' ').toLowerCase().includes(q)));
 const ativos=usuarios.filter(u=>u.active===true).length, admins=usuarios.filter(u=>String(u.role||'').toUpperCase()==='ADMIN'&&u.active===true).length;
 $('#userStats').innerHTML=`<span><b>${usuarios.length}</b> CADASTRADOS</span><span><b>${ativos}</b> ATIVOS</span><span><b>${usuarios.length-ativos}</b> INATIVOS</span><span><b>${admins}</b> ADMINS</span><span><b>${list.length}</b> EXIBIDOS</span>`;
 if(!usuarios.length){$('#userList').innerHTML='<div class="placeholder"><b>♟</b><h3>NENHUM USUÁRIO</h3><p>Cadastre a primeira conta autorizada.</p></div>';return}
 $('#userList').innerHTML=list.map(u=>`<article class="user-row" data-email="${esc(u.email)}"><div class="user-avatar">${esc((u.name||u.email||'?').slice(0,1).toUpperCase())}</div><div class="user-main"><strong>${esc(u.name||'Sem nome')}</strong><span>${esc(u.email)}</span>${u.notes?`<small>${esc(u.notes)}</small>`:''}</div><div class="user-tags"><span class="role-chip r-${slug(u.role)}">${esc(String(u.role||'CONSULTA').toUpperCase())}</span><span class="status-chip ${u.active===true?'ativa':'inativa'}">${u.active===true?'ATIVO':'INATIVO'}</span></div><button class="mini-btn">EDITAR</button></article>`).join('');
 document.querySelectorAll('.user-row').forEach(r=>r.onclick=e=>{if(e.target.closest('button')||e.currentTarget===r)openUserModal(r.dataset.email)});
}
function openUserModal(email=''){
 if(!assertAdmin())return;
 const u=email?usuarios.find(x=>x.email===email):null;
 $('#userOriginalEmail').value=u?.email||'';
 $('#uEmail').value=u?.email||''; $('#uEmail').disabled=!!u;
 $('#uName').value=u?.name||''; $('#uRole').value=String(u?.role||'CONSULTA').toUpperCase(); $('#uActive').value=u?.active===false?'false':'true'; $('#uNotes').value=u?.notes||'';
 $('#userModalTitle').textContent=u?'EDITAR USUÁRIO':'NOVO USUÁRIO';
 $('#toggleUserBtn').style.display=u?'block':'none';
 $('#toggleUserBtn').textContent=u?.active===true?'DESATIVAR ACESSO':'REATIVAR ACESSO';
 $('#toggleUserBtn').className=u?.active===true?'btn-danger':'btn-secondary';
 $('#userModal').classList.remove('hidden');
}
async function saveUser(e){
 e.preventDefault(); if(!assertAdmin())return;
 const original=$('#userOriginalEmail').value.trim().toLowerCase(), email=$('#uEmail').value.trim().toLowerCase();
 if(!email){alert('Informe o e-mail Google.');return}
 const old=original?usuarios.find(x=>x.email===original):null;
 const payload={email,name:$('#uName').value.trim(),role:$('#uRole').value,active:$('#uActive').value==='true',notes:$('#uNotes').value.trim(),updatedAt:serverTimestamp(),updatedBy:currentUser.email};
 if(email===String(currentUser.email||'').toLowerCase() && payload.active!==true){alert('Você não pode desativar sua própria conta enquanto está logado.');return}
 try{
  await setDoc(doc(db,'users',email),payload,{merge:true});
  await addDoc(histCol,{tipo:old?'USUARIO_EDITADO':'USUARIO_CRIADO',usuarioAlvo:email,antes:snapshot(old),depois:snapshot(payload),usuario:currentUser.email,data:serverTimestamp()});
  $('#userModal').classList.add('hidden'); await loadUsers();
 }catch(err){alert('Erro ao salvar usuário: '+err.message)}
}
async function toggleUserAccess(){
 if(!assertAdmin())return;
 const email=$('#userOriginalEmail').value.trim().toLowerCase(), old=usuarios.find(x=>x.email===email); if(!old)return;
 if(email===String(currentUser.email||'').toLowerCase() && old.active===true){alert('Você não pode desativar sua própria conta enquanto está logado.');return}
 const next=old.active!==true;
 if(!confirm(`${next?'Reativar':'Desativar'} o acesso de ${old.name||email}?`))return;
 try{
  await setDoc(doc(db,'users',email),{...old,active:next,updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true});
  await addDoc(histCol,{tipo:next?'USUARIO_REATIVADO':'USUARIO_DESATIVADO',usuarioAlvo:email,usuario:currentUser.email,data:serverTimestamp()});
  $('#userModal').classList.add('hidden'); await loadUsers();
 }catch(err){alert('Erro ao alterar acesso: '+err.message)}
}
initUsersUi();

// ===== HIGH OS V5 · GROUP COMO PATRIMÔNIO + ENTREGA COMO VÍNCULO =====
let entregas=[];
const INSTALLATIONS=[
 ['vipOrg','VIP Org'],['chatFaccao','Chat da Facção'],['radio','Rádio Exclusiva'],['salario','Salário'],
 ['garagemVip','Garagem VIP'],['garagemPublica','Garagem Pública'],['heliponto','Heliponto'],['rotaExclusiva','Rota Exclusiva'],
 ['telao','Telão'],['lojaRoupas','Loja de Roupas'],['barbearia','Barbearia'],['tatuagem','Tatuagem'],['shopExclusivo','Shop Exclusivo'],
 ['bau','Baú'],['farm','Farm'],['craft','Craft'],['arena','Arena']
];
function renderDefaultDeliveryProfile(f){
 const p=f?.perfilEntrega||{}, b=f?.beneficios||{}, selected=new Set(p.beneficiosPadrao||[]);
 if($('#fPlanoPadrao'))$('#fPlanoPadrao').value=p.planoPadrao||'';
 if($('#fPerfilObs'))$('#fPerfilObs').value=p.observacao||'';
 if(!$('#fDefaultBenefits'))return;
 const available=INSTALLATIONS.filter(([k])=>isInstalled(b,k));
 $('#fDefaultBenefits').innerHTML=available.length?available.map(([k,n])=>`<label class="install-item install-toggle"><input type="checkbox" data-default-benefit="${k}" ${selected.has(k)?'checked':''}><span><b>${esc(n)}</b><small>${esc(installedValue(b,k))}</small></span></label>`).join(''):'<div class="delivery-no-change">Cadastre primeiro as instalações/setagens acima. O perfil padrão só pode ativar recursos existentes no Group.</div>';
 document.querySelectorAll('[data-default-benefit]').forEach(x=>x.addEventListener('change',updateDeliveryPreview));
}

function installedValue(b,k){
 if(k==='garagemVip') return [b.garagemVipBlip,b.garagemVipSpawn].filter(Boolean).join(' / ');
 if(k==='radio') return b.radio||''; if(k==='salario') return b.salario?`${b.salario} / ${b.salarioMinutos||40} min`:'';
 if(typeof b[k]==='boolean') return b[k]?'SIM':''; return b[k]||'';
}
function isInstalled(b,k){return !!installedValue(b||{},k)}
function installedCount(f){return INSTALLATIONS.filter(([k])=>isInstalled(f.beneficios||{},k)).length}

// V5 substitui a leitura visual de "Facções" por "Groups / QGs" sem quebrar a coleção legada.
renderFaccoes=function(){
 const q=($('#facSearch')?.value||'').toLowerCase(),seg=$('#facSegment')?.value||'',st=$('#facStatus')?.value||'',operacionais=faccoes.filter(f=>!f.removido);
 const filtered=operacionais.filter(f=>(!seg||f.segmento===seg)&&(!st||f.status===st)&&(!q||[f.group,f.faccao,f.qg,f.lider,f.staff,f.produto].join(' ').toLowerCase().includes(q)));
 const ocup=operacionais.filter(f=>f.status==='ATIVA').length,vagos=operacionais.length-ocup,inst=operacionais.reduce((n,f)=>n+installedCount(f),0);
 const segCounts={};operacionais.forEach(f=>{const k=f.segmento||'OUTROS';segCounts[k]=(segCounts[k]||0)+1});
 const maxSeg=Math.max(1,...Object.values(segCounts));
 if($('#facOverview'))$('#facOverview').innerHTML=`<div class="ops-kpis"><article class="ops-kpi purple"><span>GROUPS / QGs</span><b>${operacionais.length}</b><small>patrimônio técnico cadastrado</small></article><article class="ops-kpi good"><span>OCUPADOS</span><b>${ocup}</b><small>${operacionais.length?Math.round(ocup/operacionais.length*100):0}% da base em uso</small></article><article class="ops-kpi warn"><span>VAGOS</span><b>${vagos}</b><small>disponíveis para nova entrega</small></article><article class="ops-kpi"><span>INSTALAÇÕES</span><b>${inst}</b><small>recursos/setagens registrados</small></article></div><section class="ops-distribution"><div class="ops-distribution-head"><b>DISTRIBUIÇÃO POR SEGMENTO</b><span>BASE COMPLETA</span></div><div class="ops-bars">${Object.entries(segCounts).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="ops-bar-row"><span>${esc(k)}</span><div class="ops-track"><div class="ops-fill" style="width:${Math.max(4,v/maxSeg*100)}%"></div></div><b>${v}</b></div>`).join('')}</div></section>`;
 $('#facStats').innerHTML=`<span><b>${filtered.length}</b> EXIBIDOS</span>${seg?`<span>SEGMENTO <b>${esc(seg)}</b></span>`:''}${st?`<span>STATUS <b>${st==='ATIVA'?'OCUPADOS':'VAGOS'}</b></span>`:''}`;
 if(!operacionais.length){$('#facList').innerHTML='<div class="placeholder"><b>◆</b><h3>BASE AINDA NÃO IMPORTADA</h3><p>ADMIN: clique em “IMPORTAR BASE INICIAL”.</p></div>';return}
 if(!filtered.length){$('#facList').innerHTML='<div class="placeholder"><b>⌕</b><h3>NENHUM GROUP ENCONTRADO</h3><p>Ajuste a busca ou os filtros.</p></div>';return}
 $('#facList').innerHTML=filtered.map(f=>`<article class="fac-card" data-id="${f.id}"><div class="fac-card-head"><div><div class="group-kicker">${esc(f.segmento||'OUTROS')}</div><h3>${esc(f.group)}</h3></div><span class="status-chip ${f.status==='ATIVA'?'ativa':'inativa'}">${f.status==='ATIVA'?'OCUPADO':'VAGO'}</span></div><div class="fac-name">${esc(f.qg||'SEM LOCAL')}</div><div class="muted">Ocupante: <b>${esc(f.faccao||'— NENHUMA —')}</b>${f.lider?'<br>Líder: '+esc(f.lider):''}</div><div class="product">${esc(f.produto||'')}</div><div class="install-count">${installedCount(f)} instalações/setagens cadastradas no Group</div><div class="group-profile"><button class="mini-btn edit-group" data-id="${f.id}">PERFIL TÉCNICO</button><button class="btn-primary compact deliver-group" data-group="${esc(f.group)}">${f.status==='ATIVA'?'NOVA ENTREGA':'ENTREGAR GROUP'}</button></div></article>`).join('');
 document.querySelectorAll('.edit-group').forEach(b=>b.onclick=e=>{e.stopPropagation();openFac(b.dataset.id)});
 document.querySelectorAll('.deliver-group').forEach(b=>b.onclick=e=>{e.stopPropagation();openNewDelivery(b.dataset.group)});
};

function initDeliveryUi(){
 $('#newDeliveryBtn')?.addEventListener('click',()=>openNewDelivery()); $('#newDeliveryClose')?.addEventListener('click',()=>$('#newDeliveryModal').classList.add('hidden'));
 $('#newDeliveryModal')?.addEventListener('click',e=>{if(e.target.id==='newDeliveryModal')$('#newDeliveryModal').classList.add('hidden')});
 $('#dGroup')?.addEventListener('change',()=>fillDeliveryFromGroup($('#dGroup').value));
 ['dFaccao','dLider','dStaff','dData','dPlano','dNotes'].forEach(id=>$('#'+id)?.addEventListener('input',updateNewDeliveryPreview));
 $('#deliverySearch')?.addEventListener('input',renderDeliveries); $('#deliveryStatus')?.addEventListener('change',renderDeliveries);
 $('#copyDExtract')?.addEventListener('click',()=>copyText($('#dExtract').value,$('#copyDExtract'))); $('#copyDRequests')?.addEventListener('click',()=>copyText(currentDeliveryRequests().map((r,i)=>`===== ${i+1}. ${r.titulo.toUpperCase()} =====\n\n${r.texto}`).join('\n\n'),$('#copyDRequests')));
 $('#newDeliveryForm')?.addEventListener('submit',saveNewDelivery);
}

// HIGH OS V5.3 · FACÇÕES COMO ENTIDADE PRÓPRIA
function orgKey(name){return String(name||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'facção'}
function derivedOrganizations(){
 const map=new Map();
 organizacoes.forEach(o=>map.set(String(o.nome||o.id||'').toLowerCase(),{...o,source:'cadastro'}));
 faccoes.filter(f=>f.faccao).forEach(f=>{const k=String(f.faccao).toLowerCase(),old=map.get(k)||{};map.set(k,{...old,id:old.id||orgKey(f.faccao),nome:old.nome||f.faccao,lider:old.lider||f.lider||'',status:old.status||'ATIVA',groupAtual:f.group,segmentoAtual:f.segmento,qgAtual:f.qg,contato:old.contato||'',discord:old.discord||'',desde:old.desde||f.dataEntrega||'',observacoes:old.observacoes||'',source:old.source||'group'});});
 return [...map.values()].sort((a,b)=>(a.nome||'').localeCompare(b.nome||''));
}
async function loadOrganizations(){
 try{const qs=await getDocs(orgCol);organizacoes=qs.docs.map(d=>({id:d.id,...d.data()}));renderOrganizations();syncOrgOptions()}catch(e){if($('#orgList'))$('#orgList').innerHTML=`<div class="placeholder"><h3>ERRO AO CARREGAR</h3><p>${esc(e.message)}</p></div>`}
}
function syncOrgOptions(){const dl=$('#orgOptions');if(!dl)return;dl.innerHTML=derivedOrganizations().filter(o=>o.status!=='INATIVA').map(o=>`<option value="${esc(o.nome)}">${esc(o.groupAtual||'SEM GROUP')}</option>`).join('')}
function renderOrganizations(){
 if(!$('#orgList'))return;const all=derivedOrganizations(),q=($('#orgSearch')?.value||'').toLowerCase(),st=$('#orgStatus')?.value||'';
 const list=all.filter(o=>(!st||o.status===st)&&(!q||[o.nome,o.lider,o.groupAtual,o.segmentoAtual,o.contato,o.discord].join(' ').toLowerCase().includes(q)));
 const active=all.filter(o=>o.groupAtual&&o.status!=='INATIVA').length,sem=all.filter(o=>!o.groupAtual&&o.status!=='INATIVA').length,inativas=all.filter(o=>o.status==='INATIVA').length;
 const segCounts={};all.filter(o=>o.groupAtual).forEach(o=>{const k=o.segmentoAtual||'OUTROS';segCounts[k]=(segCounts[k]||0)+1});const maxSeg=Math.max(1,...Object.values(segCounts));
 if($('#orgOverview'))$('#orgOverview').innerHTML=`<div class="ops-kpis"><article class="ops-kpi purple"><span>FACÇÕES</span><b>${all.length}</b><small>organizações registradas</small></article><article class="ops-kpi good"><span>COM GROUP</span><b>${active}</b><small>ocupando patrimônio da cidade</small></article><article class="ops-kpi warn"><span>SEM GROUP</span><b>${sem}</b><small>ativas aguardando ocupação</small></article><article class="ops-kpi"><span>INATIVAS</span><b>${inativas}</b><small>mantidas apenas no histórico</small></article></div><section class="ops-distribution"><div class="ops-distribution-head"><b>OCUPAÇÃO POR SEGMENTO</b><span>FACÇÕES COM GROUP</span></div><div class="ops-bars">${Object.keys(segCounts).length?Object.entries(segCounts).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="ops-bar-row"><span>${esc(k)}</span><div class="ops-track"><div class="ops-fill" style="width:${Math.max(4,v/maxSeg*100)}%"></div></div><b>${v}</b></div>`).join(''):'<div class="muted">Nenhuma ocupação ativa.</div>'}</div></section>`;
 $('#orgStats').innerHTML=`<span><b>${list.length}</b> EXIBIDAS</span>${st?`<span>STATUS <b>${esc(st.replace('_',' '))}</b></span>`:''}`;
 $('#orgList').innerHTML=list.length?list.map(o=>`<article class="org-card" data-org="${esc(o.id||orgKey(o.nome))}"><div class="org-card-head"><div><div class="group-kicker">${esc(o.segmentoAtual||'ORGANIZAÇÃO')}</div><h3>${esc(o.nome||'SEM NOME')}</h3></div><span class="status-chip ${o.groupAtual?'ativa':'inativa'}">${o.groupAtual?'OCUPANDO':'SEM GROUP'}</span></div><div class="org-group-link"><span>GROUP ATUAL</span><b>${esc(o.groupAtual||'—')}</b><small>${esc(o.qgAtual||'')}</small></div><div class="muted">${o.lider?'Líder: '+esc(o.lider):'Liderança não cadastrada'}${o.contato?'<br>Contato: '+esc(o.contato):''}</div><button class="mini-btn open-org" data-name="${esc(o.nome)}">PERFIL DA FACÇÃO</button></article>`).join(''):'<div class="placeholder"><b>♜</b><h3>NENHUMA FACÇÃO ENCONTRADA</h3><p>Ajuste a busca ou os filtros.</p></div>';
 document.querySelectorAll('.open-org').forEach(b=>b.onclick=e=>{e.stopPropagation();openOrganizationByName(b.dataset.name)});
}

async function orgHistory(name){
 try{const qs=await getDocs(histCol),key=String(name||'').toLowerCase();return qs.docs.map(d=>({id:d.id,...d.data()})).filter(h=>String(h.faccao||h.depois?.faccao||h.antes?.faccao||'').toLowerCase()===key).sort((a,b)=>historyMillis(b)-historyMillis(a)).slice(0,8)}catch{return[]}
}
async function openOrganizationByName(name=''){
 const o=derivedOrganizations().find(x=>String(x.nome).toLowerCase()===String(name).toLowerCase())||{id:'',nome:name,status:'SEM_GROUP'};
 $('#orgId').value=o.id||'';$('#oNome').value=o.nome||'';$('#oStatus').value=o.status|| (o.groupAtual?'ATIVA':'SEM_GROUP');$('#oLider').value=o.lider||'';$('#oContato').value=o.contato||'';$('#oDiscord').value=o.discord||'';$('#oDesde').value=o.desde||'';$('#oObs').value=o.observacoes||'';$('#orgModalTitle').textContent=o.nome||'NOVA FACÇÃO';
 const current=faccoes.find(f=>String(f.faccao||'').toLowerCase()===String(o.nome||'').toLowerCase());
 $('#orgProfileSummary').innerHTML=`<div><span>STATUS</span><b>${esc(current?'COM GROUP':(o.status||'SEM GROUP'))}</b></div><div><span>GROUP ATUAL</span><b>${esc(current?.group||'—')}</b></div><div><span>SEGMENTO</span><b>${esc(current?.segmento||'—')}</b></div><div><span>QG</span><b>${esc(current?.qg||'—')}</b></div>`;
 $('#orgCurrentGroup').innerHTML=current?`<div class="eyebrow">OCUPAÇÃO ATUAL</div><strong>${esc(current.group)} • ${esc(current.qg||'')}</strong><span>${esc(current.produto||'')}</span>`:'<div class="delivery-no-change">Esta facção não ocupa nenhum Group atualmente.</div>';
 $('#orgHistoryPreview').innerHTML='<div class="delivery-no-change">Carregando histórico...</div>';$('#orgModal').classList.remove('hidden');
 const hist=await orgHistory(o.nome);$('#orgHistoryPreview').innerHTML=hist.length?hist.map(h=>`<div class="group-history-item"><i></i><div><b>${esc(historyTitle(h))}</b><span>${esc(h.group||'')} • ${esc(formatHistoryDate(h))}</span></div></div>`).join(''):'<div class="delivery-no-change">Ainda não há eventos registrados para esta organização.</div>';
}
$('#newOrgBtn')?.addEventListener('click',()=>openOrganizationByName(''));
$('#orgModalClose')?.addEventListener('click',()=>$('#orgModal').classList.add('hidden'));
['orgSearch','orgStatus'].forEach(id=>$('#'+id)?.addEventListener(id==='orgSearch'?'input':'change',renderOrganizations));
$('#orgForm')?.addEventListener('submit',async e=>{e.preventDefault();const nome=$('#oNome').value.trim();if(!nome)return;const id=$('#orgId').value||orgKey(nome),current=faccoes.find(f=>String(f.faccao||'').toLowerCase()===nome.toLowerCase());const data={nome,status:current?'ATIVA':$('#oStatus').value,lider:$('#oLider').value.trim(),contato:$('#oContato').value.trim(),discord:$('#oDiscord').value.trim(),desde:$('#oDesde').value.trim(),observacoes:$('#oObs').value.trim(),groupAtual:current?.group||'',segmentoAtual:current?.segmento||'',qgAtual:current?.qg||'',updatedAt:serverTimestamp(),updatedBy:currentUser.email};try{await setDoc(doc(db,'highos','data','organizacoes',id),data);await addDoc(histCol,{tipo:'ORGANIZACAO',faccao:nome,group:current?.group||'',descricao:`Cadastro da facção ${nome} atualizado`,usuario:currentUser.email,data:serverTimestamp()});$('#orgModal').classList.add('hidden');await loadOrganizations()}catch(err){alert('Erro ao salvar facção: '+err.message)}});
async function upsertOrganizationFromDelivery(payload,f){
 const id=orgKey(payload.faccao),existing=derivedOrganizations().find(o=>String(o.nome).toLowerCase()===payload.faccao.toLowerCase())||{};
 await setDoc(doc(db,'highos','data','organizacoes',id),{nome:payload.faccao,status:'ATIVA',lider:payload.lider||existing.lider||'',contato:existing.contato||'',discord:existing.discord||'',desde:existing.desde||payload.dataEntrega||'',observacoes:existing.observacoes||'',groupAtual:f.group,segmentoAtual:f.segmento||'',qgAtual:f.qg||'',updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true});
}
async function loadDeliveries(){
 try{const qs=await getDocs(deliveryCol);entregas=qs.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(b.createdAtText||b.dataEntrega||'').localeCompare(String(a.createdAtText||a.dataEntrega||'')));renderDeliveries()}catch(e){if($('#deliveryList'))$('#deliveryList').innerHTML=`<div class="placeholder"><h3>ERRO AO CARREGAR</h3><p>${esc(e.message)}</p></div>`}
}
function renderDeliveries(){
 if(!$('#deliveryList'))return;const q=($('#deliverySearch').value||'').toLowerCase(),st=$('#deliveryStatus').value;
 const list=entregas.filter(d=>(!st||d.status===st)&&(!q||[d.group,d.faccao,d.lider,d.staff,d.dataEntrega].join(' ').toLowerCase().includes(q)));
 const at=entregas.filter(d=>d.status==='ATIVA').length;$('#deliveryStats').innerHTML=`<span><b>${entregas.length}</b> REGISTROS</span><span><b>${at}</b> ATIVOS</span><span><b>${list.length}</b> EXIBIDOS</span>`;
 $('#deliveryList').innerHTML=list.length?list.map(d=>`<article class="delivery-row"><div><div class="group-kicker">GROUP</div><strong>${esc(d.group)}</strong></div><div><span>${esc(d.faccao||'—')}</span><small>${esc(d.qg||'')} ${d.plano?'• '+esc(d.plano):''}</small></div><div><strong>${esc(d.dataEntrega||'—')}</strong><small>${esc(d.staff||'')}</small></div><span class="status-chip ${d.status==='ATIVA'?'ativa':'inativa'}">${esc(d.status||'ATIVA')}</span></article>`).join(''):'<div class="placeholder"><b>◇</b><h3>NENHUMA ENTREGA REGISTRADA</h3><p>Use “Nova Entrega” ou entregue diretamente pelo card de um Group.</p></div>';
}
function openNewDelivery(group=''){
 const sel=$('#dGroup');sel.innerHTML='<option value="">SELECIONE O GROUP</option>'+faccoes.filter(f=>!f.removido).map(f=>`<option value="${esc(f.group)}">${esc(f.group)} — ${esc(f.qg||'SEM LOCAL')} ${f.status==='ATIVA'?'['+esc(f.faccao||'OCUPADO')+']':'[VAGO]'}</option>`).join('');
 $('#newDeliveryForm').reset();if(group){sel.value=group;fillDeliveryFromGroup(group)}else{$('#dInstalled').innerHTML='<div class="delivery-no-change">Selecione um Group.</div>';$('#dActive').innerHTML='';updateNewDeliveryPreview()};$('#newDeliveryModal').classList.remove('hidden');
}
function fillDeliveryFromGroup(group){
 const f=faccoes.find(x=>x.group===group);if(!f)return;const b=f.beneficios||{};
 $('#dInstalled').innerHTML=INSTALLATIONS.map(([k,n])=>{const v=installedValue(b,k);return `<div class="install-item"><b>${esc(n)}</b><small>${v?esc(v):'Não cadastrado'}</small></div>`}).join('');
 const p=f.perfilEntrega||{}, defaults=new Set(p.beneficiosPadrao||[]), available=INSTALLATIONS.filter(([k])=>isInstalled(b,k));
 $('#dActive').innerHTML=available.map(([k,n])=>`<label class="install-item install-toggle"><input type="checkbox" data-delivery-benefit="${k}" ${defaults.size?(defaults.has(k)?'checked':''):'checked'}><span><b>${esc(n)}</b><small>${esc(installedValue(b,k))}</small></span></label>`).join('')||'<div class="delivery-no-change">Este Group ainda não possui instalações cadastradas. Cadastre no Perfil Técnico.</div>';
 document.querySelectorAll('[data-delivery-benefit]').forEach(x=>x.addEventListener('change',updateNewDeliveryPreview));
 $('#dPlano').value=p.planoPadrao||'';if(p.observacao&&!$('#dNotes').value)$('#dNotes').value=p.observacao;
 $('#dStaff').value=currentProfile?.name||currentUser?.displayName||'';updateNewDeliveryPreview();
}
function selectedDeliveryBenefits(){return [...document.querySelectorAll('[data-delivery-benefit]:checked')].map(x=>x.dataset.deliveryBenefit)}
function deliveryExtractV5(){
 const f=faccoes.find(x=>x.group===$('#dGroup').value), active=selectedDeliveryBenefits();if(!f)return '';
 const b=f.beneficios||{}, lines=['ENTREGA DE ORGANIZAÇÃO — HIGH ILEGAL','',`Group: ${f.group}`,`QG / Local: ${f.qg||'—'}`,`Segmento: ${f.segmento||'—'}`,`Facção: ${$('#dFaccao').value.trim()||'{FACÇÃO}'}`,`Líder: ${$('#dLider').value.trim()||'{LÍDER}'}`,`Staff responsável: ${$('#dStaff').value.trim()||'{STAFF}'}`,`Data: ${$('#dData').value.trim()||'{DATA}'}`];
 if($('#dPlano').value.trim())lines.push(`Plano / Pacote: ${$('#dPlano').value.trim()}`);lines.push('','BENEFÍCIOS / SETAGENS ENTREGUES:');
 if(!active.length)lines.push('- Nenhum benefício selecionado'); else active.forEach(k=>{const n=INSTALLATIONS.find(x=>x[0]===k)?.[1]||k;lines.push(`- ${n}${installedValue(b,k)&&!['vipOrg','chatFaccao','rotaExclusiva','telao','garagemPublica','heliponto'].includes(k)?`: ${installedValue(b,k)}`:''}`)});
 if($('#dNotes').value.trim())lines.push('','PERSONALIZAÇÕES / ALTERAÇÕES:',$('#dNotes').value.trim());return lines.join('\n');
}
function currentDeliveryRequests(){
 const f=faccoes.find(x=>x.group===$('#dGroup').value);if(!f)return[];const b=f.beneficios||{},a=selectedDeliveryBenefits(),has=k=>a.includes(k),R=[],add=(tipo,titulo,texto)=>R.push({tipo,titulo,texto});
 const vipKeys=['vipOrg','chatFaccao','radio','salario','garagemVip','lojaRoupas','barbearia','tatuagem','shopExclusivo','bau','farm','craft','arena'];
 if(a.some(k=>vipKeys.includes(k))){let L=['Assunto: Ativação de benefícios de uma organização e alguns blips','','Solicitação:','','- Ativação de benefícios de uma organização e alguns blips',`- Group: ${f.group}`];if(has('salario')&&b.salario)L.push('',`- Ativar salário de ${b.salario} (A cada ${b.salarioMinutos||40} minutos)`);if(has('radio')&&b.radio)L.push('',`- Ativar Rádio exclusiva: ${b.radio}`);if(has('chatFaccao'))L.push('','- Chat Facção.');if(has('garagemVip'))L.push('','- Ativar Garagem VIP:',`- Blip: ${fmtCds(b.garagemVipBlip)}`,`- Spawn: ${fmtCds(b.garagemVipSpawn)}`,b.garagemVipVeiculos?`- Veículos: ${b.garagemVipVeiculos}`:'');[['lojaRoupas','Loja de roupas'],['barbearia','Barbearia'],['tatuagem','Tatuagem'],['shopExclusivo','Shop Exclusivo'],['bau','Baú'],['farm','Farm'],['craft','Craft'],['arena','Arena']].forEach(([k,n])=>{if(has(k)&&b[k])L.push('',`- ${n}: ${fmtCds(b[k])}`)});add('BENEFICIOS','VIP Org / Benefícios e Setagens',L.filter(x=>x!==undefined).join('\n'))}
 if(has('rotaExclusiva')){const pts=(b.rotaBlips||'').split(/\r?\n/).filter(Boolean);add('ROTA_FARM','Rota de Farm Exclusiva',['Assunto: Ativação de rota de farm exclusiva','','Solicitação:','','- Ativação de rota de farm exclusiva',`- Group: ${f.group}`,'','- Blips da rota nova:','',...(pts.length?pts:['{ CDS },'])].join('\n'))}
 if(has('telao'))add('TELAO','Telão da Organização',['Assunto: Ativação de Telão Hall em uma Organização Ilegal','','Solicitação:','','- Ativação de Telão Hall em uma Organização Ilegal.','',`- Group: ${f.group}`,`- Telão usado: ${b.telaoNome||'{modelo_do_telao}'}`,'',`- Local/Coordenadas postit: ${fmtCds(b.telaoPostit)}`,`- Local/Coordenadas cds: ${fmtCds(b.telaoCds)}`].join('\n'));
 if(has('garagemPublica'))add('GARAGEM','Garagem Pública',['Assunto:','','- Solicitaçao de Garagem Publica;','','Solicitaçao:','','- Adicione uma garagem publica na CDS abaixo:','',`* Blip: ${fmtCds(b.garagemPublicaBlip)}`,`* Spawn: ${fmtCds(b.garagemPublicaSpawn)}`,'',`- Permissao : ${f.group}`].join('\n'));
 if(has('heliponto'))add('HELIPONTO','Heliponto',['Assunto: Adição de Heliponto','','Solicitação:','- Adicione um Heliponto na cds abaixo;',`- ${fmtCds(b.helipontoBlip)}`,b.helipontoSpawn?`- Spawn: ${fmtCds(b.helipontoSpawn)}`:'','',`- Group: ${f.group}.`].join('\n'));
 if($('#dNotes').value.trim())add('GERAL','Personalização / Alteração estrutural',['Assunto: Alteração / personalização de estrutura do QG','','Solicitação:','',`- Group: ${f.group}`,'', $('#dNotes').value.trim()].join('\n'));
 return R;
}
function updateNewDeliveryPreview(){if(!$('#dExtract'))return;$('#dExtract').value=deliveryExtractV5();const rs=currentDeliveryRequests();$('#dRequests').innerHTML=rs.length?rs.map((r,i)=>`<article class="delivery-request-card"><div><b>${i+1}. ${esc(r.titulo)}</b><span>${esc(r.tipo)}</span></div><pre>${esc(r.texto)}</pre></article>`).join(''):'<div class="delivery-no-change">Selecione o Group e os benefícios que serão ativados.</div>'}
async function copyText(text,btn){if(!text)return alert('Não há conteúdo para copiar.');try{await navigator.clipboard.writeText(text);const o=btn.textContent;btn.textContent='COPIADO ✓';setTimeout(()=>btn.textContent=o,1300)}catch(e){alert('Não foi possível copiar automaticamente.')}}
async function saveNewDelivery(e){
 e.preventDefault();const f=faccoes.find(x=>x.group===$('#dGroup').value);if(!f)return alert('Selecione um Group.');const faccao=$('#dFaccao').value.trim();if(!faccao)return alert('Informe a facção que está assumindo.');const active=selectedDeliveryBenefits(),requests=currentDeliveryRequests(),extract=deliveryExtractV5();
 const payload={group:f.group,qg:f.qg||'',segmento:f.segmento||'',faccao,lider:$('#dLider').value.trim(),staff:$('#dStaff').value.trim(),dataEntrega:$('#dData').value.trim(),plano:$('#dPlano').value.trim(),beneficiosAtivos:active,personalizacoes:$('#dNotes').value.trim(),solicitacoesGeradas:requests,extrato:extract,status:'ATIVA',createdAt:serverTimestamp(),createdAtText:new Date().toISOString(),createdBy:currentUser.email};
 try{
  // encerra logicamente a ocupação anterior no Group e mantém a estrutura física do local.
  const previous=entregas.filter(x=>x.group===f.group&&x.status==='ATIVA');for(const d of previous)await setDoc(doc(db,'highos','data','entregas',d.id),{...d,status:'RECOLHIDA',recolhidaEm:serverTimestamp(),recolhidaPor:currentUser.email},{merge:true});
  await addDoc(deliveryCol,payload);await setDoc(doc(db,'highos','data','faccoes',f.group),{...f,status:'ATIVA',faccao,lider:payload.lider,staff:payload.staff,dataEntrega:payload.dataEntrega,ocupacaoAtual:{faccao,lider:payload.lider,staff:payload.staff,dataEntrega:payload.dataEntrega,plano:payload.plano,beneficiosAtivos:active},updatedAt:serverTimestamp(),updatedBy:currentUser.email});await upsertOrganizationFromDelivery(payload,f);
  await addDoc(histCol,{tipo:'ENTREGA_GROUP',group:f.group,faccao,solicitacoesGeradas:requests,extrato:extract,usuario:currentUser.email,data:serverTimestamp()});$('#newDeliveryModal').classList.add('hidden');await loadFaccoes();await loadDeliveries();alert('Entrega registrada. A estrutura permanente do Group foi preservada.');
 }catch(err){alert('Erro ao concluir entrega: '+err.message)}
}
initDeliveryUi();
const _loadFaccoesV5=loadFaccoes;loadFaccoes=async function(){await _loadFaccoesV5();renderFaccoes();await loadDeliveries()};

// ===== HIGH OS V5.1 · PERFIL TÉCNICO + MEMÓRIA OPERACIONAL DO GROUP =====
let historico=[];
function historyDateValue(h){
 const d=h?.data;
 try{if(d?.toDate)return d.toDate();if(d?.seconds)return new Date(d.seconds*1000);if(h?.createdAtText)return new Date(h.createdAtText)}catch(e){}
 return null;
}
function formatHistoryDate(h){const d=historyDateValue(h);return d&&!isNaN(d)?d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):'—'}
function historyFamily(tipo=''){
 const t=String(tipo).toUpperCase();
 if(t.includes('RECOLH'))return 'RECOLHIMENTO';
 if(t.includes('ENTREGA'))return 'ENTREGA';
 if(t.includes('USUARIO'))return 'USUARIO';
 if(t.includes('SOLICIT')||t.includes('MODELO'))return 'MODELO_SOLICITACAO';
 if(t.includes('EDICAO')||t.includes('ALTER'))return 'EDICAO';
 return t;
}
function historyTitle(h){
 const fam=historyFamily(h.tipo);
 if(fam==='ENTREGA')return `Entrega ${h.group||''}${h.faccao?' → '+h.faccao:''}`.trim();
 if(h.tipo==='ORGANIZACAO')return `Cadastro da facção ${h.faccao||''}`.trim();
 if(fam==='RECOLHIMENTO')return `Recolhimento ${h.group||''}`.trim();
 if(fam==='EDICAO')return `Alteração no perfil técnico ${h.group||''}`.trim();
 if(fam==='USUARIO')return `Acesso / usuário ${h.usuarioAlvo||''}`.trim();
 if(fam==='MODELO_SOLICITACAO')return `Biblioteca de solicitações`;
 if(String(h.tipo||'').toUpperCase()==='IMPORTACAO_INICIAL')return 'Importação da base inicial';
 return String(h.tipo||'Evento').replaceAll('_',' ');
}
function changedSummary(h){
 const a=h?.antes||{},d=h?.depois||{}; const out=[];
 const keys=[['qg','QG'],['cds','CDS principal'],['produto','Produto'],['faccao','Facção'],['lider','Líder'],['staff','Staff'],['status','Status']];
 keys.forEach(([k,n])=>{if(String(a[k]??'')!==String(d[k]??''))out.push(`${n}: ${a[k]||'—'} → ${d[k]||'—'}`)});
 const ab=a.beneficios||{},db=d.beneficios||{};
 const names={vipOrg:'VIP Org',chatFaccao:'Chat Facção',radio:'Rádio',salario:'Salário',garagemVipBlip:'Garagem VIP',garagemPublicaBlip:'Garagem Pública',helipontoBlip:'Heliponto',rotaExclusiva:'Rota Exclusiva',telao:'Telão',lojaRoupas:'Loja de roupas',barbearia:'Barbearia',tatuagem:'Tatuagem',shopExclusivo:'Shop',bau:'Baú',farm:'Farm',craft:'Craft',arena:'Arena'};
 Object.keys(names).forEach(k=>{if(JSON.stringify(ab[k]??'')!==JSON.stringify(db[k]??''))out.push(`${names[k]} alterado`)});
 return out.slice(0,5);
}
async function loadHistory(){
 if(!$('#historyList')&&!$('#groupHistoryPreview'))return;
 try{
  const qs=await getDocs(histCol);historico=qs.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(historyDateValue(b)?.getTime()||0)-(historyDateValue(a)?.getTime()||0));renderHistory();
 }catch(e){if($('#historyList'))$('#historyList').innerHTML=`<div class="placeholder"><h3>ERRO AO CARREGAR</h3><p>${esc(e.message)}</p></div>`}
}
function renderHistory(){
 if(!$('#historyList'))return;
 const q=($('#historySearch')?.value||'').toLowerCase(),type=$('#historyType')?.value||'';
 const list=historico.filter(h=>(!type||historyFamily(h.tipo)===type||String(h.tipo||'')===type)&&(!q||[h.tipo,h.group,h.faccao,h.usuario,h.usuarioAlvo,h.descricao,JSON.stringify(h.depois||{})].join(' ').toLowerCase().includes(q)));
 const deliveries=historico.filter(h=>historyFamily(h.tipo)==='ENTREGA').length,recol=historico.filter(h=>historyFamily(h.tipo)==='RECOLHIMENTO').length,edits=historico.filter(h=>historyFamily(h.tipo)==='EDICAO').length;
 $('#historyStats').innerHTML=`<span><b>${historico.length}</b> EVENTOS</span><span><b>${deliveries}</b> ENTREGAS</span><span><b>${recol}</b> RECOLHIMENTOS</span><span><b>${edits}</b> ALTERAÇÕES</span><span><b>${list.length}</b> EXIBIDOS</span>`;
 if(!list.length){$('#historyList').innerHTML='<div class="placeholder"><b>◷</b><h3>NENHUM EVENTO ENCONTRADO</h3><p>Altere os filtros ou registre uma nova operação.</p></div>';return}
 $('#historyList').innerHTML=list.map(h=>{const changes=changedSummary(h);return `<article class="history-row"><div class="history-icon h-${historyFamily(h.tipo).toLowerCase()}">◷</div><div class="history-main"><div class="history-top"><strong>${esc(historyTitle(h))}</strong><span>${esc(formatHistoryDate(h))}</span></div><div class="history-meta">${h.group?`<b>${esc(h.group)}</b>`:''}${h.faccao?` • ${esc(h.faccao)}`:''}${h.usuario?` • por ${esc(h.usuario)}`:''}</div>${h.descricao?`<p>${esc(h.descricao)}</p>`:''}${changes.length?`<div class="history-changes">${changes.map(x=>`<span>${esc(x)}</span>`).join('')}</div>`:''}${Array.isArray(h.solicitacoesGeradas)&&h.solicitacoesGeradas.length?`<small>${h.solicitacoesGeradas.length} solicitação(ões) técnica(s) gerada(s)</small>`:''}</div></article>`}).join('');
}
function renderGroupProfileMemory(f){
 if(!f)return;const b=f.beneficios||{},installed=INSTALLATIONS.filter(([k])=>isInstalled(b,k));
 if($('#groupProfileSummary'))$('#groupProfileSummary').innerHTML=`<div><span>STATUS</span><b class="${f.status==='ATIVA'?'online':''}">${f.status==='ATIVA'?'OCUPADO':'VAGO'}</b></div><div><span>OCUPANTE ATUAL</span><b>${esc(f.faccao||'—')}</b></div><div><span>QG / LOCAL</span><b>${esc(f.qg||'SEM LOCAL')}</b></div><div><span>INSTALAÇÕES</span><b>${installed.length}</b></div>`;
 const hs=historico.filter(h=>h.group===f.group).slice(0,6),box=$('#groupHistoryPreview');if(!box)return;
 box.innerHTML=hs.length?hs.map(h=>`<div class="group-history-item"><i></i><div><b>${esc(historyTitle(h))}</b><span>${esc(formatHistoryDate(h))}${h.usuario?' • '+esc(h.usuario):''}</span></div></div>`).join(''):'<div class="delivery-no-change">Ainda não há eventos registrados para este Group.</div>';
}
$('#historySearch')?.addEventListener('input',renderHistory);$('#historyType')?.addEventListener('change',renderHistory);
const _openFacV51=openFac;openFac=function(id){_openFacV51(id);renderGroupProfileMemory(faccoes.find(x=>x.id===id))};
const _loadFaccoesV51=loadFaccoes;loadFaccoes=async function(){await _loadFaccoesV51();await loadHistory();await loadOrganizations()};

// ===== HIGH OS V5.2 · PERFIL PADRÃO DE ENTREGA POR GROUP =====

// ===== HIGH OS V5.4 · ALVESINHO OPERACIONAL =====
function alvesNorm(v=''){return String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
function alvesFindGroup(text=''){
 const n=alvesNorm(text);return faccoes.find(f=>n.includes(alvesNorm(f.group)))||faccoes.find(f=>n.includes(alvesNorm(f.qg||''))&&String(f.qg||'').length>2)||null;
}
function alvesFindOrg(text=''){
 const n=alvesNorm(text);return organizacoes.find(o=>n.includes(alvesNorm(o.nome)))||faccoes.map(f=>({nome:f.faccao,groupAtual:f.group,segmentoAtual:f.segmento,qgAtual:f.qg,lider:f.lider,status:f.status==='ATIVA'?'ATIVA':'SEM_GROUP'})).find(o=>o.nome&&n.includes(alvesNorm(o.nome)))||null;
}
function alvesInstalledLines(f){
 const b=f?.beneficios||{};const lines=[];
 INSTALLATIONS.forEach(([k,n])=>{if(isInstalled(b,k))lines.push(`${n}: ${installedValue(b,k)||'SIM'}`)});
 if(b.garagemVipBlip||b.garagemVipSpawn)lines.push(`Garagem VIP: Blip ${b.garagemVipBlip||'—'} | Spawn ${b.garagemVipSpawn||'—'}`);
 if(b.garagemPublicaBlip||b.garagemPublicaSpawn)lines.push(`Garagem Pública: Blip ${b.garagemPublicaBlip||'—'} | Spawn ${b.garagemPublicaSpawn||'—'}`);
 if(b.helipontoBlip||b.helipontoSpawn)lines.push(`Heliponto: Blip ${b.helipontoBlip||'—'} | Spawn ${b.helipontoSpawn||'—'}`);
 return [...new Set(lines)];
}
function alvesLastHistory(group,limit=5){return historico.filter(h=>alvesNorm(h.group)===alvesNorm(group)).slice(0,limit)}
function alvesDateFromDelivery(d){return d?.dataEntrega||(()=>{try{return d?.createdAt?.toDate?.().toLocaleDateString('pt-BR')||''}catch{return''}})()||'—'}
function alvesAnswer(question=''){
 const q=alvesNorm(question),g=alvesFindGroup(question),o=alvesFindOrg(question);
 if(!q)return {text:'Digite uma pergunta sobre a base operacional.'};

 if(q.includes('resumo')&&(q.includes('operacional')||q.includes('geral'))){
  const occupied=faccoes.filter(f=>f.status==='ATIVA').length,vagos=faccoes.length-occupied,ativas=organizacoes.filter(x=>x.status==='ATIVA').length,sem=organizacoes.filter(x=>x.status==='SEM_GROUP').length,del=entregas.filter(x=>x.status==='ATIVA').length;
  return {text:`Resumo operacional atual:\n• ${faccoes.length} Groups cadastrados: ${occupied} ocupados e ${vagos} vagos.\n• ${organizacoes.length} facções cadastradas: ${ativas} ativas e ${sem} sem Group.\n• ${del} entregas ativas registradas.\n• ${historico.length} eventos no histórico.`,refs:['Groups/QGs','Facções','Entregas','Histórico']};
 }
 if((q.includes('group')||q.includes('groups'))&&(q.includes('vago')||q.includes('livre'))){
  const list=faccoes.filter(f=>f.status!=='ATIVA');return {text:list.length?`Groups vagos (${list.length}):\n${list.map(f=>`• ${f.group} — ${f.qg||'sem QG informado'} (${f.segmento||'OUTROS'})`).join('\n')}`:'Não há Groups vagos cadastrados.',refs:['Groups/QGs']};
 }
 if(q.includes('facc')&&(q.includes('sem group')||q.includes('sem qg')||q.includes('sem local'))){
  const list=organizacoes.filter(x=>x.status==='SEM_GROUP'||!x.groupAtual);return {text:list.length?`Facções sem Group (${list.length}):\n${list.map(x=>`• ${x.nome}${x.lider?' — líder: '+x.lider:''}`).join('\n')}`:'Não há facções sem Group cadastradas.',refs:['Facções']};
 }
 if((q.includes('ultima')||q.includes('recent'))&&q.includes('entrega')){
  const list=entregas.slice(0,6);return {text:list.length?`Últimas entregas registradas:\n${list.map(d=>`• ${d.group} → ${d.faccao||'—'} | ${alvesDateFromDelivery(d)} | ${d.status||'—'}`).join('\n')}`:'Ainda não há entregas registradas.',refs:['Entregas']};
 }
 if(g&&(q.includes('quem ocupa')||q.includes('ocupante')||q.includes('qual fac')||q.includes('faccao'))){
  return {text:g.status==='ATIVA'&&g.faccao?`${g.group} está ocupado por ${g.faccao}.${g.lider?` Líder cadastrado: ${g.lider}.`:''}${g.qg?` QG/local: ${g.qg}.`:''}`:`${g.group} está vago no momento.${g.qg?` Local cadastrado: ${g.qg}.`:''}`,refs:[g.group,'Groups/QGs']};
 }
 if(g&&(q.includes('instalad')||q.includes('estrutura')||q.includes('beneficio')||q.includes('tem no')||q.includes('possui')||q.startsWith('o que'))){
  const lines=alvesInstalledLines(g);return {text:`${g.group} — ${g.qg||'QG sem nome'}\nStatus: ${g.status==='ATIVA'?'ocupado por '+(g.faccao||'—'):'vago'}\n${lines.length?'Estrutura/setagens cadastradas:\n'+lines.map(x=>'• '+x).join('\n'):'Nenhuma instalação/setagem foi cadastrada nesse Group ainda.'}`,refs:[g.group,'Perfil Técnico']};
 }
 if((g||o)&&q.includes('radio')){
  const target=g||faccoes.find(f=>alvesNorm(f.faccao)===alvesNorm(o?.nome));const radio=target?.beneficios?.radio||'';
  return {text:target?(radio?`O rádio cadastrado para ${target.faccao||target.group} no ${target.group} é ${radio}.`:`${target.group}${target.faccao?' / '+target.faccao:''} não possui número de rádio cadastrado no Perfil Técnico.`):`Encontrei a facção ${o?.nome||''}, mas ela não está vinculada a um Group com rádio cadastrado.`,refs:[target?.group||o?.nome,'Perfil Técnico']};
 }
 if(g&&(q.includes('histor')||q.includes('mudanc')||q.includes('alterac'))){
  const hs=alvesLastHistory(g.group,6);return {text:hs.length?`Histórico recente de ${g.group}:\n${hs.map(h=>`• ${formatHistoryDate(h)} — ${historyTitle(h)}${h.usuario?' — '+h.usuario:''}`).join('\n')}`:`Ainda não há eventos no histórico de ${g.group}.`,refs:[g.group,'Histórico']};
 }
 if(g&&q.includes('solicit')){
  const ds=entregas.filter(d=>d.group===g.group&&Array.isArray(d.solicitacoesGeradas)&&d.solicitacoesGeradas.length).slice(0,3);const reqs=ds.flatMap(d=>d.solicitacoesGeradas.map(r=>({d,r}))).slice(0,8);
  return {text:reqs.length?`Solicitações recentes geradas para ${g.group}:\n${reqs.map(x=>`• ${x.r.titulo||x.r.tipo||'Solicitação'} — entrega ${x.d.faccao||'—'}`).join('\n')}`:`Não encontrei solicitações geradas em entregas do ${g.group}. A Biblioteca de Solicitações continua disponível para modelos manuais.`,refs:[g.group,'Entregas','Biblioteca de Solicitações']};
 }
 if(g&&q.includes('entrega')){
  const ds=entregas.filter(d=>d.group===g.group).slice(0,5);return {text:ds.length?`Entregas registradas para ${g.group}:\n${ds.map(d=>`• ${alvesDateFromDelivery(d)} — ${d.faccao||'—'} — ${d.status||'—'}${d.lider?' — líder: '+d.lider:''}`).join('\n')}`:`Não há entregas registradas para ${g.group}.`,refs:[g.group,'Entregas']};
 }
 if(o){
  const target=faccoes.find(f=>alvesNorm(f.faccao)===alvesNorm(o.nome));return {text:`${o.nome}\nStatus: ${o.status||'—'}\nGroup atual: ${o.groupAtual||target?.group||'SEM GROUP'}\nSegmento: ${o.segmentoAtual||target?.segmento||'—'}\nQG: ${o.qgAtual||target?.qg||'—'}\nLíder: ${o.lider||target?.lider||'—'}${o.contato?`\nContato: ${o.contato}`:''}`,refs:[o.nome,'Facções']};
 }
 if(g){return {text:`${g.group} — ${g.qg||'QG sem nome'}\nSegmento: ${g.segmento||'—'}\nStatus: ${g.status==='ATIVA'?'OCUPADO':'VAGO'}\nFacção atual: ${g.faccao||'—'}\nLíder: ${g.lider||'—'}\nInstalações/setagens cadastradas: ${installedCount(g)}.`,refs:[g.group,'Groups/QGs']};}
 return {text:'Não encontrei um Group ou facção correspondente na base para responder com segurança. Tente informar o Group (ex.: Armas02) ou o nome exato da facção.',refs:['Base High OS']};
}
function alvesAddMessage(role,text,refs=[]){
 const box=$('#alvesMessages');if(!box)return;const div=document.createElement('div');div.className=`alves-msg ${role}`;div.innerHTML=`<div class="alves-bubble"><b>${role==='user'?'VOCÊ':'ALVESINHO'}</b><p>${esc(text)}</p>${refs?.length?`<div class="alves-ref">${refs.filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join('')}</div>`:''}</div>`;box.appendChild(div);box.scrollTop=box.scrollHeight;
}
function askAlvesinho(q){if(!q?.trim())return;alvesAddMessage('user',q);const a=alvesAnswer(q);setTimeout(()=>alvesAddMessage('bot',a.text,a.refs||[]),60)}
$('#alvesForm')?.addEventListener('submit',e=>{e.preventDefault();const input=$('#alvesInput'),q=input.value;input.value='';askAlvesinho(q)});
document.querySelectorAll('#alvesQuick [data-q]').forEach(b=>b.addEventListener('click',()=>askAlvesinho(b.dataset.q)));

// ===== HIGH OS V5.8 · PARSER DA PLANILHA OFICIAL + GOOGLE SHEETS SOMENTE LEITURA =====
let metricas=[],metricasCache=[],metricPeriodKey='',metricSourceConfig={url:'',sheet:'',autoSync:true},metricSourceState={status:'SEM FONTE',lastSync:null,count:0,activeCount:0,error:''},sheetsAccessToken='',mercadoCatalogo=[],mercadoStatus='CARREGANDO';
const metricCol=collection(db,'highos','data','metricas');
const metricConfigDoc=doc(db,'highos','metricas_config');
const MARKET_CATALOG_URL='https://alvesjardimitalo-oss.github.io/high-mercado-negro/data/catalogo.json';
const SHEETS_SCOPE='https://www.googleapis.com/auth/spreadsheets.readonly';

function metricDateValue(m){
 const raw=String(m?.data||m?.date||'').trim();
 const br=raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);if(br){let y=+br[3];if(y<100)y+=2000;return new Date(y,+br[2]-1,+br[1])}
 const d=new Date(raw);return isNaN(d)?new Date(0):d;
}
function metricSlots(m){
 const s=m?.slots||{};return {'14H':Number(s['14H']??m['14H']??m.h14??0)||0,'16H':Number(s['16H']??m['16H']??m.h16??0)||0,'21H':Number(s['21H']??m['21H']??m.h21??0)||0,'23H':Number(s['23H']??m['23H']??m.h23??0)||0};
}
function metricMonthKey(m){
 const d=metricDateValue(m);if(!d||d.getTime()===0)return '';return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}
function currentMetricMonthKey(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
function metricPeriodLabel(key=''){
 const m=String(key).match(/^(\d{4})-(\d{2})$/);if(!m)return key||'—';const d=new Date(+m[1],+m[2]-1,1);return d.toLocaleDateString('pt-BR',{month:'long',year:'numeric'}).replace(/^./,c=>c.toUpperCase());
}
function activeMetricRows(){const key=metricPeriodKey||currentMetricMonthKey();return metricas.filter(m=>metricMonthKey(m)===key)}
function refreshMetricPeriodOptions(){
 const el=$('#metricPeriod');if(!el)return;const current=currentMetricMonthKey();const keys=[...new Set(metricas.map(metricMonthKey).filter(Boolean))].sort().reverse();if(!keys.includes(current))keys.unshift(current);if(!metricPeriodKey)metricPeriodKey=current;if(!keys.includes(metricPeriodKey))metricPeriodKey=current;
 el.innerHTML=keys.map(k=>`<option value="${esc(k)}"${k===metricPeriodKey?' selected':''}>${esc(metricPeriodLabel(k))}${k===current?' • ATUAL':''}</option>`).join('');
}
function metricGroupRecords(group){return activeMetricRows().filter(m=>alvesNorm(m.group||m.organizacao||m.faccao)===alvesNorm(group)).sort((a,b)=>metricDateValue(a)-metricDateValue(b))}
function metricAnalysis(group){
 const rows=metricGroupRecords(group);if(!rows.length)return null;const vals=[],win={'14H':0,'16H':0,'21H':0,'23H':0};let peak={value:-1,hour:'—',date:'—'};
 rows.forEach(r=>{const s=metricSlots(r),entries=Object.entries(s);entries.forEach(([h,v])=>{vals.push(v);if(v>peak.value)peak={value:v,hour:h,date:r.data||r.date||'—'}});const mx=Math.max(...entries.map(x=>x[1]));entries.filter(x=>x[1]===mx&&mx>0).forEach(x=>win[x[0]]++)});
 const avg=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0;const pred=Object.entries(win).sort((a,b)=>b[1]-a[1])[0];return {rows,avg,peak,predominant:pred&&pred[1]?pred[0]:'—',predCount:pred?.[1]||0};
}
function extractSpreadsheetId(value=''){
 const v=String(value||'').trim();if(!v)return '';
 const m=v.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);if(m)return m[1];
 return /^[a-zA-Z0-9-_]{20,}$/.test(v)?v:'';
}
function a1SheetName(name=''){return `'${String(name).replace(/'/g,"''")}'`}
function normalizeMetricDate(v){
 const x=String(v??'').trim();if(!x)return '';
 let m=x.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);if(m){let y=+m[3];if(y<100)y+=2000;return `${String(+m[1]).padStart(2,'0')}/${String(+m[2]).padStart(2,'0')}/${y}`}
 m=x.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);if(m)return `${String(+m[3]).padStart(2,'0')}/${String(+m[2]).padStart(2,'0')}/${m[1]}`;
 return '';
}
function parseMetricNumber(v){if(v===null||v===undefined||String(v).trim()==='')return null;const n=Number(String(v).replace(/\s/g,'').replace(',','.'));return Number.isFinite(n)?n:null}
function metricSlotLabel(v){
 const x=String(v??'').trim().toUpperCase().replace(/\s+/g,'');
 const m=x.match(/^(14|16|21|23)(?:H|:00)?$/);return m?`${m[1]}H`:'';
}
function metricGroupLabel(v){
 const raw=String(v??'').trim();if(!raw)return '';
 const n=alvesNorm(raw).replace(/\s+/g,'');
 const known=(faccoes||[]).find(f=>alvesNorm(f.group).replace(/\s+/g,'')===n);if(known)return known.group;
 const compact=raw.replace(/\s+/g,'');
 if(/^(ARMAS|MUNI[CÇ][AÃ]O|MUNICAO|LAVAGEM|DROGAS|DESMANCHE|CONTRABANDO|ESTELIONATARIOS|ILEGALMEDIC|ILEGALMECHANIC)0*\d+$/i.test(compact))return compact.replace(/^MUNI[CÇ][AÃ]O/i,'Municao');
 if(/^(VANILLA|MANICOMIO)$/i.test(compact))return compact;
 return '';
}
function parseMetricSheet(values=[]){
 if(!Array.isArray(values)||!values.length)return [];
 // A aba oficial pode conter vários blocos mensais (junho, julho, agosto, setembro...)
 // na mesma página. Cada bloco tem sua própria linha de datas + linha 14H/16H/21H/23H.
 // O parser antigo escolhia apenas um cabeçalho e acabava reaproveitando as datas de um mês antigo.
 const scanLimit=Math.min(values.length,600);
 const headerIndexes=[];
 for(let i=0;i<scanLimit;i++){
  const labels=(values[i]||[]).map(metricSlotLabel).filter(Boolean);
  const distinct=new Set(labels);
  // Exige os quatro horários e ao menos duas sequências para não confundir linhas auxiliares.
  if(['14H','16H','21H','23H'].every(h=>distinct.has(h))&&labels.length>=8)headerIndexes.push(i);
 }
 if(!headerIndexes.length)return [];

 function nearestDateRow(headerIndex){
  let best=-1,bestScore=-1;
  // O cabeçalho de datas normalmente fica imediatamente acima, mas há títulos/linhas vazias.
  for(let i=Math.max(0,headerIndex-12);i<headerIndex;i++){
   const dates=(values[i]||[]).map(normalizeMetricDate).filter(Boolean);
   if(!dates.length)continue;
   // Prioriza mais datas e proximidade do cabeçalho.
   const score=dates.length*1000-(headerIndex-i);
   if(score>bestScore){bestScore=score;best=i}
  }
  return best;
 }

 function buildColumnDateMap(header,dateRow){
  const orderedDates=(dateRow||[]).map(normalizeMetricDate).filter(Boolean);
  if(!orderedDates.length)return {};
  const map={};let dayIndex=-1,lastSlot='';
  for(let c=0;c<header.length;c++){
   const h=metricSlotLabel(header[c]);if(!h)continue;
   // Cada novo 14H inicia um novo dia. Se o bloco começar desalinhado, inicia no primeiro horário.
   if(h==='14H'||dayIndex<0||(['16H','21H','23H'].indexOf(h)<=['16H','21H','23H'].indexOf(lastSlot)&&lastSlot))dayIndex++;
   if(dayIndex>=0&&dayIndex<orderedDates.length)map[c]=orderedDates[dayIndex];
   lastSlot=h;
  }
  return map;
 }

 const out=[];const seenKeys=new Set();
 for(let b=0;b<headerIndexes.length;b++){
  const headerIndex=headerIndexes[b];
  const nextHeader=headerIndexes[b+1]??values.length;
  const dateRowIndex=nearestDateRow(headerIndex);if(dateRowIndex<0)continue;
  const header=values[headerIndex]||[],dateRow=values[dateRowIndex]||[];
  const dateByCol=buildColumnDateMap(header,dateRow);
  if(!Object.keys(dateByCol).length)continue;

  for(let r=headerIndex+1;r<nextHeader;r++){
   const row=values[r]||[];let group='';
   for(const cell of row.slice(0,20)){group=metricGroupLabel(cell);if(group)break}
   if(!group)continue;
   const byDate={};
   for(let c=0;c<header.length;c++){
    const h=metricSlotLabel(header[c]);if(!h)continue;
    const d=dateByCol[c];if(!d)continue;
    const num=parseMetricNumber(row[c]);if(num===null)continue;
    if(!byDate[d])byDate[d]={group,data:d,slots:{'14H':0,'16H':0,'21H':0,'23H':0},seen:new Set()};
    byDate[d].slots[h]=num;byDate[d].seen.add(h);
   }
   Object.values(byDate).forEach(x=>{
    if(!x.seen.size)return;
    const key=`${alvesNorm(x.group)}|${x.data}`;
    if(seenKeys.has(key))return;
    seenKeys.add(key);delete x.seen;out.push(x);
   });
  }
 }
 return out;
}
async function authorizeSheets(){
 if(sheetsAccessToken)return sheetsAccessToken;if(!currentUser)throw new Error('Entre no High OS antes de conectar a planilha.');
 sheetsProvider.setCustomParameters({prompt:'consent',login_hint:currentUser.email||''});
 const before=(currentUser.email||'').toLowerCase();const result=await signInWithPopup(auth,sheetsProvider);const after=(result.user?.email||'').toLowerCase();
 if(before&&after&&before!==after)throw new Error('Autorize com a mesma conta Google usada no High OS.');
 const credential=GoogleAuthProvider.credentialFromResult(result);const token=credential?.accessToken;if(!token)throw new Error('O Google não retornou autorização para leitura da planilha.');sheetsAccessToken=token;return token;
}
async function sheetsFetch(url,token){
 const r=await fetch(url,{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});let payload={};try{payload=await r.json()}catch(e){}
 if(!r.ok){const msg=payload?.error?.message||`Google Sheets API: HTTP ${r.status}`;if(r.status===401)sheetsAccessToken='';throw new Error(msg)}return payload;
}
async function getSheetTitles(spreadsheetId,token){
 const url=`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=sheets.properties(title,index)`;const p=await sheetsFetch(url,token);return (p.sheets||[]).sort((a,b)=>(a.properties?.index||0)-(b.properties?.index||0)).map(x=>x.properties?.title).filter(Boolean);
}
async function readMetricSheet(spreadsheetId,sheet,token){
 const range=`${a1SheetName(sheet)}!A1:ZZ300`;const url=`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`;const p=await sheetsFetch(url,token);return parseMetricSheet(p.values||[]);
}
async function readMetricsDirect({authorize=false,urlOverride='',sheetOverride=''}={}){
 const source=urlOverride||metricSourceConfig.url,id=extractSpreadsheetId(source);if(!id)throw new Error('Informe um link ou ID válido do Google Sheets.');
 let token=sheetsAccessToken;if(!token&&authorize)token=await authorizeSheets();if(!token)throw new Error('AUTORIZAÇÃO NECESSÁRIA');
 const requested=(sheetOverride||metricSourceConfig.sheet||'').trim();if(requested){const rows=await readMetricSheet(id,requested,token);if(!rows.length)throw new Error(`A aba “${requested}” foi lida, mas o formato de métricas não foi reconhecido.`);return {rows,sheet:requested}}
 const titles=await getSheetTitles(id,token);let best={rows:[],sheet:''};for(const title of titles){try{const rows=await readMetricSheet(id,title,token);if(rows.length>best.rows.length)best={rows,sheet:title}}catch(e){}}
 if(!best.rows.length)throw new Error('Nenhuma aba com o padrão 14H / 16H / 21H / 23H foi encontrada.');return best;
}
async function loadMetricSourceConfig(){
 try{const s=await getDoc(metricConfigDoc);if(s.exists())metricSourceConfig={...metricSourceConfig,...s.data()}}catch(e){}renderMetricSourceStatus();
}
function metricTsToDate(v){
 if(!v)return null;if(v?.toDate)return v.toDate();if(v?.seconds)return new Date(v.seconds*1000);const d=new Date(v);return isNaN(d)?null:d;
}
function renderMetricSourceStatus(){
 const el=$('#metricSourceStatus');if(!el)return;const has=metricSourceConfig.mode==='GOOGLE_APPS_SCRIPT_FREE'||!!extractSpreadsheetId(metricSourceConfig.url),srv=metricSourceConfig.serverSync||{};const serverState=String(srv.status||'').toUpperCase();const localState=metricSourceState.status;const online=serverState==='ONLINE'||localState==='ONLINE';const failed=serverState==='ERRO'||localState==='ERRO';el.classList.toggle('online',online);el.classList.toggle('error',failed);
 const last=metricTsToDate(srv.lastSuccessAt)||metricTsToDate(srv.lastRunAt)||(metricSourceState.lastSync?new Date(metricSourceState.lastSync):null);const when=last?last.toLocaleString('pt-BR'):'—';let desc='Informe o link da planilha oficial';
 if(has)desc=metricSourceConfig.autoSync===false?'Fonte configurada • sincronização automática pausada':'Apps Script permanente • sincronização automática 14:05, 16:05, 21:05 e 23:05 • sem Blaze';
 if(online)desc=`Base sincronizada • ${Number(srv.rows??metricSourceState.count??metricas.length)||0} registros históricos${srv.sheet?' • aba '+srv.sheet:''}`;
 if(failed)desc=srv.error||metricSourceState.error||'Falha na sincronização automática';
 el.innerHTML=`<div><span class="metric-source-dot"></span><div><b>${has?'GOOGLE SHEETS • APPS SCRIPT GRATUITO':'FONTE NÃO CONFIGURADA'}</b><small>${esc(desc)}</small></div></div><span>${has?`Última sincronização: ${esc(when)}<br>AGENDA • 14:05 · 16:05 · 21:05 · 23:05`:'CONFIGURAR'}</span>`;
}
async function fetchMetricsFromSource({persist=false,quiet=false,authorize=true}={}){
 if(!extractSpreadsheetId(metricSourceConfig.url)){if(!quiet)alert('Configure primeiro o link da planilha em Fonte.');metricSourceState={status:'SEM FONTE',lastSync:null,count:0,activeCount:0,error:''};renderMetricSourceStatus();return false}
 metricSourceState={...metricSourceState,status:'SINCRONIZANDO',error:''};renderMetricSourceStatus();
 try{const result=await readMetricsDirect({authorize});const rows=result.rows.map(metricSnapshot);metricas=rows;metricPeriodKey=currentMetricMonthKey();metricSourceState={status:'ONLINE',lastSync:Date.now(),count:rows.length,activeCount:activeMetricRows().length,error:'',sheet:result.sheet};renderMetricSourceStatus();refreshMetricPeriodOptions();renderMetrics();if(persist)await persistMetricRows(rows,result.sheet);if(!quiet)alert(`${rows.length} registro(s) históricos lidos da aba ${result.sheet}. Exibindo ${activeMetricRows().length} registro(s) de ${metricPeriodLabel(metricPeriodKey)}. A planilha não foi alterada.`);return true
 }catch(e){metricas=metricasCache.slice();if(e.message==='AUTORIZAÇÃO NECESSÁRIA'){metricSourceState={...metricSourceState,status:'AGUARDANDO',error:''};renderMetricSourceStatus();return false}metricSourceState={...metricSourceState,status:'ERRO',error:e.message};renderMetricSourceStatus();renderMetrics();if(!quiet)alert('Erro ao sincronizar métricas: '+e.message);return false}
}
async function persistMetricRows(rows,sheet=''){
 const chunks=[];for(let i=0;i<rows.length;i+=400)chunks.push(rows.slice(i,i+400));for(const chunk of chunks){const batch=writeBatch(db);chunk.forEach(r=>{r=metricSnapshot(r);const id=(r.group+'_'+r.data).replace(/[^a-zA-Z0-9_-]/g,'_');batch.set(doc(db,'highos','data','metricas',id),{...r,source:'GOOGLE_SHEETS_READONLY',sourceSheet:sheet||metricSourceConfig.sheet||'',updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true})});await batch.commit()}
 await addDoc(histCol,{tipo:'SINCRONIZACAO_METRICAS',descricao:`${rows.length} registro(s) lidos em modo somente leitura da planilha oficial${sheet?' • aba '+sheet:''}`,usuario:currentUser.email,data:serverTimestamp()});metricasCache=rows.slice();
}
async function loadMetrics(){
 try{const qs=await getDocs(metricCol);metricasCache=qs.docs.map(d=>({id:d.id,...d.data()}));metricas=metricasCache.slice();metricPeriodKey=currentMetricMonthKey()}catch(e){metricasCache=[];metricas=[];metricPeriodKey=currentMetricMonthKey()}
 await loadMetricSourceConfig();refreshMetricPeriodOptions();renderMetrics();renderMetricSourceStatus();
}
function metricIdentity(group,row=null){
 const f=faccoes.find(x=>alvesNorm(x.group)===alvesNorm(group))||SEED.find(x=>alvesNorm(x.group)===alvesNorm(group))||{};
 return {group:group||f.group||'',faccao:row?.faccaoSnapshot||row?.faccao||f.faccao||'',qg:row?.qgSnapshot||f.qg||'',segmento:row?.segmentoSnapshot||f.segmento||'',lider:row?.liderSnapshot||f.lider||''};
}
function metricSnapshot(row={}){
 const id=metricIdentity(row.group||row.organizacao||row.faccao,row);
 return {...row,faccaoSnapshot:id.faccao,qgSnapshot:id.qg,segmentoSnapshot:id.segmento,liderSnapshot:id.lider,snapshotVersion:'V7.7'};
}
function metricSummaryRows(){
 const active=activeMetricRows();
 // Deduplica o Group pela chave normalizada. A planilha/histórico pode conter o mesmo
 // Group com caixa, acento ou espaços diferentes (ex.: Armas09 / ARMAS09 / Armas09 ).
 const groupMap=new Map();
 active.forEach(m=>{
  const raw=String(m.group||m.organizacao||m.faccao||'').trim();
  if(!raw)return;
  const key=alvesNorm(raw).replace(/\s+/g,'');
  if(!groupMap.has(key))groupMap.set(key,raw);
 });
 return [...groupMap.values()].map(group=>{
  const first=active.find(m=>alvesNorm(String(m.group||m.organizacao||m.faccao||'')).replace(/\s+/g,'')===alvesNorm(group).replace(/\s+/g,''));
  const ident=metricIdentity(group,first);
  const f=faccoes.find(x=>alvesNorm(String(x.group||'')).replace(/\s+/g,'')===alvesNorm(group).replace(/\s+/g,''))||ident;
  const a=metricAnalysis(group);
  return a?{f:{...f,group:String(f.group||group).trim(),faccao:f.faccao||metricIdentity(group,a.rows[0]).faccao,segmento:f.segmento||metricIdentity(group,a.rows[0]).segmento,qg:f.qg||metricIdentity(group,a.rows[0]).qg},a}:null;
 }).filter(Boolean).sort((x,y)=>y.a.avg-x.a.avg);
}
function metricDateLabel(row){const d=metricDateValue(row);return d&&d.getTime()?d.toLocaleDateString('pt-BR'):(row?.data||row?.date||'—')}
function metricDayAverage(row){const v=Object.values(metricSlots(row));return v.length?v.reduce((a,b)=>a+b,0)/v.length:0}
function metricPeriodRange(rows=[]){const dates=rows.map(metricDateValue).filter(d=>d&&d.getTime()).sort((a,b)=>a-b);if(!dates.length)return '—';return `${dates[0].toLocaleDateString('pt-BR')} a ${dates.at(-1).toLocaleDateString('pt-BR')}`}
function metricModeValue(values=[]){const counts=new Map();values.forEach(v=>counts.set(v,(counts.get(v)||0)+1));return [...counts.entries()].sort((a,b)=>b[1]-a[1]||b[0]-a[0])[0]?.[0]??'—'}
function metricSelectedGroup(){return $('#metricFactionSelect')?.value||metricSummaryRows()[0]?.f?.group||''}
function syncMetricSelectors(){
 const rows=metricSummaryRows();const options=rows.map(x=>`<option value="${esc(x.f.group)}">${esc(x.f.group)}${x.f.faccao?' • '+esc(x.f.faccao):''}</option>`).join('');
 const fs=$('#metricFactionSelect'),rg=$('#metricReportGroup');const keepF=fs?.value,keepR=rg?.value;
 if(fs){fs.innerHTML=options||'<option value="">SEM DADOS</option>';if(keepF&&rows.some(x=>x.f.group===keepF))fs.value=keepF}
 if(rg){const seg=$('#metricReportSegment')?.value||'';const filtered=rows.filter(x=>!seg||x.f.segmento===seg);rg.innerHTML=filtered.map(x=>`<option value="${esc(x.f.group)}">${esc(x.f.group)}${x.f.faccao?' • '+esc(x.f.faccao):''}</option>`).join('')||'<option value="">SEM DADOS</option>';if(keepR&&filtered.some(x=>x.f.group===keepR))rg.value=keepR}
 const rp=$('#metricReportPeriod');if(rp&&$('#metricPeriod')){const selected=rp.value||metricPeriodKey;rp.innerHTML=$('#metricPeriod').innerHTML;if([...rp.options].some(o=>o.value===selected))rp.value=selected}
}
function renderMetricFactionDetail(group=metricSelectedGroup()){
 const sum=$('#metricFactionSummary'),table=$('#metricFactionTable');if(!sum||!table)return;
 if(!group){sum.innerHTML='';table.innerHTML='<div class="placeholder"><h3>SEM DADOS</h3></div>';return}
 const a=metricAnalysis(group);if(!a){sum.innerHTML='';table.innerHTML='<div class="placeholder"><h3>SEM MÉTRICAS PARA ESTE GROUP</h3></div>';return}
 const id=metricIdentity(group,a.rows[0]);const vals=a.rows.flatMap(r=>Object.values(metricSlots(r)));const low=vals.length?Math.min(...vals):0;const mode=metricModeValue(vals);const expected=a.rows.length*4,filled=a.rows.reduce((n,r)=>n+Object.values(metricSlots(r)).filter(v=>Number.isFinite(v)).length,0);
 sum.innerHTML=`<article><span>FACÇÃO</span><b>${esc(id.faccao||'—')}</b><small>${esc(group)} • ${esc(id.segmento||'—')}</small></article><article><span>MÉDIA MENSAL</span><b>${a.avg.toFixed(2)}</b><small>${esc(metricPeriodLabel(metricPeriodKey))}</small></article><article><span>PICO</span><b>${a.peak.value}</b><small>${esc(a.peak.hour)} • ${esc(a.peak.date)}</small></article><article><span>MENOR REGISTRO</span><b>${low}</b><small>predominância ${esc(mode)}</small></article><article><span>COLETAS</span><b>${filled}/${expected}</b><small>${a.rows.length} dia(s) • ${esc(metricPeriodRange(a.rows))}</small></article>`;
 table.innerHTML=`<div class="metric-date-table-title"><div><b>HISTÓRICO DIÁRIO</b><span>${esc(id.faccao||group)} • ${esc(metricPeriodLabel(metricPeriodKey))}</span></div></div><div class="metric-table-scroll"><table class="metric-date-table"><thead><tr><th>DATA</th><th>14H</th><th>16H</th><th>21H</th><th>23H</th><th>MÉDIA DO DIA</th></tr></thead><tbody>${a.rows.map(r=>{const sl=metricSlots(r);return `<tr><td><b>${esc(metricDateLabel(r))}</b></td><td>${sl['14H']}</td><td>${sl['16H']}</td><td>${sl['21H']}</td><td>${sl['23H']}</td><td><b>${metricDayAverage(r).toFixed(2)}</b></td></tr>`}).join('')}</tbody></table></div>`;
}
function metricReportData(group,period=metricPeriodKey){
 const prev=metricPeriodKey;metricPeriodKey=period||prev;const a=metricAnalysis(group);metricPeriodKey=prev;if(!a)return null;const id=metricIdentity(group,a.rows[0]);const vals=a.rows.flatMap(r=>Object.values(metricSlots(r)));return {group,id,a,low:vals.length?Math.min(...vals):0,mode:metricModeValue(vals),range:metricPeriodRange(a.rows),period:period||prev};
}
function buildMetricReportHtml(data,printMode=false){
 if(!data)return '<div class="placeholder"><h3>SEM DADOS PARA O RELATÓRIO</h3></div>';const {group,id,a,low,mode,range,period}=data;
 return `<article class="monthly-report${printMode?' print-report':''}"><header><div><span>HIGH ROLEPLAY • CENTRAL DE MÉTRICAS</span><h2>RELATÓRIO MENSAL DE DESEMPENHO</h2><p>${esc(metricPeriodLabel(period))} • período ${esc(range)}</p></div><div class="report-badge">RH</div></header><section class="report-ident"><div><span>FACÇÃO</span><b>${esc(id.faccao||'—')}</b></div><div><span>GROUP</span><b>${esc(group)}</b></div><div><span>SEGMENTO</span><b>${esc(id.segmento||'—')}</b></div><div><span>QG</span><b>${esc(id.qg||'—')}</b></div><div><span>LÍDER</span><b>${esc(id.lider||'—')}</b></div></section><section class="report-kpis"><div><span>MÉDIA MENSAL</span><b>${a.avg.toFixed(2)}</b></div><div><span>PICO</span><b>${a.peak.value}</b><small>${esc(a.peak.hour)} • ${esc(a.peak.date)}</small></div><div><span>MENOR</span><b>${low}</b></div><div><span>PREDOMINÂNCIA</span><b>${esc(mode)}</b></div><div><span>DIAS AVALIADOS</span><b>${a.rows.length}</b></div></section><section><h3>REGISTROS DIÁRIOS</h3><table><thead><tr><th>Data</th><th>14H</th><th>16H</th><th>21H</th><th>23H</th><th>Média</th></tr></thead><tbody>${a.rows.map(r=>{const sl=metricSlots(r);return `<tr><td>${esc(metricDateLabel(r))}</td><td>${sl['14H']}</td><td>${sl['16H']}</td><td>${sl['21H']}</td><td>${sl['23H']}</td><td>${metricDayAverage(r).toFixed(2)}</td></tr>`}).join('')}</tbody></table></section><footer>Gerado pelo High OS • ${new Date().toLocaleString('pt-BR')}</footer></article>`;
}
function renderMetricReport(){
 const group=$('#metricReportGroup')?.value||'',period=$('#metricReportPeriod')?.value||metricPeriodKey;const data=metricReportData(group,period);$('#metricReportPreview').innerHTML=buildMetricReportHtml(data);return data;
}
function printMetricReport(){
 const data=renderMetricReport();if(!data)return alert('Selecione uma facção com dados nesta competência.');const w=window.open('','_blank','width=1050,height=760');if(!w)return alert('O navegador bloqueou a janela de impressão.');w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Relatório ${esc(data.group)} - ${esc(metricPeriodLabel(data.period))}</title><style>body{font-family:Arial,sans-serif;color:#17131b;margin:32px}header{display:flex;justify-content:space-between;border-bottom:3px solid #6f25a7;padding-bottom:16px}header span,.report-ident span,.report-kpis span{font-size:10px;text-transform:uppercase;color:#716978}h2{margin:5px 0}.report-badge{font-size:24px;font-weight:900}.report-ident,.report-kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin:20px 0}.report-ident div,.report-kpis div{border:1px solid #ddd;border-radius:8px;padding:10px}.report-ident b,.report-kpis b{display:block;margin-top:5px}.report-kpis b{font-size:22px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #ddd;padding:8px;text-align:center}th{background:#f2edf6}footer{margin-top:20px;font-size:10px;color:#777}@media print{body{margin:12mm}.no-print{display:none}}</style></head><body>${buildMetricReportHtml(data,true)}<script>window.onload=()=>window.print()<\/script></body></html>`);w.document.close();
}
function downloadMetricCsv(){
 const data=renderMetricReport();if(!data)return alert('Selecione uma facção com dados nesta competência.');const lines=[['Data','14H','16H','21H','23H','Media'],...data.a.rows.map(r=>{const s=metricSlots(r);return [metricDateLabel(r),s['14H'],s['16H'],s['21H'],s['23H'],metricDayAverage(r).toFixed(2).replace('.',',')]})];const csv='\ufeff'+lines.map(row=>row.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(';')).join('\r\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`metricas_${slug(data.group)}_${data.period}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function renderMetrics(err=null){
 const box=$('#metricRanking');if(err instanceof Event)err=null;
 const q=alvesNorm($('#metricSearch')?.value||''),seg=$('#metricSegment')?.value||'';
 let rows=metricSummaryRows().filter(x=>(!seg||x.f.segmento===seg)&&(!q||alvesNorm([x.f.group,x.f.faccao,x.f.qg].join(' ')).includes(q)));
 const active=activeMetricRows(),groupsWith=new Set(active.map(m=>alvesNorm(m.group||m.organizacao||m.faccao))).size;
 const groupKeys=new Set(rows.map(x=>alvesNorm(x.f.group))),visibleRaw=active.filter(m=>groupKeys.has(alvesNorm(m.group||m.organizacao||m.faccao)));
 const slotTotals={'14H':[], '16H':[], '21H':[], '23H':[]};visibleRaw.forEach(r=>{const sl=metricSlots(r);Object.keys(slotTotals).forEach(h=>slotTotals[h].push(sl[h]))});
 const hourAvgs=Object.fromEntries(Object.entries(slotTotals).map(([h,a])=>[h,a.length?a.reduce((x,y)=>x+y,0)/a.length:0]));
 const allValues=visibleRaw.flatMap(r=>Object.values(metricSlots(r))),overall=allValues.length?allValues.reduce((a,b)=>a+b,0)/allValues.length:0;
 const top=rows[0]||null,peak=rows.reduce((best,x)=>!best||x.a.peak.value>best.a.peak.value?x:best,null);const pred=Object.entries(hourAvgs).sort((a,b)=>b[1]-a[1])[0]||['—',0];
 if($('#metricOverview'))$('#metricOverview').innerHTML=`<article class="metric-hero-kpi"><span>MÉDIA GERAL EXIBIDA</span><b>${overall.toFixed(1)}</b><small>${rows.length} Group(s) no recorte atual</small></article><article class="metric-hero-kpi"><span>LÍDER DO RANKING</span><b>${top?esc(top.f.group):'—'}</b><small>${top?`média ${top.a.avg.toFixed(1)} • ${esc(top.f.faccao||top.f.qg||'')}`:'sem dados'}</small></article><article class="metric-hero-kpi"><span>MAIOR PICO</span><b>${peak?peak.a.peak.value:'—'}</b><small>${peak?`${esc(peak.f.group)} • ${esc(peak.a.peak.hour)} • ${esc(peak.a.peak.date)}`:'sem dados'}</small></article><article class="metric-hero-kpi"><span>HORÁRIO MAIS FORTE</span><b>${esc(pred[0])}</b><small>média agregada ${Number(pred[1]).toFixed(1)}</small></article>`;
 $('#metricStats').innerHTML=`<span><b>${esc(metricPeriodLabel(metricPeriodKey))}</b> COMPETÊNCIA</span><span><b>${esc(metricPeriodRange(active))}</b> PERÍODO</span><span><b>${active.length}</b> DIAS / REGISTROS</span><span><b>${groupsWith}</b> GROUPS COM DADOS</span><span><b>${rows.length}</b> EXIBIDOS</span>${seg?`<span>SEGMENTO <b>${esc(seg)}</b></span>`:''}`;
 const maxHour=Math.max(1,...Object.values(hourAvgs)),top5=rows.slice(0,5),maxTop=Math.max(1,...top5.map(x=>x.a.avg));
 const advanced=rows.map(x=>({...x,adv:metricAdvancedStats(x.f.group)})).filter(x=>x.adv);
 const rising=[...advanced].filter(x=>x.adv.trend>0).sort((a,b)=>b.adv.trend-a.adv.trend).slice(0,4);
 const falling=[...advanced].filter(x=>x.adv.trend<0).sort((a,b)=>a.adv.trend-b.adv.trend).slice(0,4);
 const attention=[...advanced].filter(x=>x.adv.alerts.length).sort((a,b)=>a.adv.trend-b.adv.trend).slice(0,5);
 const movement=(list,empty)=>list.length?list.map(x=>`<div class="metric-move-row"><div><b>${esc(x.f.faccao||x.f.group)}</b><small>${esc(x.f.group)} • média ${x.a.avg.toFixed(1)}</small></div><strong>${x.adv.trend>=0?'+':''}${x.adv.trend.toFixed(0)}%</strong></div>`).join(''):`<div class="muted">${empty}</div>`;
 if($('#metricVisuals'))$('#metricVisuals').innerHTML=`<section class="metric-chart-card"><div class="metric-chart-head"><b>PRESENÇA MÉDIA POR HORÁRIO</b><span>${esc(metricPeriodLabel(metricPeriodKey))}${seg?' • '+esc(seg):''}</span></div><div class="hour-bars">${Object.entries(hourAvgs).map(([h,v])=>`<div class="hour-col"><b>${v.toFixed(1)}</b><i style="height:${Math.max(4,v/maxHour*120)}px"></i><span>${h}</span></div>`).join('')}</div></section><section class="metric-chart-card"><div class="metric-chart-head"><b>TOP 5 • MÉDIA ONLINE</b><span>RANKING DO RECORTE</span></div><div class="top-bars">${top5.length?top5.map(x=>`<div class="top-bar-item"><span>${esc(x.f.group)}</span><div class="ops-track"><div class="ops-fill" style="width:${Math.max(3,x.a.avg/maxTop*100)}%"></div></div><b>${x.a.avg.toFixed(1)}</b></div>`).join(''):'<div class="muted">Sem dados no recorte.</div>'}</div></section><section class="metric-chart-card metric-movement-card"><div class="metric-chart-head"><b>MAIORES CRESCIMENTOS</b><span>ÚLTIMOS 5 DIAS VS. 5 ANTERIORES</span></div>${movement(rising,'Nenhum crescimento identificado no recorte.')}</section><section class="metric-chart-card metric-movement-card"><div class="metric-chart-head"><b>QUEDAS QUE MERECEM ATENÇÃO</b><span>CONSULTA ESTATÍSTICA</span></div>${movement(falling,'Nenhuma queda identificada no recorte.')}</section><section class="metric-chart-card metric-attention-card"><div class="metric-chart-head"><b>LEITURA RÁPIDA DO PERÍODO</b><span>${attention.length} GROUP(S) COM ALERTA</span></div>${attention.length?attention.map(x=>`<div class="metric-attention-row"><div><b>${esc(x.f.faccao||x.f.group)}</b><small>${esc(x.f.group)} • ${esc(x.f.segmento||'—')}</small></div><span>${esc(x.adv.alerts[0])}</span></div>`).join(''):'<div class="metric-ok-state">Sem alertas estatísticos relevantes para os filtros atuais.</div>'}</section>`;
 if(err){
  if($('#metricOverview'))$('#metricOverview').innerHTML=`<div class="placeholder"><h3>ERRO AO CARREGAR</h3><p>${esc(err.message||String(err))}</p></div>`;
  if($('#metricStats'))$('#metricStats').innerHTML='';
  if($('#metricVisuals'))$('#metricVisuals').innerHTML='';
  return
 }
 if(!rows.length){
  if($('#metricOverview'))$('#metricOverview').innerHTML=`<div class="placeholder"><b>▥</b><h3>SEM MÉTRICAS EM ${esc(metricPeriodLabel(metricPeriodKey).toUpperCase())}</h3><p>Não há dados para os filtros atuais. O High OS não mistura competências.</p></div>`;
  if($('#metricStats'))$('#metricStats').innerHTML='';
  if($('#metricVisuals'))$('#metricVisuals').innerHTML='';
  syncMetricSelectors();renderMetricFactionDetail();if($('#metricViewRanking')?.classList.contains('active'))renderMetricAdvancedRanking();return
 }
 // O ranking antigo da Visão Geral foi removido. A classificação fica apenas na aba RANKING.
 if(box)box.innerHTML='';
 syncMetricSelectors();renderMetricFactionDetail();if($('#metricViewRanking')?.classList.contains('active'))renderMetricAdvancedRanking();if($('#metricViewComparatives')?.classList.contains('active')){syncMetricCompareSelectors();renderMetricComparison()}
}
function metricAdvancedStats(group){
 const a=metricAnalysis(group);if(!a)return null;const dayAvgs=a.rows.map(metricDayAverage),slots={'14H':[],'16H':[],'21H':[],'23H':[]};a.rows.forEach(r=>{const x=metricSlots(r);Object.keys(slots).forEach(h=>slots[h].push(Number(x[h])||0))});
 const hourAvg=Object.fromEntries(Object.entries(slots).map(([h,v])=>[h,v.length?v.reduce((x,y)=>x+y,0)/v.length:0]));
 const threshold=a.avg*.8,regularDays=dayAvgs.filter(v=>v>=threshold).length,regularity=dayAvgs.length?regularDays/dayAvgs.length*100:0;
 const recent=dayAvgs.slice(-5),prior=dayAvgs.slice(-10,-5),av=v=>v.length?v.reduce((x,y)=>x+y,0)/v.length:0;const recentAvg=av(recent),priorAvg=av(prior);const trend=priorAvg?((recentAvg-priorAvg)/priorAvg*100):0;
 const alerts=[];if(prior.length>=3&&trend<=-20)alerts.push(`⚠ Queda de ${Math.abs(trend).toFixed(0)}% na média dos últimos dias.`);if(prior.length>=3&&trend>=15)alerts.push(`▲ Crescimento de ${trend.toFixed(0)}% na média dos últimos dias.`);
 const weak=Object.entries(hourAvg).sort((x,y)=>x[1]-y[1])[0],strong=Object.entries(hourAvg).sort((x,y)=>y[1]-x[1])[0];if(weak&&strong&&strong[1]>0&&weak[1]<strong[1]*.7)alerts.push(`⚠ ${weak[0]} está ${((1-weak[1]/strong[1])*100).toFixed(0)}% abaixo do horário mais forte (${strong[0]}).`);
 return {...a,hourAvg,regularity,trend,recentAvg,priorAvg,alerts};
}
function renderMetricAdvancedRanking(){
 const box=$('#metricAdvancedRanking');if(!box)return;const mode=$('#metricRankingMode')?.value||'avg',seg=$('#metricSegment')?.value||'';let rows=metricSummaryRows().filter(x=>!seg||x.f.segmento===seg).map(x=>({...x,x:metricAdvancedStats(x.f.group)})).filter(x=>x.x);
 rows.sort((a,b)=>mode==='peak'?b.x.peak.value-a.x.peak.value:mode==='regularity'?b.x.regularity-a.x.regularity:b.x.avg-a.x.avg);
 box.innerHTML=rows.length?`<div class="rh-ranking-row"><b>#</b><b>FACÇÃO / GROUP</b><span>MÉDIA</span><span class="rh-extra">PICO</span><span class="rh-extra">REGULAR.</span><span class="rh-extra">TENDÊNCIA</span></div>${rows.map((r,i)=>`<div class="rh-ranking-row"><b>${i+1}</b><div><strong>${esc(r.f.faccao||r.f.group)}</strong><small style="display:block">${esc(r.f.group)} • ${esc(r.f.segmento||'—')}</small></div><span><b>${r.x.avg.toFixed(2)}</b></span><span class="rh-extra">${r.x.peak.value}</span><span class="rh-extra">${r.x.regularity.toFixed(0)}%</span><span class="rh-extra">${r.x.trend>=0?'+':''}${r.x.trend.toFixed(0)}%</span></div>`).join('')}`:'<div class="placeholder"><h3>SEM DADOS</h3></div>';
}
function syncMetricCompareSelectors(){const rows=metricSummaryRows(),opts=rows.map(x=>`<option value="${esc(x.f.group)}">${esc(x.f.faccao||x.f.group)} • ${esc(x.f.group)}</option>`).join('');const a=$('#metricCompareA'),b=$('#metricCompareB');if(a&&!a.options.length)a.innerHTML=opts;if(b&&!b.options.length){b.innerHTML=opts;if(b.options.length>1)b.selectedIndex=1}}
function renderMetricComparison(){
 const ga=$('#metricCompareA')?.value,gb=$('#metricCompareB')?.value,box=$('#metricCompareResult');if(!box||!ga||!gb)return;const a=metricAdvancedStats(ga),b=metricAdvancedStats(gb);if(!a||!b){box.innerHTML='<div class="placeholder"><h3>SEM DADOS PARA COMPARAR</h3></div>';return}const ia=metricIdentity(ga,a.rows[0]),ib=metricIdentity(gb,b.rows[0]);
 const rows=[['Média mensal',a.avg.toFixed(2),b.avg.toFixed(2)],['Pico',a.peak.value,b.peak.value],['Regularidade',a.regularity.toFixed(0)+'%',b.regularity.toFixed(0)+'%'],['Tendência últimos dias',(a.trend>=0?'+':'')+a.trend.toFixed(0)+'%',(b.trend>=0?'+':'')+b.trend.toFixed(0)+'%'],...['14H','16H','21H','23H'].map(h=>['Média '+h,a.hourAvg[h].toFixed(2),b.hourAvg[h].toFixed(2)])];
 box.innerHTML=`<div class="rh-grid"><div class="rh-card"><span>FACÇÃO A</span><b>${esc(ia.faccao||ga)}</b><small>${esc(ga)}</small></div><div class="rh-card"><span>FACÇÃO B</span><b>${esc(ib.faccao||gb)}</b><small>${esc(gb)}</small></div><div class="rh-card"><span>DIFERENÇA DE MÉDIA</span><b>${Math.abs(a.avg-b.avg).toFixed(2)}</b><small>${a.avg>=b.avg?esc(ia.faccao||ga):esc(ib.faccao||gb)} à frente</small></div><div class="rh-card"><span>COMPETÊNCIA</span><b>${esc(metricPeriodLabel(metricPeriodKey))}</b></div></div><table class="rh-compare-table"><thead><tr><th>INDICADOR</th><th>${esc(ia.faccao||ga)}</th><th>${esc(ib.faccao||gb)}</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r[0]}</td><td><b>${r[1]}</b></td><td><b>${r[2]}</b></td></tr>`).join('')}</tbody></table>`;
}
function renderRhFactionInsights(group){const sum=$('#metricFactionSummary');if(!sum||!group)return;const x=metricAdvancedStats(group);if(!x)return;const extra=document.createElement('div');extra.className='rh-insights';extra.innerHTML=`<div class="rh-grid">${Object.entries(x.hourAvg).map(([h,v])=>`<div class="rh-card"><span>MÉDIA ${h}</span><b>${v.toFixed(2)}</b></div>`).join('')}<div class="rh-card"><span>REGULARIDADE</span><b>${x.regularity.toFixed(0)}%</b><small>dias ≥ 80% da média mensal</small></div><div class="rh-card"><span>TENDÊNCIA</span><b>${x.trend>=0?'+':''}${x.trend.toFixed(0)}%</b><small>últimos 5 dias vs. 5 anteriores</small></div></div>${x.alerts.length?`<div>${x.alerts.map(a=>`<div class="rh-alert">${esc(a)}</div>`).join('')}</div>`:'<div class="rh-alert">Sem alertas estatísticos relevantes no período.</div>'}`;sum.after(extra)}

const _renderMetricFactionDetailBase=renderMetricFactionDetail;
renderMetricFactionDetail=function(group=metricSelectedGroup()){document.querySelector('.rh-insights')?.remove();_renderMetricFactionDetailBase(group);renderRhFactionInsights(group)};
function switchMetricCenterView(view='overview'){
 document.querySelectorAll('.metric-center-tab').forEach(b=>b.classList.toggle('active',b.dataset.metricView===view));document.querySelectorAll('.metric-center-view').forEach(v=>v.classList.toggle('active',v.id===`metricView${view[0].toUpperCase()+view.slice(1)}`));if(view==='faction')renderMetricFactionDetail();if(view==='ranking')renderMetricAdvancedRanking();if(view==='comparatives'){syncMetricCompareSelectors();renderMetricComparison()}if(view==='reports')syncMetricSelectors();
}
document.querySelectorAll('.metric-center-tab').forEach(b=>b.addEventListener('click',()=>switchMetricCenterView(b.dataset.metricView)));

$('#metricRankingMode')?.addEventListener('change',renderMetricAdvancedRanking);
$('#metricCompareBtn')?.addEventListener('click',renderMetricComparison);
$('#metricCompareA')?.addEventListener('change',renderMetricComparison);
$('#metricCompareB')?.addEventListener('change',renderMetricComparison);

$('#metricFactionSelect')?.addEventListener('change',e=>renderMetricFactionDetail(e.target.value));
$('#metricOpenReportBtn')?.addEventListener('click',()=>{switchMetricCenterView('reports');if($('#metricReportGroup'))$('#metricReportGroup').value=$('#metricFactionSelect')?.value||'';renderMetricReport()});
$('#metricReportSegment')?.addEventListener('change',syncMetricSelectors);$('#metricReportPreviewBtn')?.addEventListener('click',renderMetricReport);$('#metricReportPrintBtn')?.addEventListener('click',printMetricReport);$('#metricReportCsvBtn')?.addEventListener('click',downloadMetricCsv);

function parseMetricImport(text=''){
 const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean),out=[];
 for(const line of lines){const p=line.includes('\t')?line.split('\t'):line.split(';');if(p.length<6)continue;const [group,data,a,b,c,d]=p.map(x=>x.trim());if(!group||alvesNorm(group).includes('organizacao')||alvesNorm(group)==='group')continue;out.push({group,data,slots:{'14H':Number(String(a).replace(',','.'))||0,'16H':Number(String(b).replace(',','.'))||0,'21H':Number(String(c).replace(',','.'))||0,'23H':Number(String(d).replace(',','.'))||0}})}
 return out;
}
async function saveMetricImport(){
 const rows=parseMetricImport($('#metricImportText')?.value||'');if(!rows.length){alert('Nenhuma linha válida. Use: Group;Data;14H;16H;21H;23H');return}
 try{const batch=writeBatch(db);rows.forEach(r=>{r=metricSnapshot(r);const id=(r.group+'_'+r.data).replace(/[^a-zA-Z0-9_-]/g,'_');batch.set(doc(db,'highos','data','metricas',id),{...r,updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true})});await batch.commit();await addDoc(histCol,{tipo:'IMPORTACAO_METRICAS',descricao:`${rows.length} registro(s) de métricas importado(s)`,usuario:currentUser.email,data:serverTimestamp()});$('#metricImportModal')?.classList.add('hidden');$('#metricImportText').value='';await loadMetrics();alert(`${rows.length} registro(s) importado(s).`)}catch(e){alert('Erro ao importar métricas: '+e.message)}
}
$('#metricSearch')?.addEventListener('input',()=>renderMetrics());$('#metricPeriod')?.addEventListener('change',e=>{metricPeriodKey=e.target.value||currentMetricMonthKey();renderMetrics();syncMetricSelectors()});$('#metricSegment')?.addEventListener('change',()=>renderMetrics());$('#metricReportPeriod')?.addEventListener('change',()=>{});$('#openMetricImportBtn')?.addEventListener('click',()=>$('#metricImportModal')?.classList.remove('hidden'));$('#metricImportClose')?.addEventListener('click',()=>$('#metricImportModal')?.classList.add('hidden'));$('#metricImportModal')?.addEventListener('click',e=>{if(e.target.id==='metricImportModal')e.currentTarget.classList.add('hidden')});$('#metricImportSave')?.addEventListener('click',saveMetricImport);

function openMetricSource(){
 const out=$('#metricSourceTestResult');
 if($('#metricSourceUrl'))$('#metricSourceUrl').value=metricSourceConfig.url||'';
 if($('#metricSourceSheet'))$('#metricSourceSheet').value=metricSourceConfig.sheet||'';
 if($('#metricAutoSync')){$('#metricAutoSync').checked=true;$('#metricAutoSync').disabled=true}
 if(out)out.innerHTML='<b>SINCRONIZAÇÃO GRATUITA VIA GOOGLE APPS SCRIPT</b><br>A planilha envia as métricas automaticamente ao Firestore às 14:05, 16:05, 21:05 e 23:05. Não usa Cloud Functions nem plano Blaze.';
 $('#metricSourceModal')?.classList.remove('hidden');
}
async function testMetricSource(){
 const out=$('#metricSourceTestResult');if(out)out.textContent='Atualizando os dados já sincronizados no Firestore...';
 try{await loadMetrics();if(out)out.innerHTML=`<b>CENTRAL ONLINE</b> • ${metricas.length} registro(s) históricos disponíveis no Firestore.`}catch(e){if(out)out.textContent='Falha: '+e.message}
}
async function refreshMetricServerConfig(){
 try{const snap=await getDoc(metricConfigDoc);if(snap.exists())metricSourceConfig={...metricSourceConfig,...snap.data()};renderMetricSourceStatus()}catch(e){}
}
async function requestServerMetricSync({quiet=false}={}){
 const btn=$('#syncMetricBtn'),old=btn?.textContent;if(btn){btn.disabled=true;btn.textContent='ATUALIZANDO...'}
 try{await refreshMetricServerConfig();await loadMetrics();if(!quiet)alert(`Central atualizada. ${metricas.length} registro(s) carregado(s) do Firestore. A sincronização da planilha é automática pelo Apps Script.`);return true}catch(e){if(!quiet)alert('Erro ao atualizar a Central: '+(e.message||e));return false}finally{if(btn){btn.disabled=false;btn.textContent=old||'ATUALIZAR CENTRAL'}}
}
async function saveMetricSource(){
 const cfg={url:$('#metricSourceUrl')?.value?.trim()||metricSourceConfig.url||'',sheet:$('#metricSourceSheet')?.value?.trim()||metricSourceConfig.sheet||'',autoSync:true,mode:'GOOGLE_APPS_SCRIPT_FREE',schedule:'14:05,16:05,21:05,23:05',timeZone:'America/Sao_Paulo',updatedAt:serverTimestamp(),updatedBy:currentUser.email};
 try{await setDoc(metricConfigDoc,cfg,{merge:true});metricSourceConfig={...metricSourceConfig,...cfg};$('#metricSourceModal')?.classList.add('hidden');renderMetricSourceStatus();alert('Fonte registrada. A sincronização automática é executada pelo Apps Script da planilha, sem Cloud Functions e sem Blaze.')}catch(e){alert('Erro ao salvar a fonte: '+e.message)}
}
$('#metricSourceBtn')?.addEventListener('click',openMetricSource);$('#metricSourceClose')?.addEventListener('click',()=>$('#metricSourceModal')?.classList.add('hidden'));$('#metricSourceModal')?.addEventListener('click',e=>{if(e.target.id==='metricSourceModal')e.currentTarget.classList.add('hidden')});$('#metricSourceTest')?.addEventListener('click',testMetricSource);$('#metricSourceSave')?.addEventListener('click',saveMetricSource);$('#syncMetricBtn')?.addEventListener('click',()=>requestServerMetricSync({quiet:false}));

function marketFlatten(node,path='',out=[]){
 if(Array.isArray(node)){node.forEach((v,i)=>marketFlatten(v,path,out));return out}
 if(!node||typeof node!=='object')return out;const name=node.nome||node.item||node.produto||node.name||node.ITEM||node.NOME||node.PRODUTO;
 if(name){out.push({...node,__name:String(name),__path:path})}
 Object.entries(node).forEach(([k,v])=>{if(v&&typeof v==='object')marketFlatten(v,path?path+' / '+k:k,out)});return out;
}
function marketPriceFields(x){
 const pick=(...ks)=>{for(const k of ks)if(x[k]!==undefined&&x[k]!==null&&String(x[k]).trim()!=='')return x[k];return ''};
 return {pista:pick('pista','preco_pista','precoPista','sell','sell_min','venda','VALOR PISTA','PISTA'),parceria:pick('parceria','preco_parceria','precoParceria','buy','buy_min','compra','VALOR PARCERIA','PARCERIA'),categoria:pick('categoria','category','CATEGORIA')||x.__path||''};
}
async function loadMarketCatalog(){
 mercadoStatus='CARREGANDO';renderMarket();try{const r=await fetch(MARKET_CATALOG_URL,{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);const json=await r.json();mercadoCatalogo=marketFlatten(json).filter((x,i,a)=>a.findIndex(y=>alvesNorm(y.__name)===alvesNorm(x.__name))===i);mercadoStatus='ONLINE';renderMarket()}catch(e){mercadoCatalogo=[];mercadoStatus='INDISPONÍVEL';renderMarket(e)}
}
function fmtMoneyMaybe(v){if(v===''||v==null)return '—';if(typeof v==='number')return '$'+v.toLocaleString('pt-BR');const n=Number(String(v).replace(/[^0-9,.-]/g,'').replace('.','').replace(',','.'));return Number.isFinite(n)&&n?('$'+n.toLocaleString('pt-BR')):String(v)}
function marketFind(question=''){const n=alvesNorm(question);return mercadoCatalogo.filter(x=>n.includes(alvesNorm(x.__name))||alvesNorm(x.__name).includes(n)).sort((a,b)=>b.__name.length-a.__name.length)[0]||null}
function renderMarket(err){
 const st=$('#marketStatus'),box=$('#marketResults'),cnt=$('#marketCount');if(!st||!box)return;st.innerHTML=mercadoStatus==='ONLINE'?`<span class="online">● CATÁLOGO ONLINE</span>`:(mercadoStatus==='CARREGANDO'?'Carregando catálogo público...':`<span class="danger">● CATÁLOGO INDISPONÍVEL</span>${err?' • '+esc(err.message):''}`);if(cnt)cnt.textContent=mercadoStatus==='ONLINE'?String(mercadoCatalogo.length):'—';
 const q=alvesNorm($('#marketSearch')?.value||'');const list=(q?mercadoCatalogo.filter(x=>alvesNorm([x.__name,x.__path].join(' ')).includes(q)):mercadoCatalogo.slice(0,8)).slice(0,20);box.innerHTML=list.map(x=>{const p=marketPriceFields(x);return `<div class="market-item"><div><b>${esc(x.__name)}</b><small>${esc(p.categoria||'Mercado Negro')}</small></div><span>Pista <b>${esc(fmtMoneyMaybe(p.pista))}</b><br>Parceria <b>${esc(fmtMoneyMaybe(p.parceria))}</b></span></div>`}).join('')||'<div class="delivery-no-change">Nenhum item encontrado.</div>';
}
$('#marketSearch')?.addEventListener('input',renderMarket);

const _alvesAnswerV54=alvesAnswer;
alvesAnswer=function(question=''){
 const q=alvesNorm(question),g=alvesFindGroup(question),o=alvesFindOrg(question);const metricTarget=g?.group||o?.groupAtual||faccoes.find(f=>o&&alvesNorm(f.faccao)===alvesNorm(o.nome))?.group;
 if(metricTarget&&(q.includes('media')||q.includes('pico')||q.includes('predomin')||q.includes('metrica'))){const a=metricAnalysis(metricTarget);if(!a)return {text:`Não encontrei métricas cadastradas para ${metricTarget}.`,refs:['Métricas',metricTarget]};let parts=[`${metricTarget} — ${metricPeriodLabel(metricPeriodKey)} — ${a.rows.length} dia(s) com métricas.`,`Média dos quatro horários: ${a.avg.toFixed(1)}.` ,`Pico: ${a.peak.value} às ${a.peak.hour} em ${a.peak.date}.`,`Horário predominante: ${a.predominant}.`];return {text:parts.join('\n'),refs:['Métricas',metricTarget]}}
 if(q.includes('abaixo da media')||q.includes('ranking')||q.includes('melhor media')){const rows=metricSummaryRows();if(rows.length)return {text:`Ranking de ${metricPeriodLabel(metricPeriodKey)} por média:\n${rows.slice(0,10).map((x,i)=>`${i+1}. ${x.f.group}${x.f.faccao?' — '+x.f.faccao:''}: ${x.a.avg.toFixed(1)}`).join('\n')}`,refs:['Métricas']}}
 if(q.includes('quanto custa')||q.includes('preco')||q.includes('pista')||q.includes('parceria')){const item=marketFind(question);if(item){const p=marketPriceFields(item);return {text:`${item.__name}\nPreço de pista: ${fmtMoneyMaybe(p.pista)}\nPreço de parceria: ${fmtMoneyMaybe(p.parceria)}${p.categoria?'\nCategoria: '+p.categoria:''}`,refs:['Mercado Negro']}}if(mercadoStatus!=='ONLINE')return {text:'O catálogo público do Mercado Negro não está disponível neste momento, então não vou estimar o preço.',refs:['Mercado Negro']}}
 return _alvesAnswerV54(question);
};



// ===== HIGH OS V6.5 · CDS CONFIRMADAS / GROUPS REMOVIDOS · 07/09/2026 =====
const GROUP_PROFILE_SOURCE={"Armas01":{"LOCAL":"Favela da Barragem","PRODUTO":"Armas","INICIAR ROTA":"1264.48,-179.11,106.39,19.85","CRAFT":"1267.72,-186.22,105.97,195.6","BARBEARIA":"","BAU":"1272.3,-181.79,101.0,209.77","LOJA DE ROUPAS":"","GARAGEM VIP FAC":"1300.19,-272.83,99.7,51.03 / 1298.18,-269.26,99.36,127.56","GARAGEM PUBLICA":"1285.68,-250.29,99.7,153.08 / 1288.0,-255.85,99.36,130.4","GARAGEM DELUXE":"","SHOP DELUXE":""},"Armas02":{"LOCAL":"Favela do MegaMal","PRODUTO":"Armas","INICIAR ROTA":"2584.82,3491.02,65.82,345.83","CRAFT":"2583.34,3489.61,65.82,87.88","BARBEARIA":"2648.6,3363.12,56.92,317.49","BAU":"2585.78,3485.36,65.82,124.73","LOJA DE ROUPAS":"2646.4,3357.91,56.92,357.17","GARAGEM VIP FAC":"2706.2,3385.18,58.82,340.16","GARAGEM PUBLICA":"2634.39,3370.33,56.87,314.65","GARAGEM DELUXE":"","SHOP DELUXE":"2548.08,3350.56,53.41,172.92"},"Armas03":{"LOCAL":"Favela da DP","PRODUTO":"Armas","INICIAR ROTA":"2287.76,-627.52,90.37,62.37","CRAFT":"2292.19,-624.81,90.37,343.0","BARBEARIA":"2457.5,-537.94,78.64,76.54","BAU":"2290.21,-629.61,90.37,136.07","LOJA DE ROUPAS":"2464.12,-535.34,78.64,127.56","GARAGEM VIP FAC":"2332.5,-614.04,96.5,286.3","GARAGEM PUBLICA":"2345.79,-609.89,96.57,102.05","GARAGEM DELUXE":"","SHOP DELUXE":"2447.74,-586.65,79.67,235.28"},"Armas04":{"LOCAL":"Favela da Praia 2","PRODUTO":"Armas","INICIAR ROTA":"-2404.99,-167.64,36.5,79.38","CRAFT":"-2483.78,-239.67,23.56,260.79","BARBEARIA":"-2428.14,-266.43,16.68,62.37","BAU":"-2486.09,-239.16,23.56,62.37","LOJA DE ROUPAS":"-2420.76,-266.25,16.68,113.39","GARAGEM VIP FAC":"-2395.47,-180.94,38.5,150.24","GARAGEM PUBLICA":"-2384.67,-194.25,39.56,334.49 / -2383.23,-191.85,39.48,68.04","GARAGEM DELUXE":"","SHOP DELUXE":"-2410.57,-293.44,16.75,229.61"},"Armas05":{"LOCAL":"Favela do Dino","PRODUTO":"Armas","INICIAR ROTA":"2561.79,2437.52,55.47,110.56","CRAFT":"2561.94,2437.71,55.47,323.15","BARBEARIA":"2503.28,2490.61,42.07,96.38","BAU":"2564.27,2435.75,55.47,155.91","LOJA DE ROUPAS":"2547.14,2417.11,53.85,334.49","GARAGEM VIP FAC":"2503.89,2471.52,52.23,116.23 / 2501.68,2471.86,52.12,19.85","GARAGEM PUBLICA":"2846.76,4741.39,55.35,34.02\t/ 2510.42,2450.05,51.46,206.93","GARAGEM DELUXE":"","SHOP DELUXE":""},"Armas06":{"LOCAL":"Favela do Zancudo","PRODUTO":"Armas06","INICIAR ROTA":"-2120.96,2482.66,10.03,133.23","CRAFT":"-2124.3,2478.9,10.03,195.6","BARBEARIA":"-2252.65,2457.93,15.62,107.72","BAU":"-2124.05,2484.81,10.03,297.64","LOJA DE ROUPAS":"-2248.43,2463.33,15.62,192.76","GARAGEM VIP FAC":"","GARAGEM PUBLICA":"-2223.74,2453.89,15.6,204.1 / -2224.76,2456.39,15.35,104.89","SHOP DELUXE":""},"Armas07":{"LOCAL":"","PRODUTO":"","INICIAR ROTA":"","CRAFT":"","BARBEARIA":"","BAU":"","LOJA DE ROUPAS":"","GARAGEM VIP FAC":"","GARAGEM PUBLICA":"","GARAGEM DELUXE":"","SHOP DELUXE":""},"Armas08":{"LOCAL":"Favela do Cemitério Norte","PRODUTO":"Armas","INICIAR ROTA":"60.64,2602.08,87.1,303.31","CRAFT":"61.57,2605.42,90.2,25.52","BARBEARIA":"","BAU":"62.42,2604.93,86.91,192.76","LOJA DE ROUPAS":"","GARAGEM PUBLICA":"-31.7,2673.96,76.48,93.55 / -33.75,2677.72,76.25,11.34","GARAGEM DELUXE":"","SHOP DELUXE":""},"Armas09":{"LOCAL":"Favela da Indústria, Sul","PRODUTO":"IlegalMechanic","INICIAR ROTA":"2640.33,1789.71,33.62,102.05","CRAFT":"2642.02,1781.15,33.62,187.09","BARBEARIA":"2657.95,1811.29,36.97,82.21","BAU":"2639.29,1784.0,41.1,172.92","LOJA DE ROUPAS":"2654.02,1812.91,36.97,184.26","GARAGEM VIP FAC":"-21.3,2584.61,91.16,96.38 / -23.15,2589.95,90.92,5.67","GARAGEM PUBLICA":"2639.48,1811.7,36.97,133.23 / 2636.38,1815.26,36.73,187.09","GARAGEM DELUXE":"2622.48,1808.18,36.92,198.43 / 2616.08,1804.09,36.46,85.04","SHOP DELUXE":"2640.37,1784.28,37.76"},"Armas10":{"LOCAL":"Favela da Cachoeira","PRODUTO":"Armas","INICIAR ROTA":"-1431.37,2306.54,30.82,187.09","CRAFT":"-1432.37,2309.31,30.82,90.71","BARBEARIA":"-1480.8,2283.59,30.72,257.96","BAU":"-1428.47,2308.29,30.82,291.97","LOJA DE ROUPAS":"-1414.47,2255.7,30.75,62.37","GARAGEM VIP FAC":"2688.94,1807.72,36.97,212.6 / 2684.77,1804.78,36.72,107.72","GARAGEM PUBLICA":"-1422.0,2267.5,30.67,155.91 / -1419.5,2267.27,30.45,345.83","GARAGEM DELUXE":"","SHOP DELUXE":"-1427.1,2271.31,30.95,172.92"},"Municao01":{"LOCAL":"Favela do Helipa","PRODUTO":"Municao","INICIAR ROTA":"1550.5,-728.82,111.51,204.1","CRAFT":"1547.48,-712.73,111.51,5.67","BARBEARIA":"1300.95,-781.39,79.04,221.11","BAU":"1538.87,-712.2,111.51,0.0","LOJA DE ROUPAS":"1294.03,-779.3,79.04,280.63","GARAGEM VIP FAC":"1355.24,-697.71,78.89,249.45","GARAGEM PUBLICA":"1388.29,-749.64,66.96,28.35 / 1379.99,-747.32,66.03,51.03","SHOP DELUXE":"1538.76,-723.59,111.51,14.18","ACADEMIA":""},"Municao02":{"LOCAL":"Favela do OBS 1","PRODUTO":"Municao","INICIAR ROTA":"-779.26,985.57,249.23,195.6","CRAFT":"-770.0,986.37,249.23,201.26","BARBEARIA":"-765.17,993.8,249.23,306.15","BAU":"-772.61,985.43,249.23,195.6","LOJA DE ROUPAS":"-760.24,993.57,249.23,150.24","GARAGEM VIP FAC":"-841.97,979.67,250.81,274.97 / -839.98,981.83,250.56,274.97","GARAGEM PUBLICA":"-833.8,969.79,250.81,39.69 / -833.88,972.49,250.14,8.51","GARAGEM DELUXE":"","SHOP DELUXE":"-771.07,935.66,240.28,303.31","ACADEMIA":""},"Municao03":{"LOCAL":"Favela de Sandy Shores, Alto","PRODUTO":"Municao","INICIAR ROTA":"2204.62,4682.23,37.68,232.45","CRAFT":"2200.62,4684.16,37.68,161.58","BARBEARIA":"2268.82,4607.25,37.59,70.87","BAU":"2203.59,4688.95,37.68,340.16","LOJA DE ROUPAS":"2159.7,4685.54,37.59,170.08","GARAGEM VIP FAC":"s","GARAGEM PUBLICA":"2193.62,4616.84,39.38,141.74","GARAGEM DELUXE":"","SHOP DELUXE":"2190.44,4669.46,37.54,138.9","ACADEMIA":""},"Municao04":{"LOCAL":"Favela do Petróleo, Sul","PRODUTO":"Municao","INICIAR ROTA":"1367.56,-2433.89,62.18,337.33","CRAFT":"1372.79,-2435.76,62.18,334.49","BARBEARIA":"1459.26,-2402.88,67.43,320.32","BAU":"1364.8,-2439.95,62.18,70.87","LOJA DE ROUPAS":"1371.31,-2435.59,58.32,136.07 / 1319.74,-2483.81,51.83,325.99","GARAGEM VIP FAC":"1386.0,-2499.9,52.82,206.93 / 1384.77,-2511.32,51.37,155.91","GARAGEM PUBLICA":"1389.18,-2509.62,51.98,93.55 / 1390.54,-2496.84,53.08,345.83","GARAGEM DELUXE":"1389.08,-2486.87,53.87,141.74 / 1392.64,-2488.64,53.11,348.67","SHOP DELUXE":"1385.25,-2378.29,68.36,252.29","ACADEMIA":""},"Municao05":{"LOCAL":"","PRODUTO":"QG da Plantação","INICIAR ROTA":"2047.86,5095.36,58.32,2.84","CRAFT":"2052.14,5126.33,53.89,130.4","BARBEARIA":"2069.89,5123.6,58.32,39.69","BAU":"2028.02,5095.71,58.32,124.73","LOJA DE ROUPAS":"2053.85,5121.14,58.35,303.31","GARAGEM VIP FAC":"2022.78,5137.13,52.99,317.49 / 2026.65,5133.26,52.99,130.4","GARAGEM PUBLICA":"2027.73,5141.33,52.99,130.4 / 2031.41,5137.24,52.99,130.4","GARAGEM DELUXE":"2096.62,5101.39,53.94,42.52 / 2087.23,5103.49,53.77,36.86","SHOP DELUXE":"2033.10,5088.68,58.44","ACADEMIA":""},"Municao06":{"LOCAL":"2476.25,4976.52,71.16,96.38","PRODUTO":"QG da Mansão Queimada","INICIAR ROTA":"2431.55,4972.79,42.34,31.19","CRAFT":"2435.99,4968.48,42.34,325.99","BARBEARIA":"2443.43,4976.83,51.56,314.65","BAU":"","LOJA DE ROUPAS":"2454.45,4976.54,51.56,136.07","GARAGEM VIP FAC":"2463.58,4949.11,45.29,5.67","GARAGEM PUBLICA":"","GARAGEM DELUXE":"2459.6,4960.17,43.99,343.0 / 2462.0,4958.6,45.12,150.24","SHOP DELUXE":"2443.18,4970.88,51.56,161.58","ACADEMIA":""},"Municao07":{"COORDENADA":"-1896.6,2015.73,171.3,351.5","LOCAL":"Vinhedo","PRODUTO":"Municao","INICIAR ROTA":"-1942.14,2048.95,132.25,164.41","CRAFT":"","BARBEARIA":"","BAU":"-1937.7,2040.68,140.83","LOJA DE ROUPAS":"","GARAGEM VIP FAC":"-1925.88,2035.26,140.83,286.3 / -1921.87,2037.21,140.73,260.79","GARAGEM PUBLICA":"-1921.04,2059.93,140.83,243.78 / -1917.63,2058.18,140.73,243.78","GARAGEM DELUXE":""},"Municao08":{"COORDENADA":"-1777.93,5.13,119.47,161.58","LOCAL":"Favela do Cemitério, Sul","PRODUTO":"Munição","INICIAR ROTA":"-1768.66,-118.06,95.4,311.82","CRAFT":"","BARBEARIA":"","BAU":"-1771.63,-117.69,95.4,42.52","LOJA DE ROUPAS":"","GARAGEM VIP FAC":"","GARAGEM PUBLICA":"-1750.31,-118.12,85.66,164.41 / -1756.5,-116.51,85.41,45.36","SHOP DELUXE":"-1777.02,6.2,85.71,235.28","ACADEMIA":""},"Municao09":{"COORDENADA":"","LOCAL":"QG dos Vagos","PRODUTO":"Munição","INICIAR ROTA":"320.79,-2058.35,24.03,323.15","CRAFT":"","BARBEARIA":"","BAU":"314.84,-2049.11,20.98,53.86","LOJA DE ROUPAS":"","GARAGEM VIP FAC":"313.21,-2035.34,20.73,325.99 / 317.48,-2030.66,20.62,323.15","GARAGEM PUBLICA":"320.99,-2041.22,20.78,325.99 / 324.85,-2038.76,20.69,323.15","SHOP DELUXE":"322.09,-2050.02,20.98,306.15","ACADEMIA":""},"Municao10":{"COORDENADA":"2184.19,85.47,261.91,164.41","LOCAL":"Favela da Boa Vista, Sul","PRODUTO":"Munição","CRAFT":"2249.79,51.97,251.42,68.04","BARBEARIA":"","BAU":"","LOJA DE ROUPAS":"2228.56,88.91,241.56,340.16","GARAGEM VIP FAC":"","GARAGEM PUBLICA":"2179.75,70.55,227.22,172.92 / 2177.03,72.47,227.15,130.4","GARAGEM DELUXE":"","SHOP DELUXE":"2218.22,109.56,235.26,238.12","ACADEMIA":""},"Drogas01":{"LOCAL":"657.75,-174.98,69.86,59.53","PRODUTO":"Favela do Campinho","INICIAR ROTA":"709.82,-225.13,71.65,153.08","CRAFT":"710.31,-224.03,71.65,334.49","BARBEARIA":"709.89,-223.81,71.65,155.91","BAU":"707.57,-221.92,71.65,343.0","LOJA DE ROUPAS":"721.89,-191.4,69.37,243.78","GARAGEM VIP FAC":"619.18,-92.62,74.93,79.38","GARAGEM PUBLICA":"719.91,-213.37,68.49,345.83 / 719.97,-210.54,68.24,56.7","GARAGEM DELUXE":"723.24,-205.81,68.49,153.08 / 721.06,-207.58,68.24,59.53","SHOP DELUXE":""},"Drogas02":{"LOCAL":"-1682.63,931.86,180.38,334.49","PRODUTO":"Favela do Asilo","INICIAR ROTA":"-1764.55,952.9,188.9,136.07","CRAFT":"-1762.31,954.81,188.9,229.61","BARBEARIA":"-1643.8,930.12,177.58,161.58","BAU":"-1763.18,958.83,188.9,246.62","LOJA DE ROUPAS":"-1639.81,945.88,177.56,76.54","GARAGEM VIP FAC":"-1644.81,937.1,177.58,201.26","GARAGEM PUBLICA":"-1669.83,992.43,177.61,249.45 / -1668.32,990.68,177.38,153.08","GARAGEM DELUXE":"-1670.38,934.22,177.63,136.07 / -1673.44,932.39,177.39,229.61","SHOP DELUXE":""},"Drogas03":{"LOCAL":"1367.25,-1381.16,108.73,257.96","PRODUTO":"Favela do Esgoto","INICIAR ROTA":"1430.23,-1414.87,84.37,280.63","CRAFT":"1427.54,-1415.26,84.37,8.51","BARBEARIA":"1283.57,-1333.09,47.92,187.09","BAU":"1424.85,-1418.62,84.37,22.68","LOJA DE ROUPAS":"1280.64,-1327.29,47.92,266.46","GARAGEM VIP FAC":"1295.6,-1330.47,47.6,323.15 / 1298.84,-1330.61,47.38,0.0","GARAGEM DELUXE":"1353.17,-1435.42,71.38,82.21 / 1351.1,-1434.02,71.12,357.17","GARAGEM PUBLICA":"1343.79,-1380.5,71.38,269.3 / 1347.0,-1380.58,71.12,0.0","SHOP DELUXE":""},"Drogas04":{"LOCAL":"482.33,208.67,100.73,82.21","PRODUTO":"QG Gang 1","INICIAR ROTA":"482.33,208.67,100.73,82.21","CRAFT":"470.13,205.06,100.73,354.34","BARBEARIA":"485.31,192.23,100.73,164.41","BAU":"472.67,197.5,100.73,164.41","LOJA DE ROUPAS":"473.06,186.7,100.73,297.64","GARAGEM VIP FAC":"473.52,186.59,100.73,325.99","GARAGEM PUBLICA":"509.06,225.12,104.74,147.41 / 514.46,226.33,104.74,345.83","GARAGEM DELUXE":"528.22,249.87,103.1,351.5 / 528.8,252.23,102.97,252.29","SHOP DELUXE":""},"Drogas05":{"LOCAL":"-1570.68,-298.16,88.78,337.33","PRODUTO":"QG Gang 2(mapa removido)","INICIAR ROTA":"-1565.57,-264.05,44.26,22.68","CRAFT":"-1578.25,-262.83,44.26,343.0","BARBEARIA":"-1571.2,-252.76,43.89,76.54","BAU":"-1578.55,-270.92,44.26,136.07","LOJA DE ROUPAS":"-1578.81,-270.88,43.79,153.08","GARAGEM VIP FAC":"1580.84,-281.09,44.26,300.48","GARAGEM PUBLICA":"-1566.89,-252.61,48.46,51.03","GARAGEM DELUXE":"-1575.38,-234.43,49.76,59.53 / -1576.35,-238.15,49.45,243.78","SHOP DELUXE":""},"Drogas06":{"LOCAL":"Clube de Festas, Açougue","PRODUTO":"Drogas","INICIAR ROTA":"1003.52,-2367.53,-4.52,189.93","CRAFT":"1010.48,-2372.96,-4.55,280.63","BARBEARIA":"1005.37,-2365.64,-4.55,221.11","BAU":"1001.11,-2365.92,-4.55,90.71","LOJA DE ROUPAS":"1004.46,-2373.0,-4.55,323.15","GARAGEM VIP FAC":"","GARAGEM PUBLICA":"1024.74,-2349.74,31.24,175.75 / 1018.94,-2351.77,31.24,187.09","GARAGEM DELUXE":"","SHOP DELUXE":""},"Drogas07":{"LOCAL":"Residência Clinton","PRODUTO":"","INICIAR ROTA":"-9.29,-1441.26,31.1,215.44","CRAFT":"-9.08,-1433.34,30.85","BARBEARIA":"-17.93,-1436.92,31.1,272.13","BAU":"-17.41,-1430.43,30.89","LOJA DE ROUPAS":"-17.98,-1439.36,31.1,235.28","GARAGEM VIP FAC":"-21.12,-1432.83,30.65,90.71 / -24.29,-1437.13,30.65,175.75","GARAGEM PUBLICA":"-13.3,-1454.7,30.46,187.09 / -12.59,-1458.68,30.5,93.55","GARAGEM DELUXE":"-28.68,-1455.62,30.97,192.76 / -27.63,-1460.43,30.92,90.71","SHOP DELUXE":"-9.86,-1428.56,31.18"},"Drogas08":{"LOCAL":"Favela da Praia 3","PRODUTO":"Drogas","INICIAR ROTA":"-2902.94,1485.7,71.12,153.08","CRAFT":"-2899.09,1488.07,71.12,255.12","BARBEARIA":"-2888.92,1367.41,76.26,19.85","BAU":"-2902.65,1492.9,71.12,340.16","LOJA DE ROUPAS":"-2843.63,1419.7,96.99,73.71","GARAGEM VIP FAC":"","GARAGEM PUBLICA":"","GARAGEM DELUXE":"","SHOP DELUXE":""},"Drogas09":{"LOCAL":"Favela da Praia 1","PRODUTO":"Drogas","INICIAR ROTA":"-1137.86,-1764.65,4.48,215.44","CRAFT":"-1139.78,-1763.02,4.48,215.44","BARBEARIA":"-1127.14,-1752.72,4.48,300.48","BAU":"-1137.37,-1761.03,4.48,226.78","LOJA DE ROUPAS":"-1124.34,-1750.41,4.48,31.19","GARAGEM VIP FAC":"-1191.48,-1790.99,4.26,269.3 / -1188.75,-1793.3,4.01,343.0","GARAGEM PUBLICA":"","GARAGEM DELUXE":"","SHOP DELUXE":""},"Drogas10":{"LOCAL":"Favela de Paleto, Norte","PRODUTO":"DROGAS","INICIAR ROTA":"1772.1,6474.44,60.04,240.95","CRAFT":"1767.62,6478.2,60.04,56.7","BARBEARIA":"1759.67,6466.96,59.77,272.13","BAU":"1770.48,6472.01,60.04,249.45","LOJA DE ROUPAS":"1756.12,6466.74,59.77,317.49","GARAGEM VIP FAC":"1744.07,6496.36,59.78,147.41 / 1741.94,6494.63,59.55,51.03","GARAGEM DELUXE":"","SHOP DELUXE":"1696.08,6529.43,52.13,48.19"},"Drogas11":{"LOCAL":"Posto, Porto","PRODUTO":"Drogas","INICIAR ROTA":"-59.76,-2517.63,7.30","CRAFT":"-55.92,-2519.98,7.23","BARBEARIA":"-55.09,-2503.67,6.15,56.7","BAU":"-52.39,-2525.34,7.51","LOJA DE ROUPAS":"-61.99,-2504.17,6.0,56.7","GARAGEM VIP FAC":"-103.79,-2509.85,5.39,240.95 / -105.71,-2513.14,5.43,232.45","GARAGEM PUBLICA":"1742.47,6487.88,59.78,331.66 / 1742.77,6490.59,59.56,62.37","GARAGEM DELUXE":"","SHOP DELUXE":""},"Lavagem01":{"LOCAL":"Club 77","PRODUTO":"Lavagem","INICIAR ROTA":"209.95,-3175.18,8.21,181.42","CRAFT":"242.5,-3143.78,3.32,124.73","BARBEARIA":"239.56,-3151.23,-0.19,181.42","BAU":"248.55,-3144.14,3.40","LOJA DE ROUPAS":"252.76,-3150.9,-0.2,87.88","GARAGEM VIP FAC":"194.48,-3158.92,5.78,93.55","GARAGEM PUBLICA":"160.19,-3180.44,5.98,235.28/164.02,-3182.84,5.91,266.46","BAR":"247.17,-3162.36,-0.15","SHOP DELUXE":"244.12,-3157.52,-0.27","ACADEMIA":""},"Lavagem02":{"LOCAL":"FAZENDA, SUL","PRODUTO":"LAVAGEM","INICIAR ROTA":"1466.47,1119.43,119.13,0.0","CRAFT":"1471.03,1118.18,119.13,0.0","BARBEARIA":"1403.24,1138.17,117.53,184.26","BAU":"","LOJA DE ROUPAS":"1404.22,1146.07,117.53,107.72","GARAGEM VIP FAC":"1372.26,1151.31,113.75,90.71 / 1368.33,1150.45,113.75,195.6","GARAGEM DELUXE":"1374.97,1131.93,114.16,317.49 / 1370.97,1130.95,113.89,138.9","SHOP DELUXE":""},"Lavagem03":{"LOCAL":"FAVELA DA PLACA","PRODUTO":"LAVAGEM","INICIAR ROTA":"768.49,441.9,149.73,215.44","CRAFT":"765.18,445.32,149.73,34.02","BARBEARIA":"764.5,396.1,139.68,153.08","BAU":"767.48,443.1,146.37,144.57","LOJA DE ROUPAS":"765.43,402.19,139.68,192.76","GARAGEM VIP FAC":"828.36,424.15,139.63,331.66","GARAGEM DELUXE":"","SHOP DELUXE":""},"Lavagem04":{"LOCAL":"FAVELA DO OBS 2","PRODUTO":"LAVAGEM","INICIAR ROTA":"-480.22,1613.99,369.58,0.0","CRAFT":"-482.76,1606.59,369.58,195.6","BARBEARIA":"-304.33,1599.18,347.27,102.05","BAU":"-479.65,1609.97,369.58,192.76","LOJA DE ROUPAS":"-298.58,1603.26,347.27,138.9","GARAGEM VIP FAC":"","GARAGEM DELUXE":"","SHOP DELUXE":""},"Lavagem05":{"LOCAL":"Mansão Playboy","PRODUTO":"Lavagem","INICIAR ROTA":"-1540.36,81.20,56.58","CRAFT":"-1511.86,109.48,46.86","BARBEARIA":"-1545.0,99.0,60.96,314.65","BAU":"-1509.97,117.46,47.15","LOJA DE ROUPAS":"-1535.6,106.92,60.96,130.4","GARAGEM VIP FAC":"","GARAGEM DELUXE":""},"Lavagem06":{"LOCAL":"QG do China (MAPA REMOVIDO)","PRODUTO":"Lavagem","INICIAR ROTA":"-881.18,-1462.64,7.46","CRAFT":"-892.03,-1444.94,7.53,209.77","BARBEARIA":"-895.49,-1467.9,7.53,113.39","BAU":"-867.42,-1458.02,7.53,291.97","LOJA DE ROUPAS":"","GARAGEM VIP FAC":"","GARAGEM PUBLICA":"","SHOP DELUXE":"-902.60,-1455.85,7.44"},"Lavagem07":{"COORDENADA":"Favela do Sapao","LOCAL":"LAVAGEM07","PRODUTO":"","INICIAR ROTA":"1876.33,1511.54,112.98,357.17","CRAFT":"1885.17,1504.95,113.06,269.3","BARBEARIA":"1797.51,1356.97,126.93,175.75","BAU":"1886.08,1509.38,112.98,246.62","LOJA DE ROUPAS":"","GARAGEM DELUXE":"1860.3,1466.5,113.16,0.0"},"Lavagem08":{"LOCAL":"QG Gang 4(MAPA REMOVIDO","PRODUTO":"Lavagem08","INICIAR ROTA":"-1129.31,-1584.40,0.24","CRAFT":"-1123.6,-1562.83,0.42,297.64","BARBEARIA":"-1134.11,-1564.1,0.42,303.31","BAU":"-1127.24,-1576.06,0.42,303.31","LOJA DE ROUPAS":"-1121.56,-1566.9,0.42,76.54","GARAGEM VIP FAC":"-1138.97,-1545.38,4.35,127.56 / -1140.6,-1546.48,4.38,36.86","GARAGEM PUBLICA":"-1162.28,-1552.97,4.35,308.98 / -1158.29,-1550.28,4.3,308.98","GARAGEM DELUXE":"","SHOP DELUXE":"-1140.83,-1589.01,0.52"},"Lavagem09":{"LOCAL":"Galaxy","PRODUTO":"Lavagem","INICIAR ROTA":"400.75,242.64,92.05,158.75","CRAFT":"406.28,244.24,92.05,263.63","BARBEARIA":"","BAU":"391.84,250.44,92.05,79.38","LOJA DE ROUPAS":"380.99,272.5,91.19,73.71","GARAGEM VIP FAC":"","BAR":"351.80,286.03,91.22"},"Desmanche01":{"LOCAL":"QG Gang 3","PRODUTO":"Desmanche","INICIAR ROTA":"-1332.84,-1238.37,1.4,317.49","CRAFT":"-1325.19,-1246.69,0.59,34.02","BARBEARIA":"-1334.04,-1258.29,0.59,136.07","BAU":"-1337.69,-1245.67,0.59,104.89","LOJA DE ROUPAS":"-1345.79,-1252.23,0.59,257.96","GARAGEM VIP FAC":"-1298.72,-1250.86,4.45,107.72 / -1303.08,-1253.4,4.36,221.11","GARAGEM PUBLICA":"-1306.33,-1240.29,4.84,133.23 / -1309.84,-1242.13,4.73,204.1","GARAGEM DELUXE":"","SHOP DELUXE":""},"Desmanche02":{"LOCAL":"Tequi-la-la","PRODUTO":"Desmanche","INICIAR ROTA":"-572.99,286.48,79.18,184.26","CRAFT":"-568.52,292.05,79.18,167.25","BARBEARIA":"-561.91,289.98,85.38,178.59","BAU":"-572.8,292.22,79.18,25.52","LOJA DE ROUPAS":"-552.76,278.47,82.18,59.53","GARAGEM VIP FAC":"-569.89,323.5,84.48,0.0 / -572.76,324.7,84.54,184.26","GARAGEM PUBLICA":"-552.03,310.63,83.17,354.34 / -546.87,308.18,83.02,175.75","GARAGEM DELUXE":"","BAR":"-561.28,286.65,82.25 / -563.87,286.07,85.48"},"Desmanche04":{"LOCAL":"The Lost","PRODUTO":"Desmanche04","INICIAR ROTA":"961.56,-107.1,74.34,25.52","CRAFT":"971.5, -98.4, 74.3","BARBEARIA":"974.39,-99.78,78.08,311.82","BAU":"957.8, -110.9, 74.3","LOJA DE ROUPAS":"974.4, -99.7, 78.1","GARAGEM VIP FAC":"950.0, -129.3, 74.4","GARAGEM PUBLICA":"959.1, -121.4, 75.0","GARAGEM DELUXE":"","SHOP DELUXE":"998.22,-108.19,73.97,314.65"},"Desmanche05":{"LOCAL":"Roogers","PRODUTO":"","INICIAR ROTA":"-616.13,-1621.95,32.88","CRAFT":"-612.49,-1624.81,32.80","BARBEARIA":"-589.7,-1618.08,33.01,172.92 / 490.22,-1306.8,29.27,195.6","BAU":"-619.84,-1617.82,33.01,357.17","LOJA DE ROUPAS":"-594.88,-1618.53,33.01,269.3","GARAGEM VIP FAC":"-610.65,-1600.65,26.74,82.21 / -610.2,-1597.7,26.74,79.38","GARAGEM PUBLICA":"-609.36,-1591.97,26.74,87.88 / -610.6,-1594.24,26.74,82.21","GARAGEM DELUXE":"-588.75,-1583.67,26.74,82.21 / -590.55,-1587.77,26.74,90.71","SHOP DELUXE":"-623.7,-1617.59,33.01,11.34"},"Desmanche06":{"LOCAL":"Hayes Auto","PRODUTO":"","INICIAR ROTA":"t/","CRAFT":"","BARBEARIA":"474.0,-1321.5,29.22,198.43","BAU":"479.42,-1326.83,29.2,113.39","LOJA DE ROUPAS":"482.19,-1303.27,29.25,218.27","GARAGEM VIP FAC":"484.36,-1338.85,29.28,289.14 / 485.78,-1333.83,29.3,306.15","GARAGEM PUBLICA":"504.6,-1336.41,29.32,195.6 / 499.79,-1337.28,29.32,34.02","GARAGEM DELUXE":"492.64,-1356.22,29.34,90.71 / 488.4,-1362.14,29.25,192.76","SHOP DELUXE":"478.44,-1334.72,29.23,141.74"},"IlegalMedic01":{"LOCAL":"QG Gang 5","PRODUTO":"IlegalMedic","INICIAR ROTA":"544.32,-1756.77,25.34,65.2","CRAFT":"540.27,-1766.22,25.34,150.24","BARBEARIA":"553.57,-1783.34,25.34,144.57","BAU":"541.8,-1776.8,25.34,56.7","LOJA DE ROUPAS":"547.28,-1789.54,25.34,161.58","GARAGEM VIP FAC":"569.71,-1800.96,29.17,348.67 / 567.43,-1799.82,29.18,348.67","GARAGEM PUBLICA":"564.15,-1754.86,29.17,340.16 / 564.15,-1754.86,29.17,343.0","GARAGEM DELUXE":"","SHOP DELUXE":""},"Contrabando02":{"LOCAL":"Lester","PRODUTO":"","INICIAR ROTA":"1272.07,-1711.17,54.59","CRAFT":"1272.58,-1716.33,54.42","BARBEARIA":"1273.69,-1708.15,54.76,119.06","BAU":"1268.32,-1710.62,55.26","LOJA DE ROUPAS":"1276.17,-1714.44,54.76,48.19","GARAGEM VIP FAC":"1273.14,-1733.26,51.85,221.11 / 1272.55,-1736.37,51.63,113.39","GARAGEM PUBLICA":"1282.54,-1728.36,52.72,218.27 / 1286.06,-1732.69,52.86,297.64","GARAGEM DELUXE":"","SHOP EXCLUSIVO":"1270.48,-1730.46,54.85"}};
const GROUP_BASE_CORRECTIONS={"Armas01":{"cds":"1286.34,-266.43,99.7,303.31","state":"OK"},"Armas02":{"cds":"2696.23,3400.29,58.82,90.71","state":"OK"},"Armas03":{"cds":"2355.39,-605.06,96.58,257.96","state":"OK"},"Armas04":{"cds":"-2390.91,-198.43,39.65,269.3","state":"OK"},"Armas05":{"cds":"2561.79,2437.52,55.47,110.56","state":"OK"},"Armas06":{"cds":"-2120.96,2482.66,10.03,133.23","state":"OK"},"Armas07":{"cds":"-113.73,-12.34,70.52,133.23","state":"SEM_CRAFT"},"Armas08":{"state":"REMOVIDO"},"Armas09":{"cds":"2640.33,1789.71,33.62,102.05","state":"OK"},"Armas10":{"cds":"-1431.37,2306.54,30.82,187.09","state":"OK"},"Municao01":{"cds":"1550.5,-728.82,111.51,204.1","state":"OK"},"Municao02":{"cds":"-779.26,985.57,249.23,195.6","state":"OK"},"Municao03":{"cds":"-130.69,3220.77,73.72,255.12","state":"OK"},"Municao04":{"cds":"1367.56,-2433.89,62.18,337.33","state":"OK"},"Municao05":{"cds":"2047.86,5095.36,58.32,2.84","state":"OK"},"Municao06":{"cds":"2473.01,4959.72,44.89,51.03","state":"OK"},"Municao07":{"cds":"-1896.6,2015.73,171.3,351.5","state":"OK"},"Municao08":{"cds":"-1771.7,-117.8,95.4","state":"OK"},"Municao09":{"cds":"320.79,-2058.35,24.03,323.15","state":"OK"},"Municao10":{"cds":"-3694.8,3790.2,5.1","state":"OK"},"Lavagem01":{"cds":"241.5,-3144.2,3.3","state":"OK"},"Lavagem02":{"cds":"1466.47,1119.43,119.13,0.0","state":"OK"},"Lavagem03":{"cds":"768.49,441.9,149.73,215.44","state":"OK"},"Lavagem04":{"cds":"-482.6,1606.5,369.6","state":"OK"},"Lavagem05":{"cds":"-1511.9,109.5,46.9","state":"OK"},"Lavagem07":{"cds":"1876.33,1511.54,112.98,357.17","state":"OK"},"Lavagem08":{"state":"REMOVIDO"},"Lavagem09":{"cds":"342.68,293.21,118.13,354.34","state":"OK"},"Desmanche01":{"cds":"-1332.84,-1238.37,1.4,317.49","state":"OK"},"Desmanche02":{"cds":"-572.99,286.48,79.18,184.26","state":"OK"},"Desmanche03":{"cds":"-1376.69,-621.82,35.89,31.19","state":"OK"},"Desmanche04":{"cds":"983.12,-126.47,74.05,320.32","state":"OK"},"Desmanche05":{"cds":"-616.13,-1621.95,32.88","state":"OK"},"Desmanche06":{"cds":"471.44,-1311.00,29.26","state":"OK"},"Desmanche07":{"cds":"2201.62,4689.18,37.68,68.04","state":"OK"},"Vanilla":{"cds":"92.59,-1290.91,29.25","state":"OK"},"IlegalMedic01":{"cds":"227.44,-1388.25,32.45,36.86","state":"OK"},"IlegalMechanic":{"cds":"-205.6,-1310.29,31.29,223.94","state":"OK"},"Manicomio":{"cds":"3899.68,4877.41,12.7,93.55","state":"OK"},"Drogas01":{"cds":"657.75,-174.98,69.86,59.53","state":"OK"},"Drogas02":{"cds":"-1682.63,931.86,180.38,334.49","state":"OK"},"Drogas03":{"cds":"1367.25,-1381.16,108.73,257.96","state":"OK"}};
const GROUP_PROFILE_SOURCE_VERSION='07/09/2026 · CDS conferidas';
function profileCoordLike(v=''){return /^\s*[{]?\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+/.test(String(v||''))}
function splitCoordPair(v=''){const s=String(v||'').replace(/\t/g,' ').trim();if(!s)return ['',''];const parts=s.split(/\s*\/\s*/).map(x=>x.trim()).filter(Boolean);return [parts[0]||'',parts[1]||'']}
function cleanProfileValue(v=''){return String(v||'').replace(/<br\s*\/?\s*>/gi,'').trim()}
function sourceToGroupPatch(f,src){
 const oldB={...(f?.beneficios||{})}, oldT=mergedTechProfile(f||{}), b={...oldB}, t=clonePlain(oldT)||{}, correction=GROUP_BASE_CORRECTIONS[f?.group]||{};
 const local=cleanProfileValue(src.LOCAL), product=cleanProfileValue(src.PRODUTO), craft=cleanProfileValue(src.CRAFT), routeStart=cleanProfileValue(src['INICIAR ROTA']);
 const [vipBlip,vipSpawn]=splitCoordPair(src['GARAGEM VIP FAC']),[pubBlip,pubSpawn]=splitCoordPair(src['GARAGEM PUBLICA']);
 if(cleanProfileValue(src.BARBEARIA))b.barbearia=cleanProfileValue(src.BARBEARIA);
 if(cleanProfileValue(src.BAU))b.bau=cleanProfileValue(src.BAU);
 if(cleanProfileValue(src['LOJA DE ROUPAS']))b.lojaRoupas=cleanProfileValue(src['LOJA DE ROUPAS']);
 if(vipBlip){b.garagemVipBlip=vipBlip;b.garagemVip=true} if(vipSpawn)b.garagemVipSpawn=vipSpawn;
 if(pubBlip){b.garagemPublicaBlip=pubBlip;b.garagemPublica=true} if(pubSpawn)b.garagemPublicaSpawn=pubSpawn;
 if(cleanProfileValue(src['SHOP EXCLUSIVO']))b.shopExclusivo=cleanProfileValue(src['SHOP EXCLUSIVO']);
 if(craft)b.craft=craft;if(routeStart)b.rotaExclusiva=true;
 t.craft=t.craft||{receitas:[]};if(craft)t.craft.cds=craft;
 t.rota=t.rota||{};if(routeStart)t.rota.inicio=routeStart;
 t.estruturaExtra={...(t.estruturaExtra||{}),coordenadaBase:cleanProfileValue(src.COORDENADA||''),garagemDeluxe:cleanProfileValue(src['GARAGEM DELUXE']||''),shopDeluxe:cleanProfileValue(src['SHOP DELUXE']||''),academia:cleanProfileValue(src.ACADEMIA||''),bar:cleanProfileValue(src.BAR||''),fontePerfil:GROUP_PROFILE_SOURCE_VERSION};
 if(correction.state==='SEM_CRAFT'){b.craft='';t.craft={...(t.craft||{}),cds:'',ativo:false,receitas:[]};}
 if(correction.state==='REMOVIDO'){t.estruturaExtra={...(t.estruturaExtra||{}),removido:true};}
 const patch={beneficios:b,perfilTecnico:t,perfilFonte:{...src,versao:GROUP_PROFILE_SOURCE_VERSION},perfilBase:{cds:correction.cds||f?.cds||'',situacao:correction.state||'BASE',fonte:'Conferência manual 07/09/2026'}};
 if(correction.cds)patch.cds=correction.cds;
 if(correction.state==='REMOVIDO'){patch.removido=true;patch.status='INATIVA';patch.observacoes=[f?.observacoes,'Group removido da cidade em 07/09/2026.'].filter(Boolean).join(' | ');}
 if(correction.state!=='REMOVIDO'&&f?.removido){patch.removido=false;}
 if(local&&!profileCoordLike(local)&&!/^N\/?A$/i.test(local))patch.qg=local;
 if(product&&/^(armas\d*|muni[cç][aã]o|drogas|lavagem|desmanche|ilegalmedic)$/i.test(product))patch.produto=product;
 return patch;
}
async function updateOfficialGroupProfiles(){
 if(String(currentProfile?.role||'').toUpperCase()!=='ADMIN')return alert('Apenas ADMIN pode atualizar os perfis dos Groups.');
 const keys=[...new Set([...Object.keys(GROUP_PROFILE_SOURCE),...Object.keys(GROUP_BASE_CORRECTIONS)])];const entries=keys.map(k=>[k,GROUP_PROFILE_SOURCE[k]||{}]);if(!entries.length)return alert('Nenhum perfil oficial carregado.');
 if(!confirm(`Atualizar ${entries.length} perfis técnicos com a base oficial de ${GROUP_PROFILE_SOURCE_VERSION}?\n\nA ocupação atual, líderes, status, histórico e receitas personalizadas serão preservados.`))return;
 try{let updated=0,missing=0;const batch=writeBatch(db);for(const [sourceGroup,src] of entries){const f=(faccoes||[]).find(x=>alvesNorm(x.group).replace(/\s+/g,'')===alvesNorm(sourceGroup).replace(/\s+/g,''));if(!f){missing++;continue}const patch=sourceToGroupPatch(f,src);batch.set(doc(db,'highos','data','faccoes',f.group),{...patch,updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true});updated++;}await batch.commit();await addDoc(histCol,{tipo:'ATUALIZACAO_PERFIS',descricao:`Perfis técnicos oficiais atualizados: ${updated} Group(s) · fonte ${GROUP_PROFILE_SOURCE_VERSION}`,usuario:currentUser.email,data:serverTimestamp()});await loadFaccoes();alert(`Perfis atualizados com sucesso.\n\nAtualizados: ${updated}\nSem Group correspondente na base atual: ${missing}\n\nFacções/ocupações existentes foram preservadas.`);}catch(e){alert('Erro ao atualizar perfis: '+e.message)}
}

// ===== HIGH OS V6.3 · PERFIL TÉCNICO INTEGRADO AO GROUP =====
// Craft não é uma página: receitas, farm e rota fazem parte do patrimônio permanente do Group/QG.
const ITEM_IMG_BASE='assets/itens/';
const ITEM_META={
 pistolbody:{nome:'Corpo de Pistola',imagem:'pistolbody.png'}, smgbody:{nome:'Corpo de Sub',imagem:'smgbody.png'}, riflebody:{nome:'Corpo de Rifle',imagem:'riflebody.png'},
 sheetmetal:{nome:'Chapa de Metal',imagem:'sheetmetal.png'}, dollar:{nome:'Dólar',imagem:'dollar.png'}, elastic:{nome:'Elástico',imagem:'elastic.png'}, rubber:{nome:'Borracha',imagem:'rubber.png'}, techtrash:{nome:'Lixo Eletrônico',imagem:'techtrash.png'},
 ziplock:{nome:'Ziplock',imagem:'ziplock.png'}, weedbud:{nome:'Bud de Maconha',imagem:'weedbud.png'}, projectile:{nome:'Projétil',imagem:'projectile.png'}, gunpowder:{nome:'Frasco de Pólvora',imagem:'gunpowder.png'},
 plastic:{nome:'Plástico',imagem:'plastic.png'}, explosives:{nome:'Explosivos',imagem:'explosives.png'}, misturaquimica:{nome:'Mistura Química',imagem:'misturaquimica.png'}, electroniccomponents:{nome:'Componentes Eletrônicos',imagem:'electroniccomponents.png'},
 washbleach:{nome:'Alvejante',imagem:'washbleach.png'}, alcohol:{nome:'Álcool',imagem:'alcohol.png'}, acetone:{nome:'Acetona',imagem:'acetone.png'}, sulfuric:{nome:'Ácido Sulfúrico',imagem:'sulfuric.png'}, acid:{nome:'Ácido',imagem:'acid.png'},
 tarp:{nome:'Lona',imagem:'tarp.png'}, fibrasin:{nome:'Fibra Sintética',imagem:'fibrasin.png'}, syringe:{nome:'Seringa',imagem:'syringe.png'}, saline:{nome:'Soro Fisiológico',imagem:'saline.png'}, paper:{nome:'Papel',imagem:'paper.png'},
 woodlog:{nome:'Tora de Madeira',imagem:'woodlog.png'}
};
const ARMAS_STANDARD_RECIPES=[
 {id:'ak74n',nome:'AK-74N',spawn:'WEAPON_ASSAULTRIFLE',imagem:'ak74n.png',nivel:5,max:10,insumos:[['riflebody',35],['sheetmetal',30],['dollar',70000]]},
 {id:'ak102',nome:'AK-102',spawn:'WEAPON_ASSAULTRIFLE_MK2',imagem:'ak102.png',nivel:5,max:10,insumos:[['riflebody',40],['sheetmetal',34],['dollar',46000]]},
 {id:'sigsauer556',nome:'Sig Sauer 556',spawn:'WEAPON_SPECIALCARBINE_MK2',imagem:'sigsauer556.png',nivel:5,max:10,insumos:[['riflebody',47],['sheetmetal',33],['dollar',70000]]},
 {id:'t54',nome:'T54',spawn:'WEAPON_PISTOL_MK2',imagem:'t54.png',nivel:5,max:10,insumos:[['pistolbody',22],['sheetmetal',12],['dollar',8500]]},
 {id:'f2000',nome:'F2000',spawn:'WEAPON_ASSAULTSMG',imagem:'f2000.png',nivel:5,max:10,insumos:[['smgbody',30],['sheetmetal',24],['dollar',31000]]},
 {id:'deagle',nome:'Deagle',spawn:'WEAPON_PISTOL50',imagem:'desert.png',nivel:5,max:10,insumos:[['pistolbody',16],['sheetmetal',13],['dollar',18000]]},
 {id:'m1922',nome:'M1922',spawn:'WEAPON_VINTAGEPISTOL',imagem:'m1922.png',nivel:5,max:10,insumos:[['pistolbody',11],['sheetmetal',9],['dollar',12000]]},
 {id:'tec9',nome:'Tec-9',spawn:'WEAPON_MACHINEPISTOL',imagem:'tec9.png',nivel:5,max:10,insumos:[['smgbody',25],['sheetmetal',19],['dollar',26000]]},
 {id:'fnfal',nome:'FN L1A1 / FN FAL',spawn:'WEAPON_FNFAL',imagem:'fnfal.png',nivel:5,max:10,insumos:[['riflebody',38],['sheetmetal',31],['dollar',70000]]}
].map(r=>({...r,origem:'PADRÃO DO SEGMENTO'}));
const MUNICAO_STANDARD_RECIPES=[
 {id:'ammo-pistol',nome:'Caixa de Munição de Pistola',spawn:'caixa_m_pistola',imagem:'caixa_m_pistola.png',insumos:[['projectile',12],['gunpowder',10]]},
 {id:'ammo-smg',nome:'Caixa de Munição de SMG',spawn:'caixa_m_smg',imagem:'caixa_m_smg.png',insumos:[['projectile',18],['gunpowder',17]]},
 {id:'ammo-rifle',nome:'Caixa de Munição de Rifle',spawn:'caixa_m_rifle',imagem:'caixa_m_rifle.png',insumos:[['projectile',31],['gunpowder',24]]},
 {id:'c4',nome:'C4',spawn:'c4',imagem:'c4.png',insumos:[['explosives',25],['plastic',10]]}
].map(r=>({...r,origem:'PADRÃO DO SEGMENTO'}));
const LAVAGEM_STANDARD_RECIPES=[
 {id:'pendrive1',nome:'Pendrive 1',spawn:'pendrive1',imagem:'pendrive1.png',insumos:[['electroniccomponents',12],['rubber',8]]},
 {id:'pendrive2',nome:'Pendrive 2',spawn:'pendrive2',imagem:'pendrive2.png',insumos:[['electroniccomponents',14],['rubber',10]]},
 {id:'pendrive3',nome:'Pendrive 3',spawn:'pendrive3',imagem:'pendrive3.png',insumos:[['electroniccomponents',19],['rubber',15]]},
 {id:'pendrive4',nome:'Pendrive 4',spawn:'pendrive4',imagem:'pendrive4.png',insumos:[['electroniccomponents',27],['rubber',23]]},
 {id:'pendrive5',nome:'Pendrive 5',spawn:'pendrive5',imagem:'pendrive5.png',insumos:[['electroniccomponents',40],['rubber',30]]},
 {id:'handcuff',nome:'Algema',spawn:'handcuff',imagem:'handcuff.png',insumos:[['sheetmetal',3]]},
 {id:'lavagem',nome:'Máquina de Lavagem',spawn:'lavagem',imagem:'lavagem.png',insumos:[['plastic',70],['electroniccomponents',50]]}
].map(r=>({...r,origem:'PADRÃO DO SEGMENTO'}));
const DESMANCHE_STANDARD_RECIPES=[
 {id:'blocksignal',nome:'Bloqueador de Sinal',spawn:'blocksignal',imagem:'blocksignal.png',insumos:[['techtrash',12],['elastic',10]]},
 {id:'lockpick',nome:'Gazua',spawn:'lockpick',imagem:'lockpick.png',insumos:[['elastic',14],['rubber',8]]},
 {id:'lockpickplus',nome:'Gazua ++',spawn:'lockpickplus',imagem:'lockpickplus.png',insumos:[['elastic',18],['rubber',13]]},
 {id:'card-illegible',nome:'Cartão Ilegível',spawn:'cardillegible',imagem:'cardillegible.png',insumos:[['elastic',7],['techtrash',8]]},
 {id:'dismantleplus',nome:'Desmanche ++',spawn:'dismantleplus',imagem:'dismantleplus.png',insumos:[['elastic',14],['techtrash',15]],bloqueado:true}
].map(r=>({...r,origem:'PADRÃO DO SEGMENTO'}));
const MEDIC_STANDARD_RECIPES=[
 {id:'adrenalineclandestine',nome:'Adrenalina Clandestina',spawn:'adrenalineclandestine',imagem:'adrenalina.png',insumos:[['syringe',12],['saline',10]]},
 {id:'infectedbandage',nome:'Bandagem Infectada',spawn:'infectedbandage',imagem:'infectedbandage.png',insumos:[['saline',20]]},
 {id:'adrenalineclandestineplus',nome:'Adrenalina Clandestina +',spawn:'adrenalineclandestineplus',imagem:'adrenalineclandestineplus.png',insumos:[['syringe',15],['saline',15]],bloqueado:true}
].map(r=>({...r,origem:'PADRÃO DO SEGMENTO'}));
const MECHANIC_STANDARD_RECIPES=[
 {id:'notebook',nome:'Notebook',spawn:'notebook',imagem:'notebook.png',insumos:[['techtrash',5],['plastic',5]]},
 {id:'racesticketplus',nome:'Ticket de Corrida +',spawn:'racesticketplus',imagem:'racesticketplus.png',insumos:[['paper',10]],bloqueado:true}
].map(r=>({...r,origem:'PADRÃO DO SEGMENTO'}));
const CONTRABANDO_STANDARD_RECIPES=[
 {id:'attachbox',nome:'Caixa de Attachments',spawn:'attachbox',imagem:'attachbox.png',insumos:[['woodlog',3],['sheetmetal',4]]},
 {id:'pager',nome:'Pager',spawn:'pager',imagem:'pager.png',insumos:[['plastic',6],['techtrash',4]]}
].map(r=>({...r,origem:'PADRÃO DO SEGMENTO'}));
const DRUG_COMMON_RECIPES=[
 {id:'hood',nome:'Capuz',spawn:'hood',imagem:'hood.png',insumos:[['tarp',5]]},
 {id:'ballisticplate',nome:'Placa Balística',spawn:'ballisticplate',imagem:'ballisticplate.png',insumos:[['tarp',12],['fibrasin',13]]}
].map(r=>({...r,origem:'PADRÃO DO SEGMENTO'}));
const DRUG_GROUP_RECIPES={
 Drogas01:[{id:'packdrug1',nome:'Pacote Selado de Metadona',spawn:'packdrug1',imagem:'packdrug1.png',insumos:[['alcohol',25],['ziplock',50]]}],
 Drogas03:[{id:'packdrug2',nome:'Pacote Selado de Heroína',spawn:'packdrug2',imagem:'packdrug2.png',insumos:[['acetone',25],['ziplock',50]]}],
 Drogas06:[{id:'packdrug3',nome:'Pacote Selado de Anfetamina',spawn:'packdrug3',imagem:'packdrug3.png',insumos:[['sulfuric',25],['ziplock',50]]}],
 Drogas09:[{id:'packdrug4',nome:'Pacote Selado de Crack',spawn:'packdrug4',imagem:'packdrug4.png',insumos:[['acid',25],['ziplock',50]]}]
};
Object.values(DRUG_GROUP_RECIPES).forEach(list=>list.forEach(r=>r.origem='PADRÃO DO GROUP'));
const GROUP_EXTRA_RECIPES={
 Municao10:[{id:'extra-t54',nome:'T54',spawn:'WEAPON_PISTOL_MK2',imagem:'t54.png',nivel:5,max:10,origem:'CRAFT ADQUIRIDO',insumos:[['pistolbody',22],['sheetmetal',12],['dollar',8500]]}],
 Lavagem02:[{id:'extra-paradise-glock',nome:'Paradise Glock',spawn:'WEAPON_PARADISE_GLOCK',imagem:'glock.png',origem:'CRAFT EXTRA DO GROUP',insumos:[['pistolbody',20],['sheetmetal',21],['dollar',35000]]}],
 Manicomio:[
  {id:'extra-paradise-glock',nome:'Paradise Glock',spawn:'WEAPON_PARADISE_GLOCK',imagem:'glock.png',origem:'CRAFT EXTRA DO GROUP',insumos:[['pistolbody',20],['sheetmetal',21],['dollar',35000]]},
  {id:'extra-lockpickplus',nome:'Gazua ++',spawn:'lockpickplus',imagem:'lockpickplus.png',origem:'CRAFT EXTRA DO GROUP',insumos:[['elastic',17],['rubber',13]]},
  {id:'extra-hood',nome:'Capuz',spawn:'hood',imagem:'hood.png',origem:'CRAFT EXTRA DO GROUP',insumos:[['tarp',5]]}
 ]
};
function segmentKey(v=''){return alvesNorm(String(v)).replace(/[^a-z0-9]/g,'')}
function standardRecipesForGroup(f={}){
 if(f.semCraft||GROUP_BASE_CORRECTIONS?.[f.group]?.state==='SEM_CRAFT')return [];
 const k=segmentKey(f.segmento),g=String(f.group||'');let base=[];
 if(k==='armas')base=ARMAS_STANDARD_RECIPES;
 else if(k==='municao')base=MUNICAO_STANDARD_RECIPES;
 else if(k==='lavagem')base=LAVAGEM_STANDARD_RECIPES;
 else if(k==='desmanche')base=DESMANCHE_STANDARD_RECIPES;
 else if(k==='hospitalilegal'||k==='ilegalmedic')base=MEDIC_STANDARD_RECIPES;
 else if(k==='mecanicaillegal'||k==='ilegalmechanic')base=MECHANIC_STANDARD_RECIPES;
 else if(k==='contrabando')base=CONTRABANDO_STANDARD_RECIPES;
 else if(k==='drogas')base=[...DRUG_COMMON_RECIPES,...(DRUG_GROUP_RECIPES[g]||[])];
 if(g==='Manicomio')base=[...DRUG_COMMON_RECIPES];
 return [...base,...(GROUP_EXTRA_RECIPES[g]||[])].map(recipeNormalize);
}
function mergeRecipeLists(base=[],saved=[]){
 const out=[],idx=new Map();
 [...base,...saved].forEach(raw=>{const r=recipeNormalize(raw),key=String(r.spawn||r.id||r.nome).toLowerCase();if(!key)return;if(idx.has(key))out[idx.get(key)]={...out[idx.get(key)],...r,insumos:(r.insumos?.length?r.insumos:out[idx.get(key)].insumos)};else{idx.set(key,out.length);out.push(r)}});return out;
}
let techDraft={craft:{cds:'',nome:'',receitas:[]},farm:{cds:'',itens:[]},rota:{nome:'',inicio:'',pontos:''},estruturaExtra:{}};
function clonePlain(v){return JSON.parse(JSON.stringify(v??null))}
// Imagens oficiais dos produtos conforme a Tabela Mercado Negro.
// Para estes spawns o arquivo oficial SEMPRE prevalece sobre valores antigos salvos no Firestore.
const PRODUCT_IMAGE_BY_SPAWN={
 'weapon_vintagepistol':'m1922.png',
 'weapon_pistol_mk2':'t54.png',
 'weapon_pistol50':'desert.png',
 'weapon_machinepistol':'tec9.png',
 'weapon_assaultsmg':'f2000.png',
 'weapon_fnfal':'fnfal.png',
 'weapon_specialcarbine_mk2':'sigsauer556.png',
 'weapon_assaultrifle_mk2':'ak102.png',
 'weapon_assaultrifle':'ak74n.png'
};
const PRODUCT_IMAGE_BY_NAME={
 'm1922':'m1922.png','pistola m1922':'m1922.png',
 't54':'t54.png','pistola t54':'t54.png',
 'deagle':'desert.png','desert eagle':'desert.png','pistola desert eagle':'desert.png',
 'tec-9':'tec9.png','tec9':'tec9.png',
 'f2000':'f2000.png','f2000 - mtar.':'f2000.png','f2000 - mtar':'f2000.png',
 'fn l1a1 / fn fal':'fnfal.png','fn l1a1':'fnfal.png','fn fal':'fnfal.png','fal':'fnfal.png','fall':'fnfal.png',
 'sig sauer 556':'sigsauer556.png','g3 - sig sauer':'sigsauer556.png',
 'ak-102':'ak102.png','ak102':'ak102.png',
 'ak-74n':'ak74n.png','ak74n':'ak74n.png'
};
function canonicalProductImage(spawn='',nome='',imagem=''){
 const sp=String(spawn||'').trim().toLowerCase();
 if(PRODUCT_IMAGE_BY_SPAWN[sp])return PRODUCT_IMAGE_BY_SPAWN[sp];
 const nm=alvesNorm(String(nome||'')).trim();
 if(PRODUCT_IMAGE_BY_NAME[nm])return PRODUCT_IMAGE_BY_NAME[nm];
 return String(imagem||'').trim()||String(spawn||'').trim()+'.png';
}
function itemImg(spawn='',imagem='',nome=''){const f=canonicalProductImage(spawn,nome,imagem);return ITEM_IMG_BASE+encodeURIComponent(f).replace(/%2F/gi,'/')}
function recipeNormalize(r={}){return {id:r.id||('r_'+Math.random().toString(36).slice(2,9)),nome:r.nome||'',spawn:r.spawn||'',imagem:canonicalProductImage(r.spawn,r.nome,r.imagem),nivel:r.nivel||'',max:r.max||'',origem:r.origem||'EXTRA DO GROUP',insumos:(r.insumos||[]).map(x=>Array.isArray(x)?{spawn:x[0],qtd:x[1],nome:ITEM_META[x[0]]?.nome||x[0],imagem:ITEM_META[x[0]]?.imagem||''}:{spawn:x.spawn||'',qtd:x.qtd??'',nome:x.nome||ITEM_META[x.spawn]?.nome||x.spawn||'',imagem:x.imagem||ITEM_META[x.spawn]?.imagem||''})};}
const NON_ROUTE_CRAFT_ITEMS=new Set(['dollar','money','cash','dirtymoney','black_money']);
function farmItemsFromCraft(receitas=[]){
 const map=new Map();
 (receitas||[]).forEach(r=>(r.insumos||[]).forEach(x=>{
  const spawn=String(x.spawn||'').trim();if(!spawn||NON_ROUTE_CRAFT_ITEMS.has(spawn.toLowerCase()))return;
  const key=spawn.toLowerCase(),cur=map.get(key)||{nome:x.nome||ITEM_META[spawn]?.nome||spawn,spawn,imagem:x.imagem||ITEM_META[spawn]?.imagem||'',origem:'CRAFT',receitas:[],quantidades:[]};
  if(r.nome&&!cur.receitas.includes(r.nome))cur.receitas.push(r.nome);if(x.qtd!==''&&x.qtd!=null&&!cur.quantidades.includes(String(x.qtd)))cur.quantidades.push(String(x.qtd));map.set(key,cur);
 }));
 return [...map.values()].map(x=>({...x,qtd:'',detalhe:`Usado em ${x.receitas.length} receita(s)${x.quantidades.length?' • necessidade: x'+x.quantidades.join('/x'):''}`}));
}
function syncFarmWithCraft(profile=techDraft){
 if(!profile?.craft||!profile?.farm)return profile;
 const auto=farmItemsFromCraft(profile.craft.receitas||[]),manual=(profile.farm.itens||[]).filter(x=>String(x.origem||'').toUpperCase()!=='CRAFT');
 const autoKeys=new Set(auto.map(x=>String(x.spawn||'').toLowerCase()));
 profile.farm.itens=[...auto,...manual.filter(x=>!autoKeys.has(String(x.spawn||'').toLowerCase()))];
 return profile;
}
function defaultTechProfile(f={}){
 const b=f.beneficios||{},base=standardRecipesForGroup(f);
 const names={armas:'Armas de Pequeno, Médio e Grande Calibre',municao:'Munições e Explosivos',lavagem:'Lavagem / Pendrives',desmanche:'Desmanche',drogas:'Drogas',hospitalilegal:'Hospital Ilegal',ilegalmedic:'Hospital Ilegal',mecanicaillegal:'Mecânica Ilegal',ilegalmechanic:'Mecânica Ilegal',contrabando:'Contrabando'};
 const out={craft:{cds:b.craft||'',nome:names[segmentKey(f.segmento)]||'',receitas:base},farm:{cds:b.farm||'',itens:[]},rota:{nome:b.rotaExclusiva?`RotaExclusiva${f.group||''}`:'',inicio:'',pontos:b.rotaBlips||''},estruturaExtra:{}};return syncFarmWithCraft(out);
}
function mergedTechProfile(f={}){
 const d=defaultTechProfile(f),p=clonePlain(f.perfilTecnico||{})||{};
 const semCraft=!!(f.semCraft||GROUP_BASE_CORRECTIONS?.[f.group]?.state==='SEM_CRAFT'||p?.craft?.ativo===false);
 const saved=Array.isArray(p?.craft?.receitas)?p.craft.receitas:[];
 const receitas=semCraft?[]:mergeRecipeLists(d.craft.receitas,saved);
 const out={craft:{cds:p?.craft?.cds??d.craft.cds,nome:p?.craft?.nome??d.craft.nome,ativo:!semCraft,receitas},farm:{cds:p?.farm?.cds??d.farm.cds,itens:Array.isArray(p?.farm?.itens)?p.farm.itens.map(x=>({...x})):[]},rota:{nome:p?.rota?.nome??d.rota.nome,inicio:p?.rota?.inicio??d.rota.inicio,pontos:p?.rota?.pontos??d.rota.pontos,origem:p?.rota?.origem||''},estruturaExtra:{...(d.estruturaExtra||{}),...(p?.estruturaExtra||{})}};return syncFarmWithCraft(out);
}
function renderTechProfile(f){
 techDraft=mergedTechProfile(f);$('#fTechCraftCds').value=techDraft.craft.cds||'';$('#fTechCraftNome').value=techDraft.craft.nome||'';$('#fTechFarmCds').value=techDraft.farm.cds||'';$('#fTechRouteName').value=techDraft.rota.nome||'';$('#fTechRouteStart').value=techDraft.rota.inicio||'';$('#fTechRoutePoints').value=techDraft.rota.pontos||'';renderCraftRecipes();renderFarmItems();renderRouteOverview();renderStructureSnapshot(f);renderConnectedRequests();
}
function getTechProfileFromForm(){
 if(!techDraft)techDraft={craft:{receitas:[]},farm:{itens:[]},rota:{}};
 techDraft.craft.cds=$('#fTechCraftCds')?.value.trim()||'';techDraft.craft.nome=$('#fTechCraftNome')?.value.trim()||'';techDraft.farm.cds=$('#fTechFarmCds')?.value.trim()||'';techDraft.rota.nome=$('#fTechRouteName')?.value.trim()||'';techDraft.rota.inicio=$('#fTechRouteStart')?.value.trim()||'';techDraft.rota.pontos=$('#fTechRoutePoints')?.value.trim()||'';
 // manter compatibilidade com campos legados da estrutura
 if($('#fCraft'))$('#fCraft').value=techDraft.craft.cds;if($('#fFarm'))$('#fFarm').value=techDraft.farm.cds;if($('#fRotaBlips'))$('#fRotaBlips').value=techDraft.rota.pontos;techDraft.rota.nome=$('#fRotaExclusiva')?.checked?`RotaExclusiva${$('#fGroup')?.value||''}`:'';
 syncFarmWithCraft(techDraft);renderFarmItems();return clonePlain(techDraft);
}
function recipeCard(r,i){const ins=(r.insumos||[]).map((x,j)=>`<div class="tech-ingredient"><img src="${esc(itemImg(x.spawn,x.imagem))}" onerror="this.style.opacity=.18"><div><b>${esc(x.nome||x.spawn||'Item')}</b><span>${esc(x.spawn||'—')} • x${esc(x.qtd)}</span></div><button type="button" class="tech-remove" data-remove-ing="${i}:${j}" title="Remover">×</button></div>`).join('');return `<article class="tech-recipe-card"><div class="tech-recipe-art"><img src="${esc(itemImg(r.spawn,r.imagem,r.nome))}" onerror="this.style.opacity=.18"></div><div class="tech-recipe-body"><div class="tech-recipe-title"><div><b>${esc(r.nome||'Receita')}</b><span>${esc(r.spawn||'SEM SPAWN')}</span></div><em>${esc(r.origem||'GROUP')}</em></div><div class="tech-recipe-kpis"><span>NÍVEL <b>${esc(r.nivel||'—')}</b></span><span>MÁX. <b>${esc(r.max||'—')}</b></span><span>INSUMOS <b>${r.insumos?.length||0}</b></span></div><div class="tech-ingredients">${ins||'<small class="muted">Sem insumos cadastrados.</small>'}</div><div class="tech-recipe-actions admin-only"><button type="button" class="mini-btn" data-edit-recipe="${i}">EDITAR</button><button type="button" class="mini-btn danger" data-remove-recipe="${i}">REMOVER DO GROUP</button></div></div></article>`}
function renderCraftRecipes(){const box=$('#groupCraftRecipes');if(!box)return;const rs=techDraft?.craft?.receitas||[];$('#techCraftSummary').textContent=`${rs.length} receita(s) vinculada(s) a este Group`;box.innerHTML=rs.length?rs.map(recipeCard).join(''):'<div class="delivery-no-change">Nenhuma receita vinculada a este Group.</div>';box.querySelectorAll('[data-remove-recipe]').forEach(b=>b.onclick=()=>{techDraft.craft.receitas.splice(+b.dataset.removeRecipe,1);syncFarmWithCraft();renderCraftRecipes();renderFarmItems();updateDeliveryPreview();renderConnectedRequests()});box.querySelectorAll('[data-edit-recipe]').forEach(b=>b.onclick=()=>editRecipe(+b.dataset.editRecipe));box.querySelectorAll('[data-remove-ing]').forEach(b=>b.onclick=()=>{const [ri,ii]=b.dataset.removeIng.split(':').map(Number);techDraft.craft.receitas[ri].insumos.splice(ii,1);syncFarmWithCraft();renderCraftRecipes();renderFarmItems();updateDeliveryPreview();renderConnectedRequests()});}
function editRecipe(i){const r=techDraft.craft.receitas[i];if(!r)return;const nome=prompt('Nome do produto:',r.nome);if(nome===null)return;const spawn=prompt('Spawn do produto:',r.spawn);if(spawn===null)return;const nivel=prompt('Nível:',r.nivel||'');if(nivel===null)return;const max=prompt('Máximo / lote:',r.max||'');if(max===null)return;const ing=prompt('Insumos — um por linha: spawn|nome|quantidade\nEx.: pistolbody|Corpo de Pistola|22',(r.insumos||[]).map(x=>`${x.spawn}|${x.nome}|${x.qtd}`).join('\n'));if(ing===null)return;r.nome=nome.trim();r.spawn=spawn.trim();r.nivel=nivel.trim();r.max=max.trim();r.insumos=ing.split(/\r?\n/).map(l=>l.split('|')).filter(a=>a[0]?.trim()).map(a=>{const sp=a[0].trim();return {spawn:sp,nome:(a[1]||ITEM_META[sp]?.nome||sp).trim(),qtd:(a[2]||'').trim(),imagem:ITEM_META[sp]?.imagem||''}});r.origem=r.origem||'EXTRA DO GROUP';syncFarmWithCraft();renderCraftRecipes();renderFarmItems();updateDeliveryPreview();renderConnectedRequests();}
function addRecipe(){const r=recipeNormalize({origem:'EXTRA DO GROUP'});techDraft.craft.receitas.push(r);editRecipe(techDraft.craft.receitas.length-1);if(!r.nome&&!r.spawn){techDraft.craft.receitas=techDraft.craft.receitas.filter(x=>x!==r)}syncFarmWithCraft();renderCraftRecipes();renderFarmItems();}
function farmItemCard(x,i){const auto=String(x.origem||'').toUpperCase()==='CRAFT';return `<div class="tech-farm-item route-item-card"><div class="route-item-art"><img src="${esc(itemImg(x.spawn,x.imagem))}" onerror="this.style.opacity=.18"></div><div class="route-item-copy"><b>${esc(x.nome||x.spawn||'Item')}</b><span>${esc(x.spawn||'—')}</span><small>${auto?'VINCULADO AO CRAFT':esc(x.qtd||x.detalhe||'ITEM MANUAL')}</small></div>${auto?'':`<div class="route-item-actions"><button type="button" class="mini-btn admin-only" data-edit-farm="${i}">EDITAR</button><button type="button" class="tech-remove admin-only" data-remove-farm="${i}">×</button></div>`}</div>`}
function renderFarmItems(){const box=$('#groupFarmItems');if(!box)return;const xs=techDraft?.farm?.itens||[];box.innerHTML=xs.length?xs.map(farmItemCard).join(''):'<div class="route-empty"><b>NENHUM ITEM VINCULADO</b><span>Cadastre receitas no Craft para os insumos aparecerem automaticamente aqui.</span></div>';box.querySelectorAll('[data-remove-farm]').forEach(b=>b.onclick=()=>{techDraft.farm.itens.splice(+b.dataset.removeFarm,1);renderFarmItems();renderConnectedRequests();updateDeliveryPreview()});box.querySelectorAll('[data-edit-farm]').forEach(b=>b.onclick=()=>editFarmItem(+b.dataset.editFarm));}
function editFarmItem(i){const x=techDraft.farm.itens[i];if(!x)return;const nome=prompt('Nome do item:',x.nome||'');if(nome===null)return;const spawn=prompt('Spawn do item:',x.spawn||'');if(spawn===null)return;const qtd=prompt('Quantidade / observação de coleta:',x.qtd||'');if(qtd===null)return;x.nome=nome.trim();x.spawn=spawn.trim();x.qtd=qtd.trim();x.imagem=ITEM_META[x.spawn]?.imagem||x.imagem||'';renderFarmItems();renderConnectedRequests();updateDeliveryPreview();}
function addFarmItem(){techDraft.farm.itens.push({nome:'',spawn:'',qtd:'',imagem:'',origem:'MANUAL'});editFarmItem(techDraft.farm.itens.length-1);techDraft.farm.itens=techDraft.farm.itens.filter(x=>x.nome||x.spawn);renderFarmItems();}
function routePointList(raw=''){
 const txt=String(raw||'').trim();if(!txt)return [];
 let pts=txt.split(/\r?\n|·/).map(x=>x.trim()).filter(Boolean);
 if(pts.length<=1){const found=txt.match(/\{?\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?(?:\s*,\s*-?\d+(?:\.\d+)?)?\s*\}?/g);if(found?.length)pts=found.map(x=>x.trim())}
 return pts;
}
function setRouteExclusive(value){
 const cb=$('#fRotaExclusiva');if(!cb)return;cb.checked=!!value;
 if(techDraft?.rota)techDraft.rota.nome=cb.checked?`RotaExclusiva${$('#fGroup')?.value||''}`:'';
 renderRouteOverview();updateDeliveryPreview();renderConnectedRequests();
}
function renderRouteOverview(){
 const exclusive=!!$('#fRotaExclusiva')?.checked,pts=routePointList(techDraft?.rota?.pontos||$('#fTechRoutePoints')?.value||''),start=techDraft?.rota?.inicio||$('#fTechRouteStart')?.value||'';
 $('#routeTypeLabel')&&( $('#routeTypeLabel').textContent=exclusive?'ROTA EXCLUSIVA':'ROTA PADRÃO');
 $('#routeTypeHelp')&&( $('#routeTypeHelp').textContent=exclusive?'Este Group possui uma rota própria de farm.':'Utiliza a rota padrão do segmento.');
 $('#routePointCount')&&( $('#routePointCount').textContent=exclusive?String(pts.length):'—');
 $('#routePointHint')&&( $('#routePointHint').textContent=exclusive?(pts.length?`${pts.length} coordenada(s) cadastrada(s).`:'Ainda sem CDS cadastradas.'):'Não se aplica à rota padrão.');
 $('#routeStartDisplay')&&( $('#routeStartDisplay').textContent=start||'—');
 document.querySelectorAll('[data-route-exclusive]').forEach(b=>b.classList.toggle('active',String(+exclusive)===b.dataset.routeExclusive));
 const ex=$('#exclusiveRouteBox');if(ex)ex.classList.toggle('hidden',!exclusive);
 $('#exclusiveRouteSummary')&&( $('#exclusiveRouteSummary').textContent=`${pts.length} CDS cadastrada${pts.length===1?'':'s'}`);
 const list=$('#routePointsList');if(list)list.innerHTML=pts.length?pts.map((pt,i)=>`<div class="route-point-row"><span>${String(i+1).padStart(2,'0')}</span><code>${esc(pt)}</code></div>`).join(''):'<div class="route-empty"><b>SEM CDS</b><span>Adicione as coordenadas da rota exclusiva no editor abaixo.</span></div>';
}
function toggleRoutePoints(){const drawer=$('#routePointsDrawer'),btn=$('#routePointsToggleBtn');if(!drawer||!btn)return;const willOpen=drawer.classList.contains('hidden');drawer.classList.toggle('hidden',!willOpen);btn.textContent=willOpen?'OCULTAR CDS DA ROTA':'VER CDS DA ROTA';}
function renderStructureSnapshot(f=currentFactionFromForm()){const b=f?.beneficios||getFormBenefits(),t=techDraft||mergedTechProfile(f),items=[];const add=(n,v)=>{if(v)items.push([n,v])};add('Craft',t.craft?.cds||b.craft);add('Farm / Início',t.rota?.inicio||t.farm?.cds||b.farm);add('Tipo da Rota',b.rotaExclusiva?`Exclusiva • ${routePointList(t.rota?.pontos||b.rotaBlips).length} CDS`:'Padrão');add('Garagem Pública',[b.garagemPublicaBlip,b.garagemPublicaSpawn].filter(Boolean).join(' / '));add('Garagem VIP',[b.garagemVipBlip,b.garagemVipSpawn].filter(Boolean).join(' / '));add('Heliponto',[b.helipontoBlip,b.helipontoSpawn].filter(Boolean).join(' / '));add('Rádio',b.radio);add('Baú',b.bau);add('Loja de Roupas',b.lojaRoupas);add('Barbearia',b.barbearia);add('Tatuagem',b.tatuagem);add('Shop Exclusivo',b.shopExclusivo);add('Arena',b.arena);add('Telão',b.telaoCds||b.telaoNome);Object.entries(t.estruturaExtra||{}).forEach(([k,v])=>{if(v&&k!=='fontePerfil')add(({coordenadaBase:'Coordenada Base',garagemDeluxe:'Garagem Deluxe',shopDeluxe:'Shop Deluxe',academia:'Academia',bar:'Bar'}[k]||k),v)});const box=$('#groupStructureSnapshot');if(box)box.innerHTML=items.length?items.map(([n,v])=>`<div class="structure-chip"><span>${esc(n)}</span><b>${esc(v)}</b></div>`).join(''):'<div class="delivery-no-change">Nenhuma estrutura técnica cadastrada.</div>';}
function techChanged(oldF,newF){return JSON.stringify(mergedTechProfile(oldF))!==JSON.stringify(newF.perfilTecnico||mergedTechProfile(newF))}
function techAutoRequests(f=currentFactionFromForm()){
 const old=faccoes.find(x=>x.group===f.group)||{},now=f.perfilTecnico||getTechProfileFromForm(),oldT=mergedTechProfile(old),out=[];
 if(JSON.stringify(oldT.craft)!==JSON.stringify(now.craft)){
  const lines=['Assunto: Atualização do Craft do Group','','Solicitação:','',`- Atualizar o Craft do Group ${f.group};`,now.craft.cds?`- CDS do Craft: ${fmtCds(now.craft.cds)}`:'','', '- Produtos / receitas:'];
  (now.craft.receitas||[]).forEach(r=>{lines.push(`- ${r.nome}${r.spawn?` (${r.spawn})`:''}${r.nivel?` | Nível ${r.nivel}`:''}${r.max?` | Máx. ${r.max}`:''}`);lines.push(`  Receita: ${(r.insumos||[]).map(x=>`${x.nome||x.spawn} x${x.qtd}`).join(' + ')||'Sem insumos cadastrados'}`)});lines.push('',`- Permissão: ${f.group}.`);out.push({tipo:'ITENS',titulo:'Atualização de Craft / Receitas',texto:lines.filter((x,i)=>x!==''||lines[i-1]!=='').join('\n')});
 }
 if(JSON.stringify(oldT.farm)!==JSON.stringify(now.farm)||JSON.stringify(oldT.rota)!==JSON.stringify(now.rota)){
  const pts=String(now.rota?.pontos||'').split(/\r?\n|·/).map(x=>x.trim()).filter(Boolean),routeStart=String(now.rota?.inicio||'').trim(),items=(now.farm?.itens||[]).map(x=>`- ${x.nome||x.spawn}${x.spawn?` (${x.spawn})`:''}${x.qtd?` — ${x.qtd}`:''}${x.detalhe?` — ${x.detalhe}`:''}`);
  out.push({tipo:'ROTA_FARM',titulo:'Farm / Rota do Group',texto:['Assunto: Ativação / atualização de rota de farm exclusiva','','Solicitação:','',`- Group: ${f.group}`,now.farm?.cds?`- Farm: ${fmtCds(now.farm.cds)}`:'',now.rota?.nome?`- Rota: ${now.rota.nome}`:'',routeStart?`- Início da rota: ${fmtCds(routeStart)}`:'','',...(items.length?['- Itens do Farm:',...items,'']:[]),'- Blips da rota:',...(pts.length?pts:['{ CDS },'])].filter(Boolean).join('\n')});
 }
 return out;
}
const _autoDeliveryRequestsV62=autoDeliveryRequests;autoDeliveryRequests=function(f=currentFactionFromForm()){return [..._autoDeliveryRequestsV62(f),...techAutoRequests(f)]};
const _updateDeliveryPreviewV62=updateDeliveryPreview;updateDeliveryPreview=function(){getTechProfileFromForm();_updateDeliveryPreviewV62();try{renderStructureSnapshot(currentFactionFromForm());renderConnectedRequests()}catch{}};
function renderConnectedRequests(){const box=$('#groupConnectedRequests');if(!box)return;let rs=[];try{rs=autoDeliveryRequests(currentFactionFromForm())}catch{}box.innerHTML=rs.length?rs.map((r,i)=>`<article class="delivery-request-card"><div><b>${i+1}. ${esc(r.titulo)}</b><span>${esc(r.tipo)}</span></div><pre>${esc(r.texto)}</pre></article>`).join(''):'<div class="delivery-no-change">Nenhuma solicitação técnica pendente pelas alterações atuais.</div>';}
$('#addCraftRecipeBtn')?.addEventListener('click',addRecipe);$('#addFarmItemBtn')?.addEventListener('click',addFarmItem);$('#routePointsToggleBtn')?.addEventListener('click',toggleRoutePoints);document.querySelectorAll('[data-route-exclusive]').forEach(b=>b.addEventListener('click',()=>setRouteExclusive(b.dataset.routeExclusive==='1')));$('#fRotaExclusiva')?.addEventListener('change',renderRouteOverview);
['fTechCraftCds','fTechCraftNome','fTechFarmCds','fTechRouteName','fTechRouteStart','fTechRoutePoints'].forEach(id=>$('#'+id)?.addEventListener('input',()=>{getTechProfileFromForm();renderRouteOverview();renderConnectedRequests();renderStructureSnapshot(currentFactionFromForm());}));
document.querySelectorAll('.tech-tab').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.tech-tab').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.tech-panel').forEach(p=>p.classList.toggle('active',p.dataset.techPanel===b.dataset.techTab));if(b.dataset.techTab==='farm')renderRouteOverview();if(b.dataset.techTab==='estrutura')renderStructureSnapshot(currentFactionFromForm());if(b.dataset.techTab==='solicitacoes')renderConnectedRequests()}));

// Alvesinho usa o mesmo perfil do Group — sem base paralela.
const _alvesAnswerV63Base=alvesAnswer;alvesAnswer=function(question=''){
 const q=alvesNorm(question),g=alvesFindGroup(question);if(g){const t=mergedTechProfile(g);
  if(q.includes('craft')||q.includes('fabric')||q.includes('receita')){const rs=t.craft?.receitas||[];const hit=rs.find(r=>q.includes(alvesNorm(r.nome))||q.includes(alvesNorm(r.spawn)));if(hit)return {text:`${hit.nome}${hit.spawn?' ('+hit.spawn+')':''}\n${hit.nivel?'Nível: '+hit.nivel+' • ':''}${hit.max?'Máx.: '+hit.max:''}\nReceita / insumos:\n${(hit.insumos||[]).map(x=>`• ${x.nome||x.spawn} x${x.qtd}`).join('\n')||'• Sem insumos cadastrados'}`,refs:[g.group,'Perfil Técnico','Craft']};return {text:rs.length?`Craft de ${g.group} (${rs.length} receita(s)):\n${rs.map(r=>`• ${r.nome}${r.spawn?' ('+r.spawn+')':''}`).join('\n')}`:`${g.group} não possui receitas de Craft cadastradas.`,refs:[g.group,'Perfil Técnico','Craft']};}
  if((q.includes('farm')||q.includes('insumo'))&&!q.includes('receita')){const xs=t.farm?.itens||[];return {text:xs.length?`Farm / Insumos de ${g.group}:\n${xs.map(x=>`• ${x.nome||x.spawn}${x.spawn?' ('+x.spawn+')':''}${x.qtd?' — '+x.qtd:''}${x.detalhe?' — '+x.detalhe:''}`).join('\n')}`:`Nenhum insumo de Craft está disponível na rota de ${g.group}.`,refs:[g.group,'Perfil Técnico','Farm']};}
  if(q.includes('rota')){const xs=t.farm?.itens||[],exclusive=!!g.beneficios?.rotaExclusiva,pts=routePointList(t.rota?.pontos||g.beneficios?.rotaBlips||'');return {text:`Rota de ${g.group}:\nTipo: ${exclusive?'EXCLUSIVA':'PADRÃO'}\n${t.rota?.inicio?`Início: ${t.rota.inicio}\n`:''}${exclusive?`CDS da rota exclusiva: ${pts.length} ponto(s) cadastrado(s).\n`:''}Itens coletados para o Craft:\n${xs.length?xs.map(x=>`• ${x.nome||x.spawn}${x.spawn?' ('+x.spawn+')':''}`).join('\n'):'• Nenhum insumo de Craft vinculado.'}`,refs:[g.group,'Perfil Técnico','Rota','Craft']};}
 }
 return _alvesAnswerV63Base(question);
};

// HIGH OS V6.4 · ação de atualização da base técnica
$('#updateProfilesBtn')?.addEventListener('click',updateOfficialGroupProfiles);

// HIGH OS V6.6 · Farm/Rota sincronizados automaticamente com os insumos do Craft.

// HIGH OS V6.7 · Perfil do Group em página + Rota Padrão/Exclusiva organizada.

// HIGH OS V6.9 · Fluxo correto: Perfil → comparação → Solicitação. Exceção: Rota Exclusiva, em que a Solicitação com CDS do takefarm alimenta o Perfil Técnico.

// HIGH OS V7.2 · Perfil Operacional completo do Group/QG
const OPERATIONAL_PROFILE_VERSION='07/09/2026 · Perfil Operacional V7.2';
const OP_KNOWN_EXTRAS={
 Armas02:{telao:{ativo:true,tipo:'Hall',modelo:'paradise_telao01a',postit:'2685.14,3386.41,61.70',cds:'2684.81,3386.92,58.82,164.41',permissao:'Armas02',sons:['2662.59,3397.22,58.82,286.3','2691.1,3386.87,60.57,331.66','2720.27,3419.87,59.08,107.72','2654.06,3417.68,57.71,187.09']}},
 Desmanche07:{lojaFac:{cds:'2189.12,4670.27,37.54,325.99'},barbearia:{cds:'2268.74,4607.04,37.59,59.53'},tatuagem:{cds:'2288.37,4562.1,37.66,323.15'},roupas:{cds:'2273.21,4608.11,37.59,130.4'},garagens:[{tipo:'PUBLICA',blip:'2193.82,4616.75,39.38,147.41',spawn:'2192.91,4609.84,38.75,325.99'},{tipo:'PUBLICA_2',blip:'2196.19,4617.57,39.38,136.07',spawn:'2194.11,4610.75,39.38,136.07'},{tipo:'SERVICO',blip:'2222.68,4612.5,37.54,345.83',spawn:'2227.86,4612.09,37.31,56.7'}],helipontos:[{blip:'2199.82,4614.74,39.38,133.23',spawn:'2194.11,4610.75,39.38,136.07'}]},
 Municao10:{telao:{ativo:false,tipo:'',modelo:'',postit:'',cds:'',permissao:'Municao10',sons:[]}}
};
function opPair(v=''){const parts=String(v||'').replace(/\t/g,' ').split(/\s*\/\s*/).map(x=>x.trim()).filter(Boolean);return {blip:parts[0]||'',spawn:parts[1]||''}}
function opBlank(){return {localizacao:{nome:'',cdsPrincipal:''},lojaFac:{cds:''},bar:{cds:''},barbearia:{cds:''},tatuagem:{cds:''},roupas:{cds:''},uniforme:{local:'',arquivo:''},arena:{cds:''},garagens:[],helipontos:[],blindados:{vagas:'',blip:'',spawn:'',veiculos:''},telao:{ativo:false,tipo:'',modelo:'',postit:'',cds:'',permissao:'',sons:['','','','']}}}
function opMerge(a={},b={}){const out={...opBlank(),...clonePlain(a||{}),...clonePlain(b||{})};['localizacao','lojaFac','bar','barbearia','tatuagem','roupas','uniforme','arena','blindados','telao'].forEach(k=>out[k]={...(opBlank()[k]||{}),...(a?.[k]||{}),...(b?.[k]||{})});out.garagens=Array.isArray(b?.garagens)&&b.garagens.length?clonePlain(b.garagens):Array.isArray(a?.garagens)?clonePlain(a.garagens):[];out.helipontos=Array.isArray(b?.helipontos)&&b.helipontos.length?clonePlain(b.helipontos):Array.isArray(a?.helipontos)?clonePlain(a.helipontos):[];out.telao.sons=[...(b?.telao?.sons?.length?b.telao.sons:(a?.telao?.sons||[])),'','','',''].slice(0,4);return out}
function operationalFromExisting(f={}){
 const o=opBlank(),b=f.beneficios||{},src=f.perfilFonte||GROUP_PROFILE_SOURCE?.[f.group]||{},corr=GROUP_BASE_CORRECTIONS?.[f.group]||{};
 o.localizacao.nome=f.qg||cleanProfileValue(src.LOCAL||'');o.localizacao.cdsPrincipal=corr.cds||f.perfilBase?.cds||f.cds||cleanProfileValue(src.COORDENADA||'');
 o.barbearia.cds=b.barbearia||cleanProfileValue(src.BARBEARIA||'');o.tatuagem.cds=b.tatuagem||cleanProfileValue(src.TATUAGEM||'');o.roupas.cds=b.lojaRoupas||cleanProfileValue(src['LOJA DE ROUPAS']||'');o.lojaFac.cds=b.shopExclusivo||cleanProfileValue(src['SHOP EXCLUSIVO']||src['SHOP DELUXE']||'');o.bar.cds=cleanProfileValue(f.perfilTecnico?.estruturaExtra?.bar||src.BAR||'');o.arena.cds=b.arena||cleanProfileValue(src.ARENA||'');
 const pub=opPair(cleanProfileValue(src['GARAGEM PUBLICA']||'')),vip=opPair(cleanProfileValue(src['GARAGEM VIP FAC']||'')),deluxe=opPair(cleanProfileValue(src['GARAGEM DELUXE']||''));
 if(b.garagemPublicaBlip||pub.blip)o.garagens.push({tipo:'PUBLICA',blip:b.garagemPublicaBlip||pub.blip,spawn:b.garagemPublicaSpawn||pub.spawn,veiculos:'',vagas:''});
 if(b.garagemVipBlip||vip.blip)o.garagens.push({tipo:'FACCAO',blip:b.garagemVipBlip||vip.blip,spawn:b.garagemVipSpawn||vip.spawn,veiculos:b.garagemVipVeiculos||'',vagas:''});
 if(deluxe.blip)o.garagens.push({tipo:'SERVICO',blip:deluxe.blip,spawn:deluxe.spawn,veiculos:'',vagas:''});
 if(b.helipontoBlip||b.helipontoSpawn)o.helipontos=[{blip:b.helipontoBlip||'',spawn:b.helipontoSpawn||''}];
 o.telao={ativo:!!b.telao,tipo:b.telao?'Hall':'',modelo:b.telaoNome||'',postit:b.telaoPostit||'',cds:b.telaoCds||'',permissao:f.group||'',sons:Array.isArray(b.telaoSons)?b.telaoSons:['','','','']};
 return opMerge(o,OP_KNOWN_EXTRAS[f.group]||{});
}
const _mergedTechProfileV71=mergedTechProfile;mergedTechProfile=function(f={}){const out=_mergedTechProfileV71(f);out.operacional=opMerge(operationalFromExisting(f),f.perfilTecnico?.operacional||out.operacional||{});return out};
function opGet(id){return $('#'+id)?.value?.trim?.()||''}
function operationalFromForm(){
 const garages=[
  {tipo:'PUBLICA',blip:opGet('fOpPub1Blip'),spawn:opGet('fOpPub1Spawn'),veiculos:'',vagas:''},
  {tipo:'PUBLICA_2',blip:opGet('fOpPub2Blip'),spawn:opGet('fOpPub2Spawn'),veiculos:'',vagas:''},
  {tipo:'FACCAO',blip:opGet('fOpVipBlip'),spawn:opGet('fOpVipSpawn'),veiculos:opGet('fOpVipVehicles'),vagas:''},
  {tipo:'SERVICO',blip:opGet('fOpServiceBlip'),spawn:opGet('fOpServiceSpawn'),veiculos:opGet('fOpServiceVehicles'),vagas:''}
 ].filter(x=>x.blip||x.spawn||x.veiculos);
 return {localizacao:{nome:opGet('fOpQGName'),cdsPrincipal:opGet('fOpMainCds')},lojaFac:{cds:opGet('fOpLojaFac')},bar:{cds:opGet('fOpBar')},barbearia:{cds:opGet('fOpBarbearia')},tatuagem:{cds:opGet('fOpTatuagem')},roupas:{cds:opGet('fOpRoupas')},uniforme:{local:opGet('fOpUniformeLocal'),arquivo:opGet('fOpUniformeArquivo')},arena:{cds:opGet('fOpArena')},garagens,helipontos:(opGet('fOpHeliBlip')||opGet('fOpHeliSpawn'))?[{blip:opGet('fOpHeliBlip'),spawn:opGet('fOpHeliSpawn')}]:[],blindados:{vagas:opGet('fOpArmoredSlots'),blip:opGet('fOpArmoredBlip'),spawn:opGet('fOpArmoredSpawn'),veiculos:opGet('fOpArmoredVehicles')},telao:{ativo:!!(opGet('fOpTelaoModelo')||opGet('fOpTelaoPostit')||opGet('fOpTelaoCds')),tipo:opGet('fOpTelaoTipo'),modelo:opGet('fOpTelaoModelo'),postit:opGet('fOpTelaoPostit'),cds:opGet('fOpTelaoCds'),permissao:opGet('fOpTelaoPermissao'),sons:[1,2,3,4].map(i=>opGet('fOpTelaoSom'+i))}};
}
function setOpVal(id,v){const el=$('#'+id);if(el)el.value=v||''}
function renderOperationalProfile(f={}){
 const o=mergedTechProfile(f).operacional||opBlank(),g=(type)=>o.garagens?.find(x=>x.tipo===type)||{},h=o.helipontos?.[0]||{},sons=[...(o.telao?.sons||[]),'','','',''];
 setOpVal('fOpQGName',o.localizacao?.nome);setOpVal('fOpMainCds',o.localizacao?.cdsPrincipal);setOpVal('fOpLojaFac',o.lojaFac?.cds);setOpVal('fOpBar',o.bar?.cds);setOpVal('fOpBarbearia',o.barbearia?.cds);setOpVal('fOpTatuagem',o.tatuagem?.cds);setOpVal('fOpRoupas',o.roupas?.cds);setOpVal('fOpUniformeLocal',o.uniforme?.local);setOpVal('fOpUniformeArquivo',o.uniforme?.arquivo);setOpVal('fOpArena',o.arena?.cds);
 [['Pub1','PUBLICA'],['Pub2','PUBLICA_2'],['Vip','FACCAO'],['Service','SERVICO']].forEach(([p,t])=>{const x=g(t);setOpVal('fOp'+p+'Blip',x.blip);setOpVal('fOp'+p+'Spawn',x.spawn);if(p==='Vip'||p==='Service')setOpVal('fOp'+p+'Vehicles',x.veiculos)});
 setOpVal('fOpHeliBlip',h.blip);setOpVal('fOpHeliSpawn',h.spawn);setOpVal('fOpArmoredSlots',o.blindados?.vagas);setOpVal('fOpArmoredBlip',o.blindados?.blip);setOpVal('fOpArmoredSpawn',o.blindados?.spawn);setOpVal('fOpArmoredVehicles',o.blindados?.veiculos);setOpVal('fOpTelaoTipo',o.telao?.tipo);setOpVal('fOpTelaoModelo',o.telao?.modelo);setOpVal('fOpTelaoPostit',o.telao?.postit);setOpVal('fOpTelaoCds',o.telao?.cds);setOpVal('fOpTelaoPermissao',o.telao?.permissao||f.group);[1,2,3,4].forEach(i=>setOpVal('fOpTelaoSom'+i,sons[i-1]));
}
const _getTechProfileFromFormV71=getTechProfileFromForm;getTechProfileFromForm=function(){const out=_getTechProfileFromFormV71();if($('#fOpQGName'))out.operacional=operationalFromForm();techDraft=out;return out};
const _renderTechProfileV71=renderTechProfile;renderTechProfile=function(f){_renderTechProfileV71(f);renderOperationalProfile(f)};
const _sourceToGroupPatchV71=sourceToGroupPatch;sourceToGroupPatch=function(f,src){const patch=_sourceToGroupPatchV71(f,src),holder={...f,...patch,perfilTecnico:{...(f.perfilTecnico||{}),...(patch.perfilTecnico||{})},perfilFonte:{...src,versao:OPERATIONAL_PROFILE_VERSION}};/* INICIAR ROTA é o blip inicial do farm e não significa Rota Exclusiva. */if(patch.beneficios&&!(f?.beneficios?.rotaExclusiva)){patch.beneficios.rotaExclusiva=false;patch.beneficios.rotaBlips=f?.beneficios?.rotaBlips||'';if(holder.beneficios){holder.beneficios.rotaExclusiva=false;holder.beneficios.rotaBlips=f?.beneficios?.rotaBlips||''}}holder.perfilTecnico.operacional=opMerge(operationalFromExisting(holder),f.perfilTecnico?.operacional||{});patch.perfilTecnico=holder.perfilTecnico;patch.perfilFonte={...src,versao:OPERATIONAL_PROFILE_VERSION};return patch};

// Sincroniza os campos do Perfil Operacional com os campos legados usados pelo gerador de solicitações.
function syncOperationalLegacy(){
 if(!$('#fOpQGName'))return;const o=operationalFromForm(),pub=o.garagens.find(x=>x.tipo==='PUBLICA')||{},vip=o.garagens.find(x=>x.tipo==='FACCAO')||{},heli=o.helipontos[0]||{};
 setOpVal('fQG',o.localizacao.nome);setOpVal('fCds',o.localizacao.cdsPrincipal);setOpVal('fBarbearia',o.barbearia.cds);setOpVal('fTatuagem',o.tatuagem.cds);setOpVal('fLojaRoupas',o.roupas.cds);setOpVal('fArena',o.arena.cds);setOpVal('fShopExclusivo',o.lojaFac.cds);setOpVal('fGaragemPublicaBlip',pub.blip);setOpVal('fGaragemPublicaSpawn',pub.spawn);setOpVal('fGaragemVipBlip',vip.blip);setOpVal('fGaragemVipSpawn',vip.spawn);setOpVal('fGaragemVipVeiculos',vip.veiculos);setOpVal('fHelipontoBlip',heli.blip);setOpVal('fHelipontoSpawn',heli.spawn);setOpVal('fTelaoNome',o.telao.modelo);setOpVal('fTelaoPostit',o.telao.postit);setOpVal('fTelaoCds',o.telao.cds);if($('#fTelao'))$('#fTelao').checked=!!o.telao.ativo;if($('#fGaragemPublica'))$('#fGaragemPublica').checked=!!(pub.blip||pub.spawn);if($('#fHeliponto'))$('#fHeliponto').checked=!!(heli.blip||heli.spawn);
}
const OP_INPUT_IDS=['fOpQGName','fOpMainCds','fOpLojaFac','fOpBar','fOpBarbearia','fOpTatuagem','fOpRoupas','fOpUniformeLocal','fOpUniformeArquivo','fOpArena','fOpPub1Blip','fOpPub1Spawn','fOpPub2Blip','fOpPub2Spawn','fOpVipBlip','fOpVipSpawn','fOpVipVehicles','fOpServiceBlip','fOpServiceSpawn','fOpServiceVehicles','fOpHeliBlip','fOpHeliSpawn','fOpArmoredSlots','fOpArmoredBlip','fOpArmoredSpawn','fOpArmoredVehicles','fOpTelaoTipo','fOpTelaoModelo','fOpTelaoPostit','fOpTelaoCds','fOpTelaoPermissao','fOpTelaoSom1','fOpTelaoSom2','fOpTelaoSom3','fOpTelaoSom4'];
OP_INPUT_IDS.forEach(id=>$('#'+id)?.addEventListener('input',()=>{syncOperationalLegacy();getTechProfileFromForm();try{renderConnectedRequests();renderStructureSnapshot(currentFactionFromForm());updateDeliveryPreview()}catch{}}));
$('#fOpTelaoTipo')?.addEventListener('change',()=>{syncOperationalLegacy();getTechProfileFromForm();try{renderConnectedRequests();updateDeliveryPreview()}catch{}});

// Perfil operacional também passa a responder no Alvesinho.
const _alvesAnswerV71=alvesAnswer;alvesAnswer=function(question=''){const q=alvesNorm(question),g=alvesFindGroup(question);if(g){const o=mergedTechProfile(g).operacional||opBlank();if(q.includes('garagem')){const xs=o.garagens||[];return {text:xs.length?`Garagens de ${g.group}:\n${xs.map(x=>`• ${x.tipo}: Blip ${x.blip||'—'} | Spawn ${x.spawn||'—'}${x.veiculos?' | Veículos '+x.veiculos:''}`).join('\n')}`:`${g.group} não possui garagem cadastrada.`,refs:[g.group,'Perfil Operacional','Garagens']};}if(q.includes('telao')||q.includes('telão')){const t=o.telao||{};return {text:t.ativo?`Telão de ${g.group}:\n• Tipo: ${t.tipo||'—'}\n• Modelo: ${t.modelo||'—'}\n• Post-it: ${t.postit||'—'}\n• CDS: ${t.cds||'—'}\n• Sons: ${(t.sons||[]).filter(Boolean).length} ponto(s)\n${(t.sons||[]).filter(Boolean).map((x,i)=>`  Som ${i+1}: ${x}`).join('\n')}`:`${g.group} não possui telão cadastrado.`,refs:[g.group,'Perfil Operacional','Telão']};}if(q.includes('mapa')||q.includes('localizacao')||q.includes('localização')||q.includes('qg')){return {text:`${g.group} — ${o.localizacao?.nome||g.qg||'QG sem nome'}\nCDS principal do mapa: ${o.localizacao?.cdsPrincipal||g.cds||'—'}`,refs:[g.group,'Perfil Operacional','Mapa']};}}
 return _alvesAnswerV71(question)};

console.info('HIGH OS DEV V7.2 · Perfil Operacional carregado');

// HIGH OS V7.5 · Benefícios e Setagens realmente isolados em página própria.
let groupBenefitsHome=null;
function ensureBenefitsHome(){
 const box=$('#groupBenefitsSettings');
 if(box&&!groupBenefitsHome)groupBenefitsHome={parent:box.parentElement,next:box.nextSibling};
 return box;
}
function openGroupSettingsPage(){
 const box=ensureBenefitsHome(),mount=$('#groupSettingsMount');
 if(!box||!mount)return;
 mount.appendChild(box);box.open=true;box.classList.add('settings-active');
 const raw=faccoes.find(x=>x.group===$('#fGroup')?.value)||{};const g=resolveGroupIdentity(raw);
 $('#groupSettingsTitle').textContent=`${g.group||$('#fGroup')?.value||'GROUP'} · BENEFÍCIOS E SETAGENS`;
 $('#groupSettingsSubtitle').textContent=[g.qg||'QG sem nome',g.faccao?`Ocupante: ${g.faccao}`:'Group vago'].join(' • ');
 activateAppPage('group-settings');
}
function closeGroupSettingsPage(){
 const box=ensureBenefitsHome();
 if(box){box.classList.remove('settings-active');box.open=false;}
 if(box&&groupBenefitsHome?.parent){
   if(groupBenefitsHome.next&&groupBenefitsHome.next.parentElement===groupBenefitsHome.parent)groupBenefitsHome.parent.insertBefore(box,groupBenefitsHome.next);
   else groupBenefitsHome.parent.appendChild(box);
 }
 activateAppPage('group-profile');
}
$('#openGroupSettings')?.addEventListener('click',openGroupSettingsPage);
$('#groupSettingsBack')?.addEventListener('click',closeGroupSettingsPage);
$('#saveGroupSettingsBtn')?.addEventListener('click',()=>$('#facForm')?.requestSubmit());

// ===== HIGH OS V7.4 · RESUMO EXECUTIVO / CADASTRO RECOLHIDO =====
function renderGroupOverview(f){
 if(!f)return;
 const installed=INSTALLATIONS.filter(([k])=>isInstalled(f.beneficios||{},k));
 const put=(id,val)=>{const el=$('#'+id);if(el)el.textContent=val||'—'};
 put('groupOverviewSegment',f.segmento||'OUTROS');
 put('groupOverviewGroup',f.group||'GROUP');
 put('groupOverviewQG',f.qg||'QG sem nome');
 put('groupOverviewProduct',f.produto||'—');
 put('groupOverviewLeader',f.lider||'—');
 put('groupOverviewStaff',f.staff||'—');
 put('groupOverviewCds',f.cds||'—');
 const s=$('#groupProfileSummary');
 if(s)s.innerHTML=`<div><span>STATUS</span><b class="${f.status==='ATIVA'?'online':''}">${f.status==='ATIVA'?'OCUPADO':'VAGO'}</b></div><div><span>OCUPANTE</span><b>${esc(f.faccao||'—')}</b></div><div><span>QG / LOCAL</span><b>${esc(f.qg||'SEM LOCAL')}</b></div><div><span>ESTRUTURAS</span><b>${installed.length}</b></div>`;
 const d=$('#groupIdentityDetails');if(d)d.open=false;
}
$('#editGroupIdentityBtn')?.addEventListener('click',()=>{const d=$('#groupIdentityDetails');if(!d)return;d.open=true;setTimeout(()=>d.scrollIntoView({behavior:'smooth',block:'start'}),30)});
const _openFacV74=openFac;openFac=function(id){_openFacV74(id);const raw=faccoes.find(x=>x.id===id);renderGroupOverview(resolveGroupIdentity(raw||{}))};
['fStatus','fFaccao','fQG','fProduto','fLider','fStaff','fCds'].forEach(id=>$('#'+id)?.addEventListener('input',()=>{
 const current=faccoes.find(x=>x.group===$('#fGroup')?.value)||{};
 renderGroupOverview({...current,status:$('#fStatus')?.value||current.status,faccao:$('#fFaccao')?.value.trim()||'',qg:$('#fQG')?.value.trim()||'',produto:$('#fProduto')?.value.trim()||'',lider:$('#fLider')?.value.trim()||'',staff:$('#fStaff')?.value.trim()||'',cds:$('#fCds')?.value.trim()||''});
 const d=$('#groupIdentityDetails');if(d)d.open=true;
}));
console.info('HIGH OS DEV V7.4 · Perfil clean carregado');

console.info('HIGH OS DEV V7.5 · Perfil clean + setagens isoladas + liderança restaurada');
console.info('HIGH OS DEV V7.7 · Central de Métricas RH carregada');
