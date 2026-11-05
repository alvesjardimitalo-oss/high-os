# HIGH OS DEV 15.5.16 — Integridade operacional (22/10/2026)

## O que foi corrigido
- Recolhimento de facção: Group, vínculo da organização, entregas ativas, evidência do painel e auditoria passam a ser confirmados em um único `writeBatch`. Uma falha interrompe o lote, sem recolhimento parcial.
- Transferir Painel e Trocar QG: alteração dos dois Groups, vínculos de organizações e histórico são gravados atomicamente. O registro complementar em `ocupacoes` é tentado após a confirmação principal, com aviso explícito se as regras do Firestore ainda não autorizarem.
- Planilha BLIPS COORDENADAS: mantém dados antigos durante entregas; alterações expressas no editor técnico atualizam somente campos que mudaram, sem restaurar coordenadas antigas de outros itens.
- Garagens e blindados: serialização de BLIP e SPAWN em linhas separadas dentro da célula, com suporte a garagem Deluxe e listas de blindados.
- Removidos do espelho de CDS campos de benefícios que não são blips: rota exclusiva, rádio, salário, VIP Org, chat, sinuca e capacidade de baú.
- Sincronização detecta Groups em categorias erradas ou duplicados e apresenta pendência; não move quadros preenchidos automaticamente.
- Leitura de métricas: verifica validade de datas e encontra blocos mensais além da linha 600.
- Solicitações: função `updateRequestPreview` restaurada; removida chamada órfã de arquivos de uma sala de reunião não utilizada.
- Regras: nova regra de `ocupacoes` (criação controlada, registros imutáveis) e proteção dos participantes nas atualizações de `call_signals`.
- `index.html`: nova versão de carregamento do `app.js` para evitar mistura de arquivos antigos.

## Testes
GitHub Actions executa `node --check`, `node --test tests/*.test.mjs`, verificador de integridade e verificador de chamadas. Nenhum dos testes utiliza o banco de produção ou altera registros reais.

## Publicação do Firebase — requer credenciais da conta
O commit de `firestore.rules` no GitHub **não aplica as regras ao Firebase**. Para ativar a trilha complementar das ocupações e a proteção das chamadas:

```bash
firebase deploy --only firestore:rules,firestore:indexes --project high-os
```

Confirmar também que a regra publicada corresponde à do repositório. A transferência continua funcional sem essa atualização, mas exibirá aviso de registro complementar pendente.

## Pontos ainda não concluídos nesta entrega
- Paginação das coleções grandes (`historico`, `sessoes_usuario` e parte das métricas).
- Refatoração estrutural ampla de `app.js` e versões legadas.
- Reconciliação automática de mudança de categoria de quadros já preenchidos da planilha.
- Testes com login real, Google Sheets e Discord/FiveM em produção.
- Validação de permissões campo a campo para todos os caminhos de edição.

## Recuperação
A branch `backup/highos-before-audit-20261022` preserva o estado anterior da `main`. Antes de restaurar código, conferir se houve alterações posteriores no banco; o backup é somente do repositório, não de documentos do Firestore.
