# High OS V12.5 — revisão de segurança e automação

Versão fechada em cima da V12.4.0. Nenhuma tela mudou de lugar; o foco foi
corrigir um bug real de gravação, fechar brechas nas regras do Firestore e
colocar a verificação automática que a documentação já citava, mas não existia.

---

## 1. Recolhimento com print falhava inteiro (bug)

O recolhimento grava o print do painel em `highos/data/evidencias_recolhimento`,
mas essa coleção **não tinha regra** no `firestore.rules`. O catch-all do fim do
arquivo recusava a gravação com `permission-denied` e, como o print é gravado
antes do Group, **o recolhimento abortava por completo**: o Group não ficava
vago e nada ia para o histórico. Sem print, funcionava — por isso passava
despercebido.

Nova regra: lê quem vê Facções; cria quem edita Facções, só em nome próprio e
só imagem de até ~780 KB; ninguém altera (é prova); só ADMIN apaga.

## 2. Regras do Firestore mais firmes

| Coleção | Antes | Agora |
|---|---|---|
| `historico` | qualquer usuário ativo criava evento **em nome de qualquer pessoa** | o campo `usuario` precisa ser o e-mail de quem está logado |
| `sessoes_usuario` | qualquer usuário ativo criava/alterava **sessão de outro** | cada um só cria e atualiza a própria sessão; não dá para trocar o dono |
| `chat_mensagens` | `recipientEmail` não era conferido | o destinatário precisa estar em `participants` |

As 45 gravações de histórico do app já mandam `usuario: currentUser.email`, e as
sessões já mandam `email` — nada no fluxo normal muda.

## 3. Planejador de Missões: nomes escapados (XSS)

Nomes de evento, zona e rótulo do centro são digitados pela equipe, sincronizam
pelo Firestore e eram colados direto em `innerHTML` e nos popups do Leaflet. Um
nome como `<img src=x onerror=...>` rodaria código na sessão de quem abrisse o
Planejador — inclusive ADMIN. O `mission-planner.js` ganhou `esc()` e passou a
usá-la na Central de Missões, no Replicador e no popup do centro. No `app.js`, o
`data-id` dos cards de Group também passou a ser escapado.

## 4. Verificação automática no GitHub (Actions)

O `COMO-NAVEGAR-O-CODIGO.md` citava `.github/workflows/verificar.yml`, mas o
arquivo não estava no repositório. Agora está. A cada commit, **sem precisar de
Node no seu computador**, o GitHub:

1. confere a sintaxe de todos os `.js`;
2. roda `verificar-integridade.mjs` (funções perdidas);
3. roda o novo `verificar-regras.mjs`;
4. imprime o mapa do código;
5. imprime os hashes SRI de Leaflet e html2canvas (informativo).

Resultado na aba **Actions** e como ✓/✗ ao lado do commit.

### Novo: `tools/verificar-regras.mjs`

Lê todos os caminhos do Firestore usados no código e reprova se algum não tiver
`match` no `firestore.rules`. Testado contra as regras antigas: reprova
apontando `evidencias_recolhimento` — ou seja, teria pego o bug do item 1.

---

## Para publicar

1. Suba os arquivos pelo GitHub web (inclusive a pasta `.github`).
2. **Publique as regras**: Firebase Console › Firestore › Regras › cole o
   `firestore.rules` › Publicar. Sem isso o item 1 continua quebrado.
3. Abra a aba Actions e confira se a verificação ficou verde.
4. Teste rápido: um recolhimento **com** print, uma mensagem no chat e abrir o
   Planejador.

## Continua pendente (da lista da V9.9)

Ambiente `dev` separado, anexos do chat no Storage, auto-hospedar Leaflet e
html2canvas (os hashes SRI agora aparecem no Actions) e limpeza do CSS.
