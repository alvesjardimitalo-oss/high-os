import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { getFirestore, doc, getDoc, collection, getDocs, setDoc, addDoc, serverTimestamp, writeBatch } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

const firebaseConfig={apiKey:'AIzaSyBKtl3rCA9Id1RDMwGch-yi4hxAs83DraU',authDomain:'high-os.firebaseapp.com',projectId:'high-os',storageBucket:'high-os.firebasestorage.app',messagingSenderId:'471862600170',appId:'1:471862600170:web:ff55af6f7e808ff393d293'};
const app=initializeApp(firebaseConfig), auth=getAuth(app), db=getFirestore(app), provider=new GoogleAuthProvider();
provider.setCustomParameters({prompt:'select_account'});
const $=s=>document.querySelector(s), loginView=$('#loginView'),deniedView=$('#deniedView'),appView=$('#appView'),sessionArea=$('#sessionArea');
let currentUser=null,currentProfile=null,faccoes=[],solicitacoes=[],usuarios=[];
const facCol=collection(db,'highos','data','faccoes'), histCol=collection(db,'highos','data','historico'), reqCol=collection(db,'highos','data','solicitacoes'), usersCol=collection(db,'users');
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
  farm:$('#fFarm').value.trim(),
  craft:$('#fCraft').value.trim(),
  rotaExclusiva:$('#fRotaExclusiva').checked,
  rotaBlips:$('#fRotaBlips').value.trim(),
  telao:$('#fTelao').checked,
  telaoNome:$('#fTelaoNome').value.trim(),
  telaoPostit:$('#fTelaoPostit').value.trim(),
  telaoCds:$('#fTelaoCds').value.trim(),
  outros:$('#fOutrosBeneficios').value.trim()
 };
}
function setFormBenefits(b={}){
 $('#fVipOrg').checked=!!b.vipOrg;$('#fChatFaccao').checked=!!b.chatFaccao;
 $('#fSalario').value=b.salario||'';$('#fSalarioMin').value=b.salarioMinutos||'';$('#fRadio').value=b.radio||'';
 $('#fGaragemVipBlip').value=b.garagemVipBlip||'';$('#fGaragemVipSpawn').value=b.garagemVipSpawn||'';$('#fGaragemVipVeiculos').value=b.garagemVipVeiculos||'';
 $('#fLojaRoupas').value=b.lojaRoupas||'';$('#fBarbearia').value=b.barbearia||'';$('#fTatuagem').value=b.tatuagem||'';$('#fShopExclusivo').value=b.shopExclusivo||'';
 $('#fBau').value=b.bau||'';$('#fBauCapacidade').value=b.bauCapacidade||'';$('#fArena').value=b.arena||'';$('#fFarm').value=b.farm||'';$('#fCraft').value=b.craft||'';
 $('#fRotaExclusiva').checked=!!b.rotaExclusiva;$('#fRotaBlips').value=b.rotaBlips||'';$('#fTelao').checked=!!b.telao;$('#fTelaoNome').value=b.telaoNome||'';$('#fTelaoPostit').value=b.telaoPostit||'';$('#fTelaoCds').value=b.telaoCds||'';$('#fOutrosBeneficios').value=b.outros||'';
}
function currentFactionFromForm(){
 const old=faccoes.find(x=>x.group===$('#fGroup').value)||{};
 return {...old,group:$('#fGroup').value,status:$('#fStatus').value,faccao:$('#fFaccao').value.trim(),qg:$('#fQG').value.trim(),produto:$('#fProduto').value.trim(),lider:$('#fLider').value.trim(),staff:$('#fStaff').value.trim(),dataEntrega:$('#fData').value.trim(),anuncio:$('#fAnuncio').value.trim(),cds:$('#fCds').value.trim(),observacoes:$('#fObs').value.trim(),beneficios:getFormBenefits()};
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
function updateDeliveryPreview(){if($('#deliveryPreview'))$('#deliveryPreview').value=buildDeliveryExtract()}
async function copyDeliveryExtract(){const t=$('#deliveryPreview').value;try{await navigator.clipboard.writeText(t);const b=$('#copyDeliveryBtn'),o=b.textContent;b.textContent='COPIADO ✓';setTimeout(()=>b.textContent=o,1400)}catch(e){$('#deliveryPreview').select();document.execCommand('copy')}}

function openFac(id){
 const f=faccoes.find(x=>x.id===id);if(!f)return;
 $('#fGroup').value=f.group;$('#fGroupShow').value=f.group;$('#fStatus').value=f.status||'INATIVA';$('#fFaccao').value=f.faccao||'';$('#fQG').value=f.qg||'';$('#fProduto').value=f.produto||'';$('#fLider').value=f.lider||'';$('#fStaff').value=f.staff||'';$('#fData').value=f.dataEntrega||'';$('#fAnuncio').value=f.anuncio||'';$('#fCds').value=f.cds||'';$('#fObs').value=f.observacoes||'';setFormBenefits(f.beneficios||{});$('#facModalTitle').textContent=f.group;$('#facModal').classList.remove('hidden');updateDeliveryPreview();
 $('#recolherBtn').style.display=f.status==='ATIVA'?'block':'none';
}
$('#facModalClose').onclick=()=>$('#facModal').classList.add('hidden');
$('#facModal').addEventListener('click',e=>{if(e.target.id==='facModal')$('#facModal').classList.add('hidden')});
['fStatus','fFaccao','fQG','fProduto','fLider','fStaff','fData','fAnuncio','fCds','fObs','fVipOrg','fChatFaccao','fSalario','fSalarioMin','fRadio','fGaragemVipBlip','fGaragemVipSpawn','fGaragemVipVeiculos','fLojaRoupas','fBarbearia','fTatuagem','fShopExclusivo','fBau','fBauCapacidade','fArena','fFarm','fCraft','fRotaExclusiva','fRotaBlips','fTelao','fTelaoNome','fTelaoPostit','fTelaoCds','fOutrosBeneficios'].forEach(id=>$('#'+id)?.addEventListener('input',updateDeliveryPreview));
$('#copyDeliveryBtn').onclick=copyDeliveryExtract;

$('#facForm').onsubmit=async e=>{
 e.preventDefault();const group=$('#fGroup').value,old=faccoes.find(x=>x.group===group);const data={...old,status:$('#fStatus').value,faccao:$('#fFaccao').value.trim(),qg:$('#fQG').value.trim(),produto:$('#fProduto').value.trim(),lider:$('#fLider').value.trim(),staff:$('#fStaff').value.trim(),dataEntrega:$('#fData').value.trim(),anuncio:$('#fAnuncio').value.trim(),cds:$('#fCds').value.trim(),observacoes:$('#fObs').value.trim(),beneficios:getFormBenefits(),updatedAt:serverTimestamp(),updatedBy:currentUser.email};
 if(data.status==='ATIVA'&&!data.faccao){alert('Informe o nome da facção para marcar como ATIVA.');return}
 try{await setDoc(doc(db,'highos','data','faccoes',group),data);await addDoc(histCol,{tipo:old?.status==='INATIVA'&&data.status==='ATIVA'?'ENTREGA':'EDICAO',group,antes:snapshot(old),depois:snapshot(data),usuario:currentUser.email,data:serverTimestamp()});$('#facModal').classList.add('hidden');await loadFaccoes()}catch(err){alert('Erro ao salvar: '+err.message)}
};
$('#recolherBtn').onclick=async()=>{
 const group=$('#fGroup').value,old=faccoes.find(x=>x.group===group);if(!old||!confirm(`Recolher ${old.faccao||group} e deixar ${group} VAGO? O histórico será preservado.`))return;
 const data={...old,status:'INATIVA',faccao:'',lider:'',staff:'',dataEntrega:'',observacoes:old.observacoes||'',updatedAt:serverTimestamp(),updatedBy:currentUser.email};
 try{await setDoc(doc(db,'highos','data','faccoes',group),data);await addDoc(histCol,{tipo:'RECOLHIMENTO',group,antes:snapshot(old),depois:snapshot(data),usuario:currentUser.email,data:serverTimestamp()});$('#facModal').classList.add('hidden');await loadFaccoes()}catch(err){alert('Erro ao recolher: '+err.message)}
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
