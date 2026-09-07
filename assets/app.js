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
const SEED=[{"numero": 1, "cds": "{1286.34,-266.43,99.7,303.31}", "anuncio": "", "qg": "Favela da Barragem", "group": "Armas01", "groupOriginal": "Armas01", "segmento": "ARMAS", "produto": "Pistola, Sub Metralhadora e Rifle", "faccao": "Imperial", "status": "ATIVA", "lider": "109 —Brunin Allef", "staff": "Ítalo Leonardo", "dataEntrega": "17/07/2026", "observacoes": ""}, {"numero": 2, "cds": "{2696.23,3400.29,58.82,90.71}", "anuncio": "", "qg": "Favela do MegaMall", "group": "Armas02", "groupOriginal": "Armas02", "segmento": "ARMAS", "produto": "Pistola, Sub Metralhadora e Rifle", "faccao": "Talibã", "status": "ATIVA", "lider": "4792—Grazzi Sette", "staff": "Italo Leonardo", "dataEntrega": "", "observacoes": ""}, {"numero": 3, "cds": "", "anuncio": "NULO", "qg": "SEM LOCAL", "group": "Armas03", "groupOriginal": "Armas03", "segmento": "ARMAS", "produto": "Pistola, Sub Metralhadora e Rifle", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 4, "cds": "{-2390.91,-198.43,39.65,269.3}", "anuncio": "", "qg": "Favela da Praia 1", "group": "Armas04", "groupOriginal": "Armas04", "segmento": "ARMAS", "produto": "Pistola, Sub Metralhadora e Rifle", "faccao": "Peitanove", "status": "ATIVA", "lider": "2199—Boaventura P", "staff": "Ralf", "dataEntrega": "20/07/2026", "observacoes": ""}, {"numero": 5, "cds": "{2561.79,2437.52,55.47,110.56}", "anuncio": "SIM", "qg": "Favela do Dino", "group": "Armas05", "groupOriginal": "Armas05", "segmento": "ARMAS", "produto": "Pistola, Sub Metralhadora e Rifle", "faccao": "", "status": "INATIVA", "lider": "—", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 6, "cds": "{-2120.96,2482.66,10.03,133.23}", "anuncio": "", "qg": "Favela do Zancudo", "group": "Armas06", "groupOriginal": "Armas06", "segmento": "ARMAS", "produto": "Pistola, Sub Metralhadora e Rifle", "faccao": "Medellin", "status": "ATIVA", "lider": "7142—Alix Fainelli", "staff": "Italo Leonardo", "dataEntrega": "", "observacoes": ""}, {"numero": 7, "cds": "657.75,-174.98,69.86,59.53", "anuncio": "", "qg": "Favela do Campinho", "group": "Armas07", "groupOriginal": "Armas07", "segmento": "ARMAS", "produto": "Pistola, Sub Metralhadora e Rifle", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 8, "cds": "60.64,2602.08,87.1,303.31", "anuncio": "SIM", "qg": "Distrito 14 (apto norte)", "group": "Armas08", "groupOriginal": "Armas08", "segmento": "ARMAS", "produto": "Pistola, Sub Metralhadora e Rifle", "faccao": "", "status": "INATIVA", "lider": "—", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 9, "cds": "2640.33,1789.71,33.62,102.05", "anuncio": "", "qg": "Favela da Indústria, Sul", "group": "Armas09", "groupOriginal": "Armas09", "segmento": "ARMAS", "produto": "Pistola, Sub Metralhadora e Rifle", "faccao": "Safadoes", "status": "ATIVA", "lider": "3182 / JUNIM SAFADO", "staff": "RALF PENA", "dataEntrega": "16/08/26", "observacoes": ""}, {"numero": 10, "cds": "-1431.37,2306.54,30.82,187.09", "anuncio": "SIM", "qg": "Favela da Cachoeira", "group": "Armas10", "groupOriginal": "Armas10", "segmento": "ARMAS", "produto": "Pistola, Sub Metralhadora e Rifle", "faccao": "Lotus", "status": "ATIVA", "lider": "12510 — Ray Hollow", "staff": "Italo Alves", "dataEntrega": "04/09/26", "observacoes": ""}, {"numero": 11, "cds": "{-480.22,1613.99,369.58,0.0}", "anuncio": "NAO", "qg": "FAVELA DO OBS 2", "group": "Armas11", "groupOriginal": "Armas 11", "segmento": "ARMAS", "produto": "Pistola, Sub Metralhadora e Rifle", "faccao": "Playboy", "status": "ATIVA", "lider": "12182 - Igor Mecktref", "staff": "Ralf Pena", "dataEntrega": "26/08/26", "observacoes": ""}, {"numero": 12, "cds": "1003.52,-2367.53,-4.52,189.93", "anuncio": "", "qg": "Clube de Festas, Açougue", "group": "Municao01", "groupOriginal": "Municao01", "segmento": "MUNIÇÃO", "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++", "faccao": "Golden Lotus", "status": "ATIVA", "lider": "9528—Maddy A Jhuns", "staff": "Jonh", "dataEntrega": "09/07/26", "observacoes": ""}, {"numero": 13, "cds": "{-779.26,985.57,249.23,195.6}", "anuncio": "NAO", "qg": "Favela do OBS 2", "group": "Municao02", "groupOriginal": "Municao02", "segmento": "MUNIÇÃO", "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 14, "cds": "-130.69,3220.77,73.72,255.12", "anuncio": "SIM", "qg": "Favela de Sandy Shores, Baixo", "group": "Municao03", "groupOriginal": "Municao03", "segmento": "MUNIÇÃO", "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++", "faccao": "Hidra", "status": "ATIVA", "lider": "12114- Jaque Miller", "staff": "Ralf Pena", "dataEntrega": "25/08/26", "observacoes": ""}, {"numero": 15, "cds": "1367.56,-2433.89,62.18,337.33", "anuncio": "", "qg": "Favela do Petróleo, Sul", "group": "Municao04", "groupOriginal": "Municao04", "segmento": "MUNIÇÃO", "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 16, "cds": "2047.86,5095.36,58.32,2.84", "anuncio": "", "qg": "QG da Plantação", "group": "Municao05", "groupOriginal": "Municao05", "segmento": "MUNIÇÃO", "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 17, "cds": "2473.01,4959.72,44.89,51.03", "anuncio": "NAO", "qg": "Mansao da Fazenda Queimada", "group": "Municao06", "groupOriginal": "Municao06", "segmento": "MUNIÇÃO", "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++", "faccao": "", "status": "INATIVA", "lider": "—", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 18, "cds": "-1896.6,2015.73,171.3,351.5", "anuncio": "", "qg": "Vinhedo", "group": "Municao07", "groupOriginal": "Municao07", "segmento": "MUNIÇÃO", "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++", "faccao": "Real Midia", "status": "ATIVA", "lider": "2323—Henrique Lewis", "staff": "Italo Leonardo", "dataEntrega": "", "observacoes": ""}, {"numero": 19, "cds": "-1771.7, -117.8, 95.4", "anuncio": "", "qg": "Favela do Cemitério, Sul", "group": "Municao08", "groupOriginal": "Municao08", "segmento": "MUNIÇÃO", "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 20, "cds": "320.79,-2058.35,24.03,323.15", "anuncio": "NAO", "qg": "QG dos Vagos", "group": "Municao09", "groupOriginal": "Municao09", "segmento": "MUNIÇÃO", "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++", "faccao": "", "status": "INATIVA", "lider": "-", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 21, "cds": "2184.19,85.47,261.91,164.41", "anuncio": "", "qg": "Ilha Particular", "group": "Municao10", "groupOriginal": "Municao10", "segmento": "MUNIÇÃO", "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++", "faccao": "Black Angels", "status": "ATIVA", "lider": "4510—Gordao", "staff": "Ralf Pena", "dataEntrega": "11/06/26", "observacoes": ""}, {"numero": 22, "cds": "209.95,-3175.18,8.21,181.42", "anuncio": "SIM", "qg": "Club 77", "group": "Lavagem01", "groupOriginal": "Lavagem01", "segmento": "LAVAGEM", "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora", "faccao": "", "status": "INATIVA", "lider": "—", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 23, "cds": "1466.47,1119.43,119.13,0.0", "anuncio": "", "qg": "FAZENDA, SUL", "group": "Lavagem02", "groupOriginal": "Lavagem02", "segmento": "LAVAGEM", "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora", "faccao": "Yakuza", "status": "ATIVA", "lider": "101—Mel Conha", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 24, "cds": "-1376.69,-621.82,35.89,31.19", "anuncio": "", "qg": "Bahamas", "group": "Lavagem03", "groupOriginal": "Lavagem03", "segmento": "LAVAGEM", "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora", "faccao": "Renegados", "status": "ATIVA", "lider": "51—Ana Konda", "staff": "Italo Leonardo", "dataEntrega": "", "observacoes": ""}, {"numero": 25, "cds": "SEM QG", "anuncio": "NULO", "qg": "SEM LOCAL", "group": "Lavagem04", "groupOriginal": "Lavagem04", "segmento": "LAVAGEM", "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 26, "cds": "{-1540.36,81.20,56.58}", "anuncio": "", "qg": "Mansão da Playboy", "group": "Lavagem05", "groupOriginal": "Lavagem05", "segmento": "LAVAGEM", "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora", "faccao": "ICE", "status": "ATIVA", "lider": "899—Mani Khalifa", "staff": "Italo Leonardo", "dataEntrega": "", "observacoes": ""}, {"numero": 27, "cds": "", "anuncio": "SIM", "qg": "Boate Arcade", "group": "Lavagem06", "groupOriginal": "Lavagem06", "segmento": "LAVAGEM", "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 28, "cds": "SEM QG", "anuncio": "NULO", "qg": "SEM LOCAL", "group": "Lavagem07", "groupOriginal": "Lavagem07", "segmento": "LAVAGEM", "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 29, "cds": "SEM QG", "anuncio": "NULO", "qg": "SEM LOCAL", "group": "Lavagem08", "groupOriginal": "Lavagem08", "segmento": "LAVAGEM", "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 30, "cds": "400.75,242.64,92.05,158.75", "anuncio": "NAO", "qg": "Galaxy", "group": "Lavagem09", "groupOriginal": "Lavagem09", "segmento": "LAVAGEM", "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora", "faccao": "", "status": "INATIVA", "lider": "—", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 31, "cds": "1876.33,1511.54,112.98,357.17", "anuncio": "NAO", "qg": "Favela do Sapao", "group": "Estelionatarios01", "groupOriginal": "Estelionatarios01", "segmento": "ESTELIONATÁRIOS", "produto": "Cartão Nuhigh Prata e Ouro e Dinheiro Falso", "faccao": "", "status": "INATIVA", "lider": "—", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 32, "cds": "-1376.69,-621.82,35.89,31.19", "anuncio": "NAO", "qg": "Favela da Boa Vista", "group": "Estelionatarios02", "groupOriginal": "Estelionatarios02", "segmento": "ESTELIONATÁRIOS", "produto": "Cartão Nuhigh Prata e Ouro e Dinheiro Falso", "faccao": "", "status": "INATIVA", "lider": "—", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 33, "cds": "SEM QG", "anuncio": "NULO", "qg": "SEM LOCAL", "group": "Drogas01", "groupOriginal": "Drogas01", "segmento": "DROGAS", "produto": "Metadona, Capuz e Placa Balistica", "faccao": "", "status": "INATIVA", "lider": "—", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 34, "cds": "SEM QG", "anuncio": "NULO", "qg": "SEM LOCAL", "group": "Drogas02", "groupOriginal": "Drogas02", "segmento": "DROGAS", "produto": "Metadona, Capuz e Placa Balistica", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 35, "cds": "1367.25,-1381.16,108.73,257.96", "anuncio": "SIM", "qg": "Favela morro dos Macacos", "group": "Drogas03", "groupOriginal": "Drogas03", "segmento": "DROGAS", "produto": "Heroina, Capuz e Placa Balistica", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 36, "cds": "SEM QG", "anuncio": "NULO", "qg": "SEM LOCAL", "group": "Drogas04", "groupOriginal": "Drogas04", "segmento": "DROGAS", "produto": "Heroina, Capuz e Placa Balistica", "faccao": "", "status": "INATIVA", "lider": "—", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 37, "cds": "SEM QG", "anuncio": "NULO", "qg": "SEM LOCAL", "group": "Drogas05", "groupOriginal": "Drogas05", "segmento": "DROGAS", "produto": "Heroina, Capuz e Placa Balistica", "faccao": "", "status": "INATIVA", "lider": "—", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 38, "cds": "1550.5,-728.82,111.51,204.1", "anuncio": "NAO", "qg": "Favela do Helipa", "group": "Drogas06", "groupOriginal": "Drogas06", "segmento": "DROGAS", "produto": "Metadona, Capuz e Placa Balistica", "faccao": "Helipa", "status": "ATIVA", "lider": "12380 - Megan Fox", "staff": "Italo Alves", "dataEntrega": "01/09/2026", "observacoes": ""}, {"numero": 39, "cds": "-9.29,-1441.26,31.1,215.44", "anuncio": "SIM", "qg": "Residência Clinton", "group": "Drogas07", "groupOriginal": "Drogas07", "segmento": "DROGAS", "produto": "Anfetamina, Capuz e Placa Balistica", "faccao": "", "status": "INATIVA", "lider": "—", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 40, "cds": "{-2902.94,1485.7,71.12,153.08}", "anuncio": "SIM", "qg": "Favela da Praia 3", "group": "Drogas08", "groupOriginal": "Drogas08", "segmento": "DROGAS", "produto": "Crack, Capuz e Placa Balistica", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 41, "cds": "{-1682.63,931.86,180.38,334.49}", "anuncio": "NAO", "qg": "Favela do Asilo", "group": "Drogas09", "groupOriginal": "Drogas09", "segmento": "DROGAS", "produto": "Anfetamina, Capuz e Placa Balistica", "faccao": "Black Eagles", "status": "ATIVA", "lider": "1149—Sergio Medina", "staff": "Italo Leonardo", "dataEntrega": "", "observacoes": ""}, {"numero": 42, "cds": "{1772.1,6474.44,60.04,240.95}", "anuncio": "NAO", "qg": "Favela de Paleto, Norte", "group": "Drogas10", "groupOriginal": "Drogas10", "segmento": "DROGAS", "produto": "Heroina, Capuz e Placa Balistica", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 43, "cds": "{-59.76,-2517.63,7.30}", "anuncio": "SIM", "qg": "Posto, Porto", "group": "Drogas11", "groupOriginal": "Drogas11", "segmento": "DROGAS", "produto": "Crack, Capuz e Placa Balistica", "faccao": "", "status": "INATIVA", "lider": "—", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 44, "cds": "{-1332.84,-1238.37,1.4,317.49}", "anuncio": "SIM", "qg": "QG Gang 1", "group": "Desmanche01", "groupOriginal": "Desmanche01", "segmento": "DESMANCHE", "produto": "Cartão Ilegivel, Cartao Ilegivel ++, Gazua, Gazua++, Desmanche", "faccao": "Desmanche01", "status": "ATIVA", "lider": "12359 — Gtres Bittencourt", "staff": "Italo Leonardo", "dataEntrega": "", "observacoes": ""}, {"numero": 45, "cds": "-572.99,286.48,79.18,184.26", "anuncio": "NAO", "qg": "Tequi-la-la", "group": "Desmanche02", "groupOriginal": "Desmanche02", "segmento": "DESMANCHE", "produto": "Cartão Ilegivel, Cartao Ilegivel ++, Gazua, Gazua++, Desmanche", "faccao": "Tequila-la", "status": "ATIVA", "lider": "11728 - TiToin Gaspar", "staff": "Jonh Smith", "dataEntrega": "25/08/26", "observacoes": ""}, {"numero": 46, "cds": "768.49,441.9,149.73,215.44", "anuncio": "NAO", "qg": "Favela da Placa", "group": "Desmanche03", "groupOriginal": "Desmanche03", "segmento": "DESMANCHE", "produto": "Cartão Ilegivel, Cartao Ilegivel ++, Gazua, Gazua++, Desmanche", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 47, "cds": "2201.62,4689.18,37.68,68.04", "anuncio": "", "qg": "Motoclube Lost MC", "group": "Desmanche04", "groupOriginal": "Desmanche04", "segmento": "DESMANCHE", "produto": "Cartão Ilegivel, Cartao Ilegivel ++, Gazua, Gazua++, Desmanche", "faccao": "Abutres Motoclube", "status": "ATIVA", "lider": "11181 Chefinho", "staff": "Ralf Pena", "dataEntrega": "17/08/2026", "observacoes": ""}, {"numero": 48, "cds": "{-616.13,-1621.95,32.88}", "anuncio": "NAO", "qg": "Roogers", "group": "Desmanche05", "groupOriginal": "Desmanche05", "segmento": "DESMANCHE", "produto": "Cartão Ilegivel, Cartao Ilegivel ++, Gazua, Gazua++, Desmanche", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 49, "cds": "471.44,-1311.00,29.26", "anuncio": "", "qg": "Hayes Auto", "group": "Desmanche06", "groupOriginal": "Desmanche06", "segmento": "DESMANCHE", "produto": "Cartão Ilegivel, Cartao Ilegivel ++, Gazua, Gazua++, Desmanche", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 50, "cds": "2251.53,4599.61,41.89,53.86", "anuncio": "NAO", "qg": "Favela de Sandy Shores, Alto", "group": "Desmanche07", "groupOriginal": "Desmanche07", "segmento": "DESMANCHE", "produto": "Cartão Ilegivel, Cartao Ilegivel ++, Gazua, Gazua++, Desmanche", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 51, "cds": "92.59,-1290.91,29.25", "anuncio": "NAO", "qg": "Vanilla", "group": "Vanilla", "groupOriginal": "Vanilla", "segmento": "OUTROS", "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora", "faccao": "Vannila Unicorn", "status": "ATIVA", "lider": "5128 - MECIN BARROS", "staff": "Ralf", "dataEntrega": "26/08/26", "observacoes": ""}, {"numero": 52, "cds": "227.44,-1388.25,32.45,36.86", "anuncio": "", "qg": "IML Centro", "group": "IlegalMedic1", "groupOriginal": "IlegalMedic1", "segmento": "OUTROS", "produto": "Bandagem Infectada, Metadona, Adrenalina Clandestina", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 53, "cds": "", "anuncio": "NULO", "qg": "SEM LOCAL", "group": "IlegalMedic2", "groupOriginal": "IlegalMedic2", "segmento": "OUTROS", "produto": "Bandagem Infectada, Metadona, Adrenalina Clandestina", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 54, "cds": "{2355.39,-605.06,96.58,257.96}", "anuncio": "", "qg": "Favela da DP", "group": "IlegalMecanic01", "groupOriginal": "IlegalMecanic01", "segmento": "OUTROS", "produto": "Nitro, Tablet de Corrida,  Cartao Descartavel, Cartão Descartável ++", "faccao": "Comando Central", "status": "ATIVA", "lider": "10711—Rabico silva", "staff": "Nala", "dataEntrega": "27/07/2026", "observacoes": ""}, {"numero": 55, "cds": "", "anuncio": "", "qg": "Galpão do Porto", "group": "Contrabando01", "groupOriginal": "Contrabando01", "segmento": "OUTROS", "produto": "Farme de todas as facções disponiveis", "faccao": "Capricorp", "status": "ATIVA", "lider": "819 - Joseph Capri", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 56, "cds": "", "anuncio": "NAO", "qg": "Casa do Lester", "group": "Contrabando02", "groupOriginal": "Contrabando02", "segmento": "OUTROS", "produto": "Farme de todas as facções disponiveis", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 57, "cds": "3899.68,4877.41,12.7,93.55", "anuncio": "", "qg": "Manicomio", "group": "Manicomio", "groupOriginal": "Manicomio", "segmento": "OUTROS", "produto": "LSD, Capuz e Placa Balistica, Glock Rajada, Gazua, Gazua ++, Adrenalina Clandestina", "faccao": "Manicomio", "status": "ATIVA", "lider": "15—Dark Rott", "staff": "Italo Leonardo", "dataEntrega": "", "observacoes": ""}];

function show(el){[loginView,deniedView,appView].forEach(x=>x.classList.add('hidden'));el.classList.remove('hidden')}
async function login(){try{await signInWithPopup(auth,provider)}catch(e){alert('Não foi possível entrar com Google: '+e.message)}}
async function logout(){await signOut(auth)}
$('#loginBtn').onclick=login;$('#loginBtnCard').onclick=login;$('#logoutBtn').onclick=logout;$('#logoutDenied').onclick=logout;

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
  sessionArea.innerHTML=`<span class="access-pill">● ${role}</span><span class="top-email">${email}</span>`;
  await loadFaccoes();
  await loadMetrics();
  loadMarketCatalog();
  if(role==='ADMIN') await loadUsers();
 }catch(e){show(deniedView);$('#deniedText').textContent='Falha ao validar seu cadastro no Firestore: '+e.message}
});

document.querySelectorAll('.nav-item').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));btn.classList.add('active');document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));$('#page-'+btn.dataset.page).classList.add('active')}));

async function loadFaccoes(){
 try{const qs=await getDocs(facCol);faccoes=qs.docs.map(d=>({id:d.id,...d.data()}));faccoes.sort((a,b)=>(a.numero||999)-(b.numero||999));renderFaccoes()}catch(e){$('#facList').innerHTML=`<div class="placeholder"><h3>ERRO AO CARREGAR</h3><p>${e.message}</p></div>`}
}
function renderFaccoes(){
 const q=($('#facSearch').value||'').toLowerCase(),seg=$('#facSegment').value,st=$('#facStatus').value;
 const filtered=faccoes.filter(f=>(!seg||f.segmento===seg)&&(!st||f.status===st)&&(!q||[f.group,f.faccao,f.qg,f.lider,f.staff,f.produto].join(' ').toLowerCase().includes(q)));
 const at=faccoes.filter(f=>f.status==='ATIVA').length;
 $('#facStats').innerHTML=`<span><b>${faccoes.length}</b> POSIÇÕES</span><span><b>${at}</b> ATIVAS</span><span><b>${faccoes.length-at}</b> VAGAS</span><span><b>${filtered.length}</b> EXIBIDAS</span>`;
 if(!faccoes.length){$('#facList').innerHTML='<div class="placeholder"><b>◆</b><h3>BASE AINDA NÃO IMPORTADA</h3><p>ADMIN: clique em “IMPORTAR BASE INICIAL”.</p></div>';return}
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

function openFac(id){
 const f=faccoes.find(x=>x.id===id);if(!f)return;
 $('#fGroup').value=f.group;$('#fGroupShow').value=f.group;$('#fStatus').value=f.status||'INATIVA';$('#fFaccao').value=f.faccao||'';$('#fQG').value=f.qg||'';$('#fProduto').value=f.produto||'';$('#fLider').value=f.lider||'';$('#fStaff').value=f.staff||'';$('#fData').value=f.dataEntrega||'';$('#fAnuncio').value=f.anuncio||'';$('#fCds').value=f.cds||'';$('#fObs').value=f.observacoes||'';setFormBenefits(f.beneficios||{});renderDefaultDeliveryProfile(f);renderTechProfile(f);$('#facModalTitle').textContent=f.group;$('#facModal').classList.remove('hidden');updateDeliveryPreview();
 $('#recolherBtn').style.display=f.status==='ATIVA'?'block':'none';
}
$('#facModalClose').onclick=()=>$('#facModal').classList.add('hidden');
$('#facModal').addEventListener('click',e=>{if(e.target.id==='facModal')$('#facModal').classList.add('hidden')});
['fStatus','fFaccao','fQG','fProduto','fLider','fStaff','fData','fAnuncio','fCds','fObs','fVipOrg','fChatFaccao','fSalario','fSalarioMin','fRadio','fGaragemVipBlip','fGaragemVipSpawn','fGaragemVipVeiculos','fLojaRoupas','fBarbearia','fTatuagem','fShopExclusivo','fBau','fBauCapacidade','fArena','fFarm','fCraft','fRotaExclusiva','fRotaBlips','fTelao','fTelaoNome','fTelaoPostit','fTelaoCds','fGaragemPublica','fGaragemPublicaBlip','fGaragemPublicaSpawn','fHeliponto','fHelipontoBlip','fHelipontoSpawn','fOutrosBeneficios','fPlanoPadrao','fPerfilObs','fTechCraftCds','fTechCraftNome','fTechFarmCds','fTechRouteName','fTechRoutePoints'].forEach(id=>$('#'+id)?.addEventListener('input',updateDeliveryPreview));
$('#copyDeliveryBtn').onclick=copyDeliveryExtract; $('#copyDeliveryRequestsBtn').onclick=copyDeliveryRequests;

$('#facForm').onsubmit=async e=>{
 e.preventDefault();const group=$('#fGroup').value,old=faccoes.find(x=>x.group===group);const data={...old,status:$('#fStatus').value,faccao:$('#fFaccao').value.trim(),qg:$('#fQG').value.trim(),produto:$('#fProduto').value.trim(),lider:$('#fLider').value.trim(),staff:$('#fStaff').value.trim(),dataEntrega:$('#fData').value.trim(),anuncio:$('#fAnuncio').value.trim(),cds:$('#fCds').value.trim(),observacoes:$('#fObs').value.trim(),beneficios:getFormBenefits(),perfilEntrega:{planoPadrao:$('#fPlanoPadrao')?.value.trim()||'',observacao:$('#fPerfilObs')?.value.trim()||'',beneficiosPadrao:selectedDefaultBenefits()},perfilTecnico:getTechProfileFromForm(),updatedAt:serverTimestamp(),updatedBy:currentUser.email};
 if(data.status==='ATIVA'&&!data.faccao){alert('Informe o nome da facção para marcar como ATIVA.');return}
 try{const generated=autoDeliveryRequests(data);await setDoc(doc(db,'highos','data','faccoes',group),data);await addDoc(histCol,{tipo:old?.status==='INATIVA'&&data.status==='ATIVA'?'ENTREGA':'EDICAO',group,antes:snapshot(old),depois:snapshot(data),solicitacoesGeradas:generated,extratoEntrega:buildDeliveryExtract(data),usuario:currentUser.email,data:serverTimestamp()});$('#facModal').classList.add('hidden');await loadFaccoes()}catch(err){alert('Erro ao salvar: '+err.message)}
};
$('#recolherBtn').onclick=async()=>{
 const group=$('#fGroup').value,old=faccoes.find(x=>x.group===group);if(!old||!confirm(`Recolher ${old.faccao||group} e deixar ${group} VAGO? O histórico será preservado.`))return;
 const data={...old,status:'INATIVA',faccao:'',lider:'',staff:'',dataEntrega:'',observacoes:old.observacoes||'',updatedAt:serverTimestamp(),updatedBy:currentUser.email};
 try{await setDoc(doc(db,'highos','data','faccoes',group),data);if(old.faccao){const oid=orgKey(old.faccao);await setDoc(doc(db,'highos','data','organizacoes',oid),{nome:old.faccao,status:'SEM_GROUP',groupAtual:'',segmentoAtual:'',qgAtual:'',updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true})}await addDoc(histCol,{tipo:'RECOLHIMENTO',group,faccao:old.faccao||'',antes:snapshot(old),depois:snapshot(data),usuario:currentUser.email,data:serverTimestamp()});$('#facModal').classList.add('hidden');await loadFaccoes()}catch(err){alert('Erro ao recolher: '+err.message)}
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
    updateRequestPreview();
  });
  ['reqGroup','reqAssunto','reqDetalhes','reqModelName'].forEach(id=>$('#'+id).addEventListener('input',()=>{if(id==='reqGroup')syncRequestFaction();updateRequestPreview()}));
  $('#reqSearch').addEventListener('input',renderRequests); $('#reqTypeFilter').addEventListener('change',renderRequests);
  $('#copyReqBtn').onclick=copyRequestText; $('#reqForm').addEventListener('submit',saveRequestModel);
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
 syncRequestFaction();updateRequestPreview();$('#reqModal').classList.remove('hidden');
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
 const q=($('#facSearch')?.value||'').toLowerCase(),seg=$('#facSegment')?.value||'',st=$('#facStatus')?.value||'';
 const filtered=faccoes.filter(f=>(!seg||f.segmento===seg)&&(!st||f.status===st)&&(!q||[f.group,f.faccao,f.qg,f.lider,f.staff,f.produto].join(' ').toLowerCase().includes(q)));
 const ocup=faccoes.filter(f=>f.status==='ATIVA').length,vagos=faccoes.length-ocup,inst=faccoes.reduce((n,f)=>n+installedCount(f),0);
 const segCounts={};faccoes.forEach(f=>{const k=f.segmento||'OUTROS';segCounts[k]=(segCounts[k]||0)+1});
 const maxSeg=Math.max(1,...Object.values(segCounts));
 if($('#facOverview'))$('#facOverview').innerHTML=`<div class="ops-kpis"><article class="ops-kpi purple"><span>GROUPS / QGs</span><b>${faccoes.length}</b><small>patrimônio técnico cadastrado</small></article><article class="ops-kpi good"><span>OCUPADOS</span><b>${ocup}</b><small>${faccoes.length?Math.round(ocup/faccoes.length*100):0}% da base em uso</small></article><article class="ops-kpi warn"><span>VAGOS</span><b>${vagos}</b><small>disponíveis para nova entrega</small></article><article class="ops-kpi"><span>INSTALAÇÕES</span><b>${inst}</b><small>recursos/setagens registrados</small></article></div><section class="ops-distribution"><div class="ops-distribution-head"><b>DISTRIBUIÇÃO POR SEGMENTO</b><span>BASE COMPLETA</span></div><div class="ops-bars">${Object.entries(segCounts).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="ops-bar-row"><span>${esc(k)}</span><div class="ops-track"><div class="ops-fill" style="width:${Math.max(4,v/maxSeg*100)}%"></div></div><b>${v}</b></div>`).join('')}</div></section>`;
 $('#facStats').innerHTML=`<span><b>${filtered.length}</b> EXIBIDOS</span>${seg?`<span>SEGMENTO <b>${esc(seg)}</b></span>`:''}${st?`<span>STATUS <b>${st==='ATIVA'?'OCUPADOS':'VAGOS'}</b></span>`:''}`;
 if(!faccoes.length){$('#facList').innerHTML='<div class="placeholder"><b>◆</b><h3>BASE AINDA NÃO IMPORTADA</h3><p>ADMIN: clique em “IMPORTAR BASE INICIAL”.</p></div>';return}
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
 const sel=$('#dGroup');sel.innerHTML='<option value="">SELECIONE O GROUP</option>'+faccoes.map(f=>`<option value="${esc(f.group)}">${esc(f.group)} — ${esc(f.qg||'SEM LOCAL')} ${f.status==='ATIVA'?'['+esc(f.faccao||'OCUPADO')+']':'[VAGO]'}</option>`).join('');
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
function renderMetricSourceStatus(){
 const el=$('#metricSourceStatus');if(!el)return;const has=!!extractSpreadsheetId(metricSourceConfig.url),state=metricSourceState.status;const online=state==='ONLINE';el.classList.toggle('online',online);el.classList.toggle('error',state==='ERRO');const when=metricSourceState.lastSync?new Date(metricSourceState.lastSync).toLocaleString('pt-BR'):'—';let desc='Informe o link da planilha oficial';if(has)desc=sheetsAccessToken?'Pronta para leitura direta':'Planilha configurada • autorização Google necessária para nova leitura';if(online)desc=`Conectada • ${metricSourceState.count} históricos • ${metricSourceState.activeCount||0} em ${metricPeriodLabel(metricPeriodKey)}`;if(state==='ERRO')desc=esc(metricSourceState.error||'Falha na conexão');el.innerHTML=`<div><span class="metric-source-dot"></span><div><b>${has?'GOOGLE SHEETS • SOMENTE LEITURA':'FONTE NÃO CONFIGURADA'}</b><small>${desc}</small></div></div><span>${online?'Última leitura: '+esc(when):(has?'CONECTAR':'CONFIGURAR')}</span>`;
}
async function fetchMetricsFromSource({persist=false,quiet=false,authorize=true}={}){
 if(!extractSpreadsheetId(metricSourceConfig.url)){if(!quiet)alert('Configure primeiro o link da planilha em Fonte.');metricSourceState={status:'SEM FONTE',lastSync:null,count:0,activeCount:0,error:''};renderMetricSourceStatus();return false}
 metricSourceState={...metricSourceState,status:'SINCRONIZANDO',error:''};renderMetricSourceStatus();
 try{const result=await readMetricsDirect({authorize});const rows=result.rows;metricas=rows;metricPeriodKey=currentMetricMonthKey();metricSourceState={status:'ONLINE',lastSync:Date.now(),count:rows.length,activeCount:activeMetricRows().length,error:'',sheet:result.sheet};renderMetricSourceStatus();refreshMetricPeriodOptions();renderMetrics();if(persist)await persistMetricRows(rows,result.sheet);if(!quiet)alert(`${rows.length} registro(s) históricos lidos da aba ${result.sheet}. Exibindo ${activeMetricRows().length} registro(s) de ${metricPeriodLabel(metricPeriodKey)}. A planilha não foi alterada.`);return true
 }catch(e){metricas=metricasCache.slice();if(e.message==='AUTORIZAÇÃO NECESSÁRIA'){metricSourceState={...metricSourceState,status:'AGUARDANDO',error:''};renderMetricSourceStatus();return false}metricSourceState={...metricSourceState,status:'ERRO',error:e.message};renderMetricSourceStatus();renderMetrics();if(!quiet)alert('Erro ao sincronizar métricas: '+e.message);return false}
}
async function persistMetricRows(rows,sheet=''){
 const chunks=[];for(let i=0;i<rows.length;i+=400)chunks.push(rows.slice(i,i+400));for(const chunk of chunks){const batch=writeBatch(db);chunk.forEach(r=>{const id=(r.group+'_'+r.data).replace(/[^a-zA-Z0-9_-]/g,'_');batch.set(doc(db,'highos','data','metricas',id),{...r,source:'GOOGLE_SHEETS_READONLY',sourceSheet:sheet||metricSourceConfig.sheet||'',updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true})});await batch.commit()}
 await addDoc(histCol,{tipo:'SINCRONIZACAO_METRICAS',descricao:`${rows.length} registro(s) lidos em modo somente leitura da planilha oficial${sheet?' • aba '+sheet:''}`,usuario:currentUser.email,data:serverTimestamp()});metricasCache=rows.slice();
}
async function loadMetrics(){
 try{const qs=await getDocs(metricCol);metricasCache=qs.docs.map(d=>({id:d.id,...d.data()}));metricas=metricasCache.slice();metricPeriodKey=currentMetricMonthKey()}catch(e){metricasCache=[];metricas=[];metricPeriodKey=currentMetricMonthKey()}
 await loadMetricSourceConfig();refreshMetricPeriodOptions();renderMetrics();if(metricSourceConfig.url&&metricSourceConfig.autoSync!==false&&sheetsAccessToken)await fetchMetricsFromSource({persist:false,quiet:true,authorize:false});
}
function metricSummaryRows(){
 return faccoes.map(f=>{const a=metricAnalysis(f.group);return a?{f,a}:null}).filter(Boolean).sort((x,y)=>y.a.avg-x.a.avg);
}
function renderMetrics(err=null){
 const box=$('#metricRanking');if(!box)return;if(err instanceof Event)err=null;
 const q=alvesNorm($('#metricSearch')?.value||''),seg=$('#metricSegment')?.value||'';
 let rows=metricSummaryRows().filter(x=>(!seg||x.f.segmento===seg)&&(!q||alvesNorm([x.f.group,x.f.faccao,x.f.qg].join(' ')).includes(q)));
 const active=activeMetricRows(),groupsWith=new Set(active.map(m=>alvesNorm(m.group||m.organizacao||m.faccao))).size;
 const groupKeys=new Set(rows.map(x=>alvesNorm(x.f.group))),visibleRaw=active.filter(m=>groupKeys.has(alvesNorm(m.group||m.organizacao||m.faccao)));
 const slotTotals={'14H':[], '16H':[], '21H':[], '23H':[]};visibleRaw.forEach(r=>{const sl=metricSlots(r);Object.keys(slotTotals).forEach(h=>slotTotals[h].push(sl[h]))});
 const hourAvgs=Object.fromEntries(Object.entries(slotTotals).map(([h,a])=>[h,a.length?a.reduce((x,y)=>x+y,0)/a.length:0]));
 const allValues=visibleRaw.flatMap(r=>Object.values(metricSlots(r))),overall=allValues.length?allValues.reduce((a,b)=>a+b,0)/allValues.length:0;
 const top=rows[0]||null,peak=rows.reduce((best,x)=>!best||x.a.peak.value>best.a.peak.value?x:best,null);const pred=Object.entries(hourAvgs).sort((a,b)=>b[1]-a[1])[0]||['—',0];
 if($('#metricOverview'))$('#metricOverview').innerHTML=`<article class="metric-hero-kpi"><span>MÉDIA GERAL EXIBIDA</span><b>${overall.toFixed(1)}</b><small>${rows.length} Group(s) no recorte atual</small></article><article class="metric-hero-kpi"><span>LÍDER DO RANKING</span><b>${top?esc(top.f.group):'—'}</b><small>${top?`média ${top.a.avg.toFixed(1)} • ${esc(top.f.faccao||top.f.qg||'')}`:'sem dados'}</small></article><article class="metric-hero-kpi"><span>MAIOR PICO</span><b>${peak?peak.a.peak.value:'—'}</b><small>${peak?`${esc(peak.f.group)} • ${esc(peak.a.peak.hour)} • ${esc(peak.a.peak.date)}`:'sem dados'}</small></article><article class="metric-hero-kpi"><span>HORÁRIO MAIS FORTE</span><b>${esc(pred[0])}</b><small>média agregada ${Number(pred[1]).toFixed(1)}</small></article>`;
 $('#metricStats').innerHTML=`<span><b>${esc(metricPeriodLabel(metricPeriodKey))}</b> COMPETÊNCIA</span><span><b>${active.length}</b> REGISTROS</span><span><b>${groupsWith}</b> GROUPS COM DADOS</span><span><b>${rows.length}</b> EXIBIDOS</span>${seg?`<span>SEGMENTO <b>${esc(seg)}</b></span>`:''}`;
 const maxHour=Math.max(1,...Object.values(hourAvgs)),top5=rows.slice(0,5),maxTop=Math.max(1,...top5.map(x=>x.a.avg));
 if($('#metricVisuals'))$('#metricVisuals').innerHTML=`<section class="metric-chart-card"><div class="metric-chart-head"><b>PRESENÇA MÉDIA POR HORÁRIO</b><span>${esc(metricPeriodLabel(metricPeriodKey))}${seg?' • '+esc(seg):''}</span></div><div class="hour-bars">${Object.entries(hourAvgs).map(([h,v])=>`<div class="hour-col"><b>${v.toFixed(1)}</b><i style="height:${Math.max(4,v/maxHour*120)}px"></i><span>${h}</span></div>`).join('')}</div></section><section class="metric-chart-card"><div class="metric-chart-head"><b>TOP 5 • MÉDIA ONLINE</b><span>RANKING DO RECORTE</span></div><div class="top-bars">${top5.length?top5.map(x=>`<div class="top-bar-item"><span>${esc(x.f.group)}</span><div class="ops-track"><div class="ops-fill" style="width:${Math.max(3,x.a.avg/maxTop*100)}%"></div></div><b>${x.a.avg.toFixed(1)}</b></div>`).join(''):'<div class="muted">Sem dados no recorte.</div>'}</div></section>`;
 if(err){box.innerHTML=`<div class="placeholder"><h3>ERRO AO CARREGAR</h3><p>${esc(err.message||String(err))}</p></div>`;return}
 if(!rows.length){box.innerHTML=`<div class="placeholder"><b>▥</b><h3>SEM MÉTRICAS EM ${esc(metricPeriodLabel(metricPeriodKey).toUpperCase())}</h3><p>Não há dados para os filtros atuais. O High OS não mistura competências.</p></div>`;return}
 box.innerHTML=rows.map((x,i)=>`<article class="metric-row"><div class="metric-pos">${i+1}</div><div class="metric-main"><div><strong>${esc(x.f.group)}</strong><span>${esc(x.f.faccao||x.f.qg||'—')}</span></div><div class="metric-kpis"><span>MÉDIA <b>${x.a.avg.toFixed(1)}</b></span><span>PICO <b>${x.a.peak.value}</b><small>${esc(x.a.peak.hour)} • ${esc(x.a.peak.date)}</small></span><span>PREDOMINÂNCIA <b>${esc(x.a.predominant)}</b></span><span>DIAS <b>${x.a.rows.length}</b></span></div></div></article>`).join('');
}

function parseMetricImport(text=''){
 const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean),out=[];
 for(const line of lines){const p=line.includes('\t')?line.split('\t'):line.split(';');if(p.length<6)continue;const [group,data,a,b,c,d]=p.map(x=>x.trim());if(!group||alvesNorm(group).includes('organizacao')||alvesNorm(group)==='group')continue;out.push({group,data,slots:{'14H':Number(String(a).replace(',','.'))||0,'16H':Number(String(b).replace(',','.'))||0,'21H':Number(String(c).replace(',','.'))||0,'23H':Number(String(d).replace(',','.'))||0}})}
 return out;
}
async function saveMetricImport(){
 const rows=parseMetricImport($('#metricImportText')?.value||'');if(!rows.length){alert('Nenhuma linha válida. Use: Group;Data;14H;16H;21H;23H');return}
 try{const batch=writeBatch(db);rows.forEach(r=>{const id=(r.group+'_'+r.data).replace(/[^a-zA-Z0-9_-]/g,'_');batch.set(doc(db,'highos','data','metricas',id),{...r,updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true})});await batch.commit();await addDoc(histCol,{tipo:'IMPORTACAO_METRICAS',descricao:`${rows.length} registro(s) de métricas importado(s)`,usuario:currentUser.email,data:serverTimestamp()});$('#metricImportModal')?.classList.add('hidden');$('#metricImportText').value='';await loadMetrics();alert(`${rows.length} registro(s) importado(s).`)}catch(e){alert('Erro ao importar métricas: '+e.message)}
}
$('#metricSearch')?.addEventListener('input',()=>renderMetrics());$('#metricPeriod')?.addEventListener('change',e=>{metricPeriodKey=e.target.value||currentMetricMonthKey();renderMetrics()});$('#metricSegment')?.addEventListener('change',()=>renderMetrics());$('#openMetricImportBtn')?.addEventListener('click',()=>$('#metricImportModal')?.classList.remove('hidden'));$('#metricImportClose')?.addEventListener('click',()=>$('#metricImportModal')?.classList.add('hidden'));$('#metricImportModal')?.addEventListener('click',e=>{if(e.target.id==='metricImportModal')e.currentTarget.classList.add('hidden')});$('#metricImportSave')?.addEventListener('click',saveMetricImport);

function openMetricSource(){
 $('#metricSourceUrl').value=metricSourceConfig.url||'';$('#metricSourceSheet').value=metricSourceConfig.sheet||'';$('#metricAutoSync').checked=metricSourceConfig.autoSync!==false;$('#metricSourceTestResult').textContent='A planilha será aberta somente para leitura usando a sua conta Google.';$('#metricSourceModal')?.classList.remove('hidden');
}
async function testMetricSource(){
 const out=$('#metricSourceTestResult'),url=$('#metricSourceUrl').value.trim(),sheet=$('#metricSourceSheet').value.trim();if(!extractSpreadsheetId(url)){out.textContent='Informe um link ou ID válido do Google Sheets.';return}out.textContent='Solicitando permissão Google e lendo a planilha...';
 try{const result=await readMetricsDirect({authorize:true,urlOverride:url,sheetOverride:sheet});out.innerHTML=`<b>CONEXÃO OK • SOMENTE LEITURA</b> • ${result.rows.length} registros • aba ${esc(result.sheet)}`
 }catch(e){out.textContent='Falha: '+e.message}
}
async function saveMetricSource(){
 const cfg={url:$('#metricSourceUrl').value.trim(),sheet:$('#metricSourceSheet').value.trim(),autoSync:$('#metricAutoSync').checked,mode:'GOOGLE_SHEETS_READONLY',updatedAt:serverTimestamp(),updatedBy:currentUser.email};if(!extractSpreadsheetId(cfg.url)){alert('Informe um link ou ID válido do Google Sheets.');return}
 try{await setDoc(metricConfigDoc,cfg,{merge:true});metricSourceConfig={...metricSourceConfig,url:cfg.url,sheet:cfg.sheet,autoSync:cfg.autoSync,mode:cfg.mode};$('#metricSourceModal').classList.add('hidden');renderMetricSourceStatus();await fetchMetricsFromSource({persist:true,quiet:false,authorize:true})}catch(e){alert('Erro ao salvar a fonte: '+e.message)}
}
$('#metricSourceBtn')?.addEventListener('click',openMetricSource);$('#metricSourceClose')?.addEventListener('click',()=>$('#metricSourceModal')?.classList.add('hidden'));$('#metricSourceModal')?.addEventListener('click',e=>{if(e.target.id==='metricSourceModal')e.currentTarget.classList.add('hidden')});$('#metricSourceTest')?.addEventListener('click',testMetricSource);$('#metricSourceSave')?.addEventListener('click',saveMetricSource);$('#syncMetricBtn')?.addEventListener('click',()=>fetchMetricsFromSource({persist:true,quiet:false,authorize:true}));

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


// ===== HIGH OS V6.3 · PERFIL TÉCNICO INTEGRADO AO GROUP =====
// Craft não é uma página: receitas, farm e rota fazem parte do patrimônio permanente do Group/QG.
const ITEM_IMG_BASE='assets/itens/';
const ITEM_META={
 pistolbody:{nome:'Corpo de Pistola',imagem:'pistolbody.png'}, smgbody:{nome:'Corpo de Sub',imagem:'smgbody.png'}, riflebody:{nome:'Corpo de Rifle',imagem:'riflebody.png'},
 sheetmetal:{nome:'Chapa de Metal',imagem:'sheetmetal.png'}, dollar:{nome:'Dólar',imagem:'dollar.png'}, elastic:{nome:'Elástico',imagem:'elastic.png'}, rubber:{nome:'Borracha',imagem:'rubber.png'}, techtrash:{nome:'Lixo Eletrônico',imagem:'techtrash.png'},
 ziplock:{nome:'Ziplock',imagem:'ziplock.png'}, weedbud:{nome:'Bud de Maconha',imagem:'weedbud.png'}
};
const ARMAS_STANDARD_RECIPES=[
 {id:'ak74n',nome:'AK-74N',spawn:'WEAPON_ASSAULTRIFLE',imagem:'ak74n.png',nivel:5,max:10,insumos:[['riflebody',35],['sheetmetal',30],['dollar',70000]]},
 {id:'ak102',nome:'AK-102',spawn:'WEAPON_ASSAULTRIFLE_MK2',imagem:'ak102.png',nivel:5,max:10,insumos:[['riflebody',40],['sheetmetal',34],['dollar',46000]]},
 {id:'sigsauer556',nome:'Sig Sauer 556',spawn:'WEAPON_SPECIALCARBINE_MK2',imagem:'sigsauer556.png',nivel:5,max:10,insumos:[['riflebody',42],['sheetmetal',29],['dollar',58000]]},
 {id:'t54',nome:'T54',spawn:'WEAPON_PISTOL_MK2',imagem:'t54.png',nivel:5,max:10,insumos:[['pistolbody',22],['sheetmetal',12],['dollar',8500]]},
 {id:'f2000',nome:'F2000',spawn:'WEAPON_ASSAULTSMG',imagem:'f2000.png',nivel:5,max:10,insumos:[['smgbody',27],['sheetmetal',24],['dollar',31000]]},
 {id:'deagle',nome:'Deagle',spawn:'WEAPON_PISTOL50',imagem:'desert.png',nivel:5,max:10,insumos:[['pistolbody',16],['sheetmetal',13],['dollar',18000]]},
 {id:'m1922',nome:'M1922',spawn:'WEAPON_VINTAGEPISTOL',imagem:'m1922.png',nivel:5,max:10,insumos:[['pistolbody',11],['sheetmetal',9],['dollar',12000]]},
 {id:'tec9',nome:'Tec-9',spawn:'WEAPON_MACHINEPISTOL',imagem:'tec9.png',nivel:5,max:10,insumos:[['smgbody',25],['sheetmetal',19],['dollar',26000]]},
 {id:'fnfal',nome:'FN L1A1 / FN FAL',spawn:'WEAPON_FNFAL',imagem:'fnfal.png',nivel:5,max:10,insumos:[['riflebody',38],['sheetmetal',31],['dollar',70000]]}
].map(r=>({...r,origem:'PADRÃO DO SEGMENTO'}));
let techDraft={craft:{cds:'',nome:'',receitas:[]},farm:{cds:'',itens:[]},rota:{nome:'',pontos:''}};
function clonePlain(v){return JSON.parse(JSON.stringify(v??null))}
function itemImg(spawn='',imagem=''){const f=String(imagem||'').trim()||String(spawn||'').trim()+'.png';return ITEM_IMG_BASE+encodeURIComponent(f).replace(/%2F/gi,'/')}
function recipeNormalize(r={}){return {id:r.id||('r_'+Math.random().toString(36).slice(2,9)),nome:r.nome||'',spawn:r.spawn||'',imagem:r.imagem||'',nivel:r.nivel||'',max:r.max||'',origem:r.origem||'EXTRA DO GROUP',insumos:(r.insumos||[]).map(x=>Array.isArray(x)?{spawn:x[0],qtd:x[1],nome:ITEM_META[x[0]]?.nome||x[0],imagem:ITEM_META[x[0]]?.imagem||''}:{spawn:x.spawn||'',qtd:x.qtd??'',nome:x.nome||ITEM_META[x.spawn]?.nome||x.spawn||'',imagem:x.imagem||ITEM_META[x.spawn]?.imagem||''})};}
function defaultTechProfile(f={}){
 const b=f.beneficios||{}, base=(f.segmento==='ARMAS'?ARMAS_STANDARD_RECIPES:[]).map(recipeNormalize);
 return {craft:{cds:b.craft||'',nome:f.segmento==='ARMAS'?'Armas de Pequeno, Médio e Grande Calibre':'',receitas:base},farm:{cds:b.farm||'',itens:[]},rota:{nome:b.rotaExclusiva?`RotaExclusiva${f.group||''}`:'',pontos:b.rotaBlips||''}};
}
function mergedTechProfile(f={}){
 const d=defaultTechProfile(f),p=clonePlain(f.perfilTecnico||{})||{};
 const explicit=Array.isArray(p?.craft?.receitas);
 return {craft:{cds:p?.craft?.cds??d.craft.cds,nome:p?.craft?.nome??d.craft.nome,receitas:(explicit?p.craft.receitas:d.craft.receitas).map(recipeNormalize)},farm:{cds:p?.farm?.cds??d.farm.cds,itens:Array.isArray(p?.farm?.itens)?p.farm.itens.map(x=>({...x})):[]},rota:{nome:p?.rota?.nome??d.rota.nome,pontos:p?.rota?.pontos??d.rota.pontos}};
}
function renderTechProfile(f){
 techDraft=mergedTechProfile(f);$('#fTechCraftCds').value=techDraft.craft.cds||'';$('#fTechCraftNome').value=techDraft.craft.nome||'';$('#fTechFarmCds').value=techDraft.farm.cds||'';$('#fTechRouteName').value=techDraft.rota.nome||'';$('#fTechRoutePoints').value=techDraft.rota.pontos||'';renderCraftRecipes();renderFarmItems();renderStructureSnapshot(f);renderConnectedRequests();
}
function getTechProfileFromForm(){
 if(!techDraft)techDraft={craft:{receitas:[]},farm:{itens:[]},rota:{}};
 techDraft.craft.cds=$('#fTechCraftCds')?.value.trim()||'';techDraft.craft.nome=$('#fTechCraftNome')?.value.trim()||'';techDraft.farm.cds=$('#fTechFarmCds')?.value.trim()||'';techDraft.rota.nome=$('#fTechRouteName')?.value.trim()||'';techDraft.rota.pontos=$('#fTechRoutePoints')?.value.trim()||'';
 // manter compatibilidade com campos legados da estrutura
 if($('#fCraft'))$('#fCraft').value=techDraft.craft.cds;if($('#fFarm'))$('#fFarm').value=techDraft.farm.cds;if($('#fRotaBlips')&&techDraft.rota.pontos)$('#fRotaBlips').value=techDraft.rota.pontos;
 return clonePlain(techDraft);
}
function recipeCard(r,i){const ins=(r.insumos||[]).map((x,j)=>`<div class="tech-ingredient"><img src="${esc(itemImg(x.spawn,x.imagem))}" onerror="this.style.opacity=.18"><div><b>${esc(x.nome||x.spawn||'Item')}</b><span>${esc(x.spawn||'—')} • x${esc(x.qtd)}</span></div><button type="button" class="tech-remove" data-remove-ing="${i}:${j}" title="Remover">×</button></div>`).join('');return `<article class="tech-recipe-card"><div class="tech-recipe-art"><img src="${esc(itemImg(r.spawn,r.imagem))}" onerror="this.style.opacity=.18"></div><div class="tech-recipe-body"><div class="tech-recipe-title"><div><b>${esc(r.nome||'Receita')}</b><span>${esc(r.spawn||'SEM SPAWN')}</span></div><em>${esc(r.origem||'GROUP')}</em></div><div class="tech-recipe-kpis"><span>NÍVEL <b>${esc(r.nivel||'—')}</b></span><span>MÁX. <b>${esc(r.max||'—')}</b></span><span>INSUMOS <b>${r.insumos?.length||0}</b></span></div><div class="tech-ingredients">${ins||'<small class="muted">Sem insumos cadastrados.</small>'}</div><div class="tech-recipe-actions admin-only"><button type="button" class="mini-btn" data-edit-recipe="${i}">EDITAR</button><button type="button" class="mini-btn danger" data-remove-recipe="${i}">REMOVER DO GROUP</button></div></div></article>`}
function renderCraftRecipes(){const box=$('#groupCraftRecipes');if(!box)return;const rs=techDraft?.craft?.receitas||[];$('#techCraftSummary').textContent=`${rs.length} receita(s) vinculada(s) a este Group`;box.innerHTML=rs.length?rs.map(recipeCard).join(''):'<div class="delivery-no-change">Nenhuma receita vinculada a este Group.</div>';box.querySelectorAll('[data-remove-recipe]').forEach(b=>b.onclick=()=>{techDraft.craft.receitas.splice(+b.dataset.removeRecipe,1);renderCraftRecipes();updateDeliveryPreview();renderConnectedRequests()});box.querySelectorAll('[data-edit-recipe]').forEach(b=>b.onclick=()=>editRecipe(+b.dataset.editRecipe));box.querySelectorAll('[data-remove-ing]').forEach(b=>b.onclick=()=>{const [ri,ii]=b.dataset.removeIng.split(':').map(Number);techDraft.craft.receitas[ri].insumos.splice(ii,1);renderCraftRecipes();updateDeliveryPreview();renderConnectedRequests()});}
function editRecipe(i){const r=techDraft.craft.receitas[i];if(!r)return;const nome=prompt('Nome do produto:',r.nome);if(nome===null)return;const spawn=prompt('Spawn do produto:',r.spawn);if(spawn===null)return;const nivel=prompt('Nível:',r.nivel||'');if(nivel===null)return;const max=prompt('Máximo / lote:',r.max||'');if(max===null)return;const ing=prompt('Insumos — um por linha: spawn|nome|quantidade\nEx.: pistolbody|Corpo de Pistola|22',(r.insumos||[]).map(x=>`${x.spawn}|${x.nome}|${x.qtd}`).join('\n'));if(ing===null)return;r.nome=nome.trim();r.spawn=spawn.trim();r.nivel=nivel.trim();r.max=max.trim();r.insumos=ing.split(/\r?\n/).map(l=>l.split('|')).filter(a=>a[0]?.trim()).map(a=>{const sp=a[0].trim();return {spawn:sp,nome:(a[1]||ITEM_META[sp]?.nome||sp).trim(),qtd:(a[2]||'').trim(),imagem:ITEM_META[sp]?.imagem||''}});r.origem=r.origem||'EXTRA DO GROUP';renderCraftRecipes();updateDeliveryPreview();renderConnectedRequests();}
function addRecipe(){const r=recipeNormalize({origem:'EXTRA DO GROUP'});techDraft.craft.receitas.push(r);editRecipe(techDraft.craft.receitas.length-1);if(!r.nome&&!r.spawn){techDraft.craft.receitas=techDraft.craft.receitas.filter(x=>x!==r)}renderCraftRecipes();}
function farmItemCard(x,i){return `<div class="tech-farm-item"><img src="${esc(itemImg(x.spawn,x.imagem))}" onerror="this.style.opacity=.18"><div><b>${esc(x.nome||x.spawn||'Item')}</b><span>${esc(x.spawn||'—')}${x.qtd?' • '+esc(x.qtd):''}</span></div><button type="button" class="mini-btn admin-only" data-edit-farm="${i}">EDITAR</button><button type="button" class="tech-remove admin-only" data-remove-farm="${i}">×</button></div>`}
function renderFarmItems(){const box=$('#groupFarmItems');if(!box)return;const xs=techDraft?.farm?.itens||[];box.innerHTML=xs.length?xs.map(farmItemCard).join(''):'<div class="delivery-no-change">Nenhum item de farm cadastrado neste Group.</div>';box.querySelectorAll('[data-remove-farm]').forEach(b=>b.onclick=()=>{techDraft.farm.itens.splice(+b.dataset.removeFarm,1);renderFarmItems();renderConnectedRequests();updateDeliveryPreview()});box.querySelectorAll('[data-edit-farm]').forEach(b=>b.onclick=()=>editFarmItem(+b.dataset.editFarm));}
function editFarmItem(i){const x=techDraft.farm.itens[i];if(!x)return;const nome=prompt('Nome do item:',x.nome||'');if(nome===null)return;const spawn=prompt('Spawn do item:',x.spawn||'');if(spawn===null)return;const qtd=prompt('Quantidade / observação de coleta:',x.qtd||'');if(qtd===null)return;x.nome=nome.trim();x.spawn=spawn.trim();x.qtd=qtd.trim();x.imagem=ITEM_META[x.spawn]?.imagem||x.imagem||'';renderFarmItems();renderConnectedRequests();updateDeliveryPreview();}
function addFarmItem(){techDraft.farm.itens.push({nome:'',spawn:'',qtd:'',imagem:''});editFarmItem(techDraft.farm.itens.length-1);techDraft.farm.itens=techDraft.farm.itens.filter(x=>x.nome||x.spawn);renderFarmItems();}
function renderStructureSnapshot(f=currentFactionFromForm()){const b=f?.beneficios||getFormBenefits(),t=techDraft||mergedTechProfile(f),items=[];const add=(n,v)=>{if(v)items.push([n,v])};add('Craft',t.craft?.cds||b.craft);add('Farm',t.farm?.cds||b.farm);add('Rota Exclusiva',t.rota?.pontos||b.rotaBlips);add('Garagem Pública',[b.garagemPublicaBlip,b.garagemPublicaSpawn].filter(Boolean).join(' / '));add('Garagem VIP',[b.garagemVipBlip,b.garagemVipSpawn].filter(Boolean).join(' / '));add('Heliponto',[b.helipontoBlip,b.helipontoSpawn].filter(Boolean).join(' / '));add('Rádio',b.radio);add('Baú',b.bau);add('Loja de Roupas',b.lojaRoupas);add('Barbearia',b.barbearia);add('Tatuagem',b.tatuagem);add('Shop Exclusivo',b.shopExclusivo);add('Arena',b.arena);add('Telão',b.telaoCds||b.telaoNome);const box=$('#groupStructureSnapshot');if(box)box.innerHTML=items.length?items.map(([n,v])=>`<div class="structure-chip"><span>${esc(n)}</span><b>${esc(v)}</b></div>`).join(''):'<div class="delivery-no-change">Nenhuma estrutura técnica cadastrada.</div>';}
function techChanged(oldF,newF){return JSON.stringify(mergedTechProfile(oldF))!==JSON.stringify(newF.perfilTecnico||mergedTechProfile(newF))}
function techAutoRequests(f=currentFactionFromForm()){
 const old=faccoes.find(x=>x.group===f.group)||{},now=f.perfilTecnico||getTechProfileFromForm(),oldT=mergedTechProfile(old),out=[];
 if(JSON.stringify(oldT.craft)!==JSON.stringify(now.craft)){
  const lines=['Assunto: Atualização do Craft do Group','','Solicitação:','',`- Atualizar o Craft do Group ${f.group};`,now.craft.cds?`- CDS do Craft: ${fmtCds(now.craft.cds)}`:'','', '- Produtos / receitas:'];
  (now.craft.receitas||[]).forEach(r=>{lines.push(`- ${r.nome}${r.spawn?` (${r.spawn})`:''}${r.nivel?` | Nível ${r.nivel}`:''}${r.max?` | Máx. ${r.max}`:''}`);lines.push(`  Receita: ${(r.insumos||[]).map(x=>`${x.nome||x.spawn} x${x.qtd}`).join(' + ')||'Sem insumos cadastrados'}`)});lines.push('',`- Permissão: ${f.group}.`);out.push({tipo:'ITENS',titulo:'Atualização de Craft / Receitas',texto:lines.filter((x,i)=>x!==''||lines[i-1]!=='').join('\n')});
 }
 if(JSON.stringify(oldT.farm)!==JSON.stringify(now.farm)||JSON.stringify(oldT.rota)!==JSON.stringify(now.rota)){
  const pts=String(now.rota?.pontos||'').split(/\r?\n|·/).map(x=>x.trim()).filter(Boolean),items=(now.farm?.itens||[]).map(x=>`- ${x.nome||x.spawn}${x.spawn?` (${x.spawn})`:''}${x.qtd?` — ${x.qtd}`:''}`);
  out.push({tipo:'ROTA_FARM',titulo:'Farm / Rota do Group',texto:['Assunto: Ativação / atualização de rota de farm exclusiva','','Solicitação:','',`- Group: ${f.group}`,now.farm?.cds?`- Farm: ${fmtCds(now.farm.cds)}`:'',now.rota?.nome?`- Rota: ${now.rota.nome}`:'','',...(items.length?['- Itens do Farm:',...items,'']:[]),'- Blips da rota:',...(pts.length?pts:['{ CDS },'])].filter(Boolean).join('\n')});
 }
 return out;
}
const _autoDeliveryRequestsV62=autoDeliveryRequests;autoDeliveryRequests=function(f=currentFactionFromForm()){return [..._autoDeliveryRequestsV62(f),...techAutoRequests(f)]};
const _updateDeliveryPreviewV62=updateDeliveryPreview;updateDeliveryPreview=function(){getTechProfileFromForm();_updateDeliveryPreviewV62();try{renderStructureSnapshot(currentFactionFromForm());renderConnectedRequests()}catch{}};
function renderConnectedRequests(){const box=$('#groupConnectedRequests');if(!box)return;let rs=[];try{rs=autoDeliveryRequests(currentFactionFromForm())}catch{}box.innerHTML=rs.length?rs.map((r,i)=>`<article class="delivery-request-card"><div><b>${i+1}. ${esc(r.titulo)}</b><span>${esc(r.tipo)}</span></div><pre>${esc(r.texto)}</pre></article>`).join(''):'<div class="delivery-no-change">Nenhuma solicitação técnica pendente pelas alterações atuais.</div>';}
$('#addCraftRecipeBtn')?.addEventListener('click',addRecipe);$('#addFarmItemBtn')?.addEventListener('click',addFarmItem);
['fTechCraftCds','fTechCraftNome','fTechFarmCds','fTechRouteName','fTechRoutePoints'].forEach(id=>$('#'+id)?.addEventListener('input',()=>{getTechProfileFromForm();renderConnectedRequests();renderStructureSnapshot(currentFactionFromForm());}));
document.querySelectorAll('.tech-tab').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.tech-tab').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.tech-panel').forEach(p=>p.classList.toggle('active',p.dataset.techPanel===b.dataset.techTab));if(b.dataset.techTab==='estrutura')renderStructureSnapshot(currentFactionFromForm());if(b.dataset.techTab==='solicitacoes')renderConnectedRequests()}));

// Alvesinho usa o mesmo perfil do Group — sem base paralela.
const _alvesAnswerV63Base=alvesAnswer;alvesAnswer=function(question=''){
 const q=alvesNorm(question),g=alvesFindGroup(question);if(g){const t=mergedTechProfile(g);
  if(q.includes('craft')||q.includes('fabric')||q.includes('receita')){const rs=t.craft?.receitas||[];const hit=rs.find(r=>q.includes(alvesNorm(r.nome))||q.includes(alvesNorm(r.spawn)));if(hit)return {text:`${hit.nome}${hit.spawn?' ('+hit.spawn+')':''}\n${hit.nivel?'Nível: '+hit.nivel+' • ':''}${hit.max?'Máx.: '+hit.max:''}\nReceita / insumos:\n${(hit.insumos||[]).map(x=>`• ${x.nome||x.spawn} x${x.qtd}`).join('\n')||'• Sem insumos cadastrados'}`,refs:[g.group,'Perfil Técnico','Craft']};return {text:rs.length?`Craft de ${g.group} (${rs.length} receita(s)):\n${rs.map(r=>`• ${r.nome}${r.spawn?' ('+r.spawn+')':''}`).join('\n')}`:`${g.group} não possui receitas de Craft cadastradas.`,refs:[g.group,'Perfil Técnico','Craft']};}
  if((q.includes('farm')||q.includes('insumo'))&&!q.includes('receita')){const xs=t.farm?.itens||[];return {text:xs.length?`Farm / Insumos de ${g.group}:\n${xs.map(x=>`• ${x.nome||x.spawn}${x.spawn?' ('+x.spawn+')':''}${x.qtd?' — '+x.qtd:''}`).join('\n')}`:`Nenhum insumo está cadastrado no Farm de ${g.group}.`,refs:[g.group,'Perfil Técnico','Farm']};}
  if(q.includes('rota'))return {text:`Rota de ${g.group}:\n${t.rota?.nome?`Nome: ${t.rota.nome}\n`:''}${t.rota?.pontos||'Nenhum ponto de rota cadastrado.'}`,refs:[g.group,'Perfil Técnico','Rota']};
 }
 return _alvesAnswerV63Base(question);
};
