# High OS V8.0 — Sincronização bidirecional com Google Sheets

Planilha configurada:
- Spreadsheet ID: `1MBVzWMFrAzIhYlT7-ZgWZEAoJLjPn3JeZdmHyRcZf2A`
- GID da aba: `1572584288`

## Como funciona

1. Entre no High OS como ADMIN.
2. Abra **Administração**.
3. Em **Google Sheets • Documento das Facções**, clique em **CONECTAR GOOGLE SHEETS**.
4. Autorize a permissão de edição da planilha.
5. Para buscar alterações feitas manualmente na planilha, clique em **VERIFICAR ALTERAÇÕES DA PLANILHA**.
6. O High OS mostra uma prévia campo a campo. Nada é importado antes de clicar em **CONFIRMAR E ATUALIZAR HIGH OS**.
7. Depois que a planilha estiver conectada, alterações de Group feitas no High OS (edição, entrega, recolhimento, transferência de painel e troca de QG) são enviadas automaticamente à linha correspondente da planilha.
8. Se a sessão perder a autorização do Google, o High OS continua salvando no Firestore e sinaliza que a planilha está pendente. Reconecte e use **ENVIAR HIGH OS → PLANILHA** para reconciliar toda a base.

## Campos sincronizados

A:L
- nº
- CDS
- Anuncio Discord ?
- Nome QG ou Favela
- Group
- Produto
- Facção
- STATUS
- Líder (ID/Nome/Tel)
- Staff Responsável
- Data Entrega
- Observações

Craft, farm, benefícios, métricas, solicitações, evidências e histórico não são sobrescritos pela planilha.

## Requisito Google

O projeto Google/Firebase usado pelo High OS precisa ter a **Google Sheets API** habilitada. O usuário conectado precisa ter permissão de edição na planilha. A integração usa OAuth; nenhuma senha ou chave de escrita da planilha fica exposta no código.
