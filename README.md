
## V9.4.1 (atual)
- **Correcao critica das regras**: a V9.4 bloqueava o chat inteiro ("Missing or insufficient permissions"). Numa consulta de lista o Firestore valida a regra contra os FILTROS, nao documento a documento. Agora cada mensagem carrega `participants` e a consulta usa `array-contains`.
- Rode `tools/migrar-chat.html` uma vez, como ADMIN, para preencher `participants` nas mensagens antigas.
- Republique regras e indice: `firebase deploy --only firestore:rules,firestore:indexes` (o indice mudou: conversationId + participants + createdAt).
- Camada de resiliencia: espelho local de cada colecao, janela de 20s e MODO LOCAL quando o Firebase cai ou bate a cota. `highOSRotinas()` no console mostra o consumo. Detalhes em `ROTINAS-FIREBASE.md`.
- Planejador reorganizado em abas (ZONA / PONTOS / VALIDACAO / ENTREGA), KPIs sobre o mapa e mar de Cayo Perico na mesma cor de Los Santos.
- Validador de CDS refeito: aceita tpcds, chaves, vector4, ponto e virgula ou espaco; avisa desvio em metros; Enter valida e pula para o proximo pendente; validacao em lote.

## V9.4.0
- Chat passa a escutar somente a conversa aberta (`where conversationId` + `limit 80`): acabou o vazamento de DMs entre usuarios.
- Novo `firestore.rules` + `firestore.indexes.json`. **Publique antes de usar a V9.4**, senao o chat nao carrega:
  `firebase deploy --only firestore:rules,firestore:indexes`
- Planejador de Missoes sincroniza com o Firestore (`highos/data/config/missoes_planejador`) mantendo o localStorage como cache.
- Novos `assets/ui-kit.css` e `assets/ui-kit.js`: toasts no lugar dos alert(), menu lateral em drawer no celular, skeletons, foco visivel e rotulos de acessibilidade.
- Imagens otimizadas: 892 KB -> 213 KB.
- Correcoes: atributo `class` duplicado no item Spotify do menu, CSS inline do `<head>` movido para o `style.css`, listener do chat encerrado no logout.
- Detalhes completos em `CHANGELOG-V9.4.0.md`.

## High OS V8.33

Atualização do Planejador de Missões com missões salvas, validação assistida, snapshots do mapa e presets Dominação/Fac x Fac.

# High OS DEV

Ambiente de desenvolvimento separado do Mercado Negro público.

## Publicar no GitHub Pages
1. Envie todos os arquivos desta pasta para a raiz do repositório `high-os`.
2. GitHub > Settings > Pages.
3. Source: Deploy from a branch.
4. Branch: `main` / `(root)` > Save.
5. Aguarde o endereço do GitHub Pages aparecer.

## Firebase
Projeto configurado: `high-os`.
O login usa Google Authentication e valida o documento `users/{email}` no Firestore.

## Importante: domínio autorizado
Após o GitHub Pages gerar o endereço, adicione o domínio `SEU-USUARIO.github.io` em:
Firebase Console > Authentication > Settings > Authorized domains.

O Mercado Negro atual não é alterado por este projeto.


## V9.0.11
- Facções disponíveis cadastradas voltam a aparecer em Organizações mesmo antes do recadastro das CDS V9.
- Groups apenas detectados por métricas continuam ocultos até terem ocupação, cadastro de disponível ou QG/estrutura configurada.
- Mantém integralmente o salvamento estável da V9.0.10.
