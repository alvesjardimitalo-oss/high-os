# High OS V9.4.0 — Segurança, desempenho e camada visual

Pacote de melhorias aplicado sobre a V9.3.3. Nada foi removido: todas as telas,
módulos e fluxos continuam como estavam. As mudanças são **aditivas ou corretivas**.

---

## 1. Segurança (o que era mais grave)

### 1.1 Chat não vaza mais conversas alheias
**Antes:** `onSnapshot(chatCol, ...)` baixava a coleção inteira de mensagens para
todo usuário logado e filtrava a conversa no navegador. Qualquer pessoa com o
console aberto lia as DMs de toda a equipe.

**Agora:** a escuta é por conversa —
`query(chatCol, where('conversationId','==',cid), orderBy('createdAt','desc'), limit(80))`.
Trocar de contato reassina a consulta; sair do sistema encerra o listener.

> Efeito colateral aceito: a pré-visualização da última mensagem na lista de
> contatos só aparece para a conversa aberta. Para reativar em todas, seria
> preciso um documento-resumo por conversa (sugestão para a V9.5).

### 1.2 `firestore.rules` — as permissões agora valem no servidor
O repositório não tinha arquivo de regras. `isAdmin()` e `canEditModule()` eram
apenas visuais. Foi criado `firestore.rules` replicando o modelo real:
`users/{email}` com `role`, `active` e `permissions` por módulo.

Destaques das regras:
- `users`: cada um lê o próprio cadastro; só ADMIN lista, cria, edita ou desativa.
- Cada coleção operacional exige VIEW para ler e EDIT para gravar, no módulo certo.
- `historico`: qualquer usuário ativo pode **criar** evento, ninguém altera ou
  apaga o passado — exceto ADMIN.
- `chat_mensagens`: leitura só para remetente ou destinatário; mensagem não pode
  ser editada depois de enviada; limite de 1000 caracteres validado no servidor.
- Regra final `allow read, write: if false` fecha tudo que não foi previsto.

**Publicar:** `firebase deploy --only firestore:rules,firestore:indexes`
ou colar em Firebase Console > Firestore > Regras.

### 1.3 Índice composto
`firestore.indexes.json` traz o índice que a nova consulta do chat exige
(`conversationId` ASC + `createdAt` DESC). Sem ele o chat retorna erro com um
link do console para criar o índice em um clique.

---

## 2. Bugs corrigidos

| Onde | Problema | Correção |
|---|---|---|
| `index.html` linha do menu | `class="nav-item" ... class="hidden"` — atributo duplicado, o segundo é ignorado pelo navegador, então o item Spotify aparecia mesmo devendo ficar oculto | atributos unificados em `class="nav-item hidden"` |
| `index.html` `<head>` | bloco `<style>` grande embutido (regras `.rh-*`) | movido para o fim do `style.css` |
| `app.js` | listener do chat continuava ativo após logout | `stopChat()` no `logout()` |

---

## 3. Desempenho

- **Imagens: 892 KB → 213 KB** (−76%). Logo de 232 KB para 34 KB; ícones de itens
  requantizados para paleta de 256 cores, sem perda visível.
- Ícones de item agora usam `loading="lazy"` e `decoding="async"`.
- `preconnect` para `gstatic`, `firestore.googleapis.com` e `unpkg`.
- Chat limitado a 80 mensagens por conversa em vez de 300 documentos da base toda.

---

## 4. Planejador de Missões na nuvem

Antes as missões viviam só em `localStorage`: trocou de navegador, perdeu tudo, e
nenhum outro staff enxergava o trabalho.

Agora existe uma ponte opcional e tolerante a falha:

- `app.js` expõe `window.HighOSMissionCloud` com `pull()` e `push()` gravando em
  `highos/data/config/missoes_planejador` (respeitando a permissão do módulo
  `planejador`).
- `mission-planner.js` continua salvando local **e** envia para a nuvem com debounce
  de 2,5 s; ao abrir o módulo, busca a versão da equipe e só aplica se for mais
  recente que o último salvamento local (`highos_mission_planner_saved_at`).
- Se o Firestore falhar ou o usuário não tiver permissão, o planejador segue
  funcionando exatamente como antes, offline.

---

## 5. Camada visual e acessibilidade (`assets/ui-kit.css` + `assets/ui-kit.js`)

Dois arquivos novos, carregados depois de tudo, sem tocar no CSS histórico.

- **Toasts no lugar de `alert()`** — os 166 `alert()` do app.js viram avisos não
  bloqueantes no canto, com ícone por tipo (erro, sucesso, atenção, info),
  pausa ao passar o mouse e botão de fechar. O `confirm()` nativo foi mantido de
  propósito: ele é síncrono e o código depende do retorno booleano.
  Também disponível como `highToast('mensagem', 'ok')`.
- **Design tokens** — superfícies, texto, marca, espaçamento, raio, sombra e
  tempo de transição em variáveis. `--text-2` / `--text-3` corrigem os cinzas que
  estavam abaixo de 4.5:1 de contraste.
- **Skeletons** — os placeholders "CARREGANDO ..." ganham brilho animado; há
  `highSkeleton(n)` e a classe `.high-empty` para estados vazios padronizados.
- **Menu mobile** — abaixo de 900px a sidebar vira drawer com botão MENU,
  fundo escurecido, fechamento por ESC, por clique fora e ao escolher um módulo.
  Alvos de toque de no mínimo 44px no celular.
- **Tabelas** — cabeçalho fixo ao rolar, linhas zebradas, destaque no hover,
  números com `tabular-nums` e rolagem horizontal contida na própria área.
- **Acessibilidade** — foco visível com `:focus-visible`, link "pular para o
  conteúdo", `aria-label` automático nos botões só com ícone (`⌂`, `◆`, `▤`),
  glifos decorativos marcados como `aria-hidden`, regiões com rótulo e respeito a
  `prefers-reduced-motion`.
- **Impressão** — relatórios de métricas saem sem menu, topo nem toasts.
- Auxiliares: `highBusy(botao, true)` para estado de carregamento em botões.

---

## 6. O que ficou de fora de propósito

Itens que valem a próxima rodada, mas exigem testes com a base real:

1. **Paginação de `historico` e `metricas`.** Ainda são `getDocs()` da coleção
   inteira. Precisa de `where` por período + cursor, e várias telas fazem contas
   em cima do array completo — mexer sem testar quebraria relatórios.
2. **Anexos do chat para o Firebase Storage.** Hoje vão em base64 dentro do
   documento (até 600 KB cada). Migrar exige regras de Storage e migração dos
   anexos antigos.
3. **Quebrar o `app.js` em módulos.** O arquivo tem linhas de 20 mil caracteres
   (a 1790 e a 86), o que impede revisar diff no GitHub. O caminho é rodar
   Prettier e separar em `auth.js`, `orgs.js`, `metrics.js`, `chat.js`, `ui.js`.
4. **SRI nos CDNs** (Leaflet e html2canvas) ou, melhor, hospedar os dois no
   próprio repositório.
5. **Refresh token do Spotify fora do `localStorage`.**

---

## 7. Como publicar

1. Substitua os arquivos na raiz do repositório `high-os` e faça o push.
2. Publique as regras e o índice do Firestore (seção 1.2/1.3) — **este passo é
   obrigatório**, senão o chat novo não lê nada.
3. Force atualização com Ctrl+F5 (todos os assets subiram para `?v=9.4.0`).
