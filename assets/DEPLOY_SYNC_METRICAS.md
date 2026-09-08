# High OS v7.8 — Sincronização permanente das métricas

A Central de Métricas agora usa uma Cloud Function agendada. O navegador deixa de ser o responsável pela atualização automática.

## 1. Compartilhar a planilha oficial

Compartilhe a planilha como **Leitor** com:

`high-os@appspot.gserviceaccount.com`

A função usa somente o escopo `spreadsheets.readonly`.

## 2. Ativar Google Sheets API

No projeto Google Cloud/Firebase `high-os`, ative **Google Sheets API**.

## 3. Instalar e publicar as Functions

Na raiz do projeto:

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

É necessário que o projeto Firebase esteja no plano que permita Cloud Functions/Cloud Scheduler.

## 4. Configuração no High OS

No High OS, entre como ADMIN → Central de Métricas → **FONTE**.

Informe o link/ID da planilha e, se quiser, a aba. Mantenha a sincronização automática ativada e salve.

O servidor executará a leitura automaticamente em `America/Sao_Paulo`:

- 14:05
- 16:05
- 21:05
- 23:05

O botão **SINCRONIZAR AGORA** chama a mesma função do servidor e continua restrito a ADMIN.

## Segurança

- A planilha é lida somente pelo backend.
- O RH não recebe acesso à planilha.
- Nenhuma chave privada é colocada no `app.js`.
- O histórico já salvo no Firestore continua disponível mesmo se o Google Sheets ficar temporariamente indisponível.
- Snapshots de facção/QG/segmento/líder existentes são preservados ao ressincronizar datas antigas.
