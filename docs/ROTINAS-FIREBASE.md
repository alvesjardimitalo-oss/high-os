# High OS · Rotinas que falam com o Firebase

Mapa de tudo que o painel lê e grava, para você saber onde a cota está sendo
gasta e o que continua funcionando quando o Firebase falha.

Para ver os números da sessão atual, abra o console (F12) e digite:

```js
highOSRotinas()
```

Sai uma tabela com leituras reais no Firestore, documentos lidos, respostas
servidas pelo cache e falhas, por coleção.

---

## 1. Leitura — coleções inteiras

Todas passam pela camada `getDocsCached()`: janela de 20s na memória, espelho no
`localStorage` e queda para **modo local** se o Firestore não responder.

| Rotina | Coleção | Quando dispara | Cresce com o tempo? |
|---|---|---|---|
| `loadFaccoes()` | `faccoes` | login e ao abrir Organizações | não (é finita) |
| `loadOrganizations()` | `organizacoes` | login e aba Facções | não |
| `loadDeliveries()` | `entregas` | aba Entregas | **sim** |
| `loadRequests()` | `solicitacoes` | aba Solicitações | devagar |
| `loadUsers()` | `users` | login e aba Usuários | não |
| `loadHistory()` / `orgHistory()` | `historico` | aba Histórico, perfis, auditoria | **sim, sem limite** |
| `loadUserAudit()` | `sessoes_usuario` | Administração > Acessos | **sim** |
| `loadDashboardAlertStates()` | `alertas_dashboard` | Dashboard | pouco |
| `loadMetrics()` | `metricas` | aba Métricas (janela de 2 min) | **sim, o maior volume** |

Os três marcados em negrito são os que vão estourar a cota primeiro. A correção
definitiva é filtrar por período no servidor (`where` + cursor), ainda pendente.

## 2. Leitura — tempo real (`onSnapshot`)

| Rotina | Coleção | Escopo |
|---|---|---|
| `startMetricRealtime()` | `metricas` | coleção inteira enquanto a aba Métricas está aberta |
| `subscribeChatConversation()` | `chat_mensagens` | **só a conversa aberta**, 80 mensagens (V9.4) |

Listener aberto cobra leitura a cada alteração. O do chat encerra ao trocar de
contato e no logout; o de métricas segue ativo enquanto a aba estiver aberta.

## 3. Gravação

`setDoc`, `addDoc`, `deleteDoc` e `writeBatch` foram embrulhados: **toda gravação
limpa a janela de cache**, então nenhuma tela mostra dado velho logo depois de
salvar. As gravações mais frequentes são o histórico (cada ação registra um
evento), sessões de usuário, chat e as configurações em `highos/data/config`.

## 4. O que acontece quando o Firebase cai ou bate o limite

1. A leitura falha e a camada devolve o último espelho salvo neste navegador.
2. O painel entra em **MODO LOCAL**: faixa amarela no rodapé, dados visíveis,
   gravações não confiáveis.
3. Ao voltar, a primeira leitura bem-sucedida remove a faixa sozinha.

O que **não** depende do Firebase:

- Planejador de Missões — funciona inteiro com `localStorage` + IndexedDB
  (snapshots do mapa). A nuvem é sincronização, não requisito.
- Todos os módulos abertos antes da queda continuam navegáveis com o espelho.

O que **depende** e não tem substituto local:

- Login (Google Authentication).
- Chat em tempo real.
- Qualquer gravação.

## 5. Como reduzir a conta ainda mais

Em ordem de retorno:

1. Paginar `historico` e `metricas` por período — hoje é o grosso das leituras.
2. Fechar o listener de métricas quando a aba perder o foco.
3. Guardar um documento-resumo por conversa em vez de contar mensagens.
4. Mover anexos do chat (base64, até 600 KB por documento) para o Storage.
5. Subir o espelho local para IndexedDB, que não tem o teto de ~5 MB do
   `localStorage` — hoje coleções acima de ~1,2 MB não são espelhadas.
