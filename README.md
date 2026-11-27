# HIGH OS · Central do Ilegal

Painel da staff do Ilegal do High Roleplay. Sistema refeito do zero em novembro de 2026: do anterior ficaram só o **Planejador de missões** (mapa e editor) e os **modelos de aviso de entrega e recolhimento**. O sistema antigo continua guardado no histórico do Git.

## Como funciona
- **Site estático** no GitHub Pages: `index.html` + módulos em `assets/js/`, sem etapa de build.
- **Login Google** pelo Firebase (projeto `high-os`). Só entra quem está em `users/{email}` com `active` diferente de `false`.
  - Papéis: `ADMIN` (tudo, incluindo Configurações), `STAFF` (publica avisos e edita o planejador) e `CONSULTA` / `RH_*` (só vê).
- **Base das facções no Firebase.** O High OS é a fonte dos dados (cadastro, conferência, base de groups, catálogo de VIPs e histórico).
  - Cada aba fica em `hos/planilha/{aba}/{linha}` (`{ ordem, valores }`); cabeçalhos e datas em `hos/planilha`. Leitura em tempo real para todos.
  - Entrega e recolhimento atualizam o cadastro na hora; a staff edita cadastro, conferência, VIPs e histórico pelas telas. Toda alteração vai para `hos/dados/alteracoes` (antes/depois, quem, quando).
  - Colunas que na planilha são fórmula (segmento, QG, status, VIPs da conferência) são calculadas pelo sistema (`assets/js/base.js`).
  - **Planilha só por botão (ADMIN), em Configurações:** *Importar da planilha* (migração; substitui a base) e *Enviar para a planilha* (copia a base para a planilha mantendo as fórmulas e refazendo as que sumiram). O Google pede a permissão de edição só nessa hora.
  - Regras novas em `firestore.rules` (publicar no Console antes de usar).
- **Avisos ao Discord.** A tela *Entregas e recolhimentos* posta direto na webhook do canal.
  - Os endereços das webhooks ficam no Firestore (`hos/config/privado/webhooks`), cadastrados em *Configurações*. Nunca ficam no código.
  - Cada envio é registrado em `hos/dados/avisos`.
- **Planejador.** O módulo `assets/mission-planner.js` é o mesmo de antes. As zonas ficam em `highos/data/missoes_zonas` (uma por documento, com `rev`).
- **Métricas** (metricas.highrp.net): o coletor em `coletor/` roda no computador do administrador com a sessão do Discord, lê o site 4 vezes por dia e grava em `hos/metricas`. Instalação em `coletor/LEIAME.md`.

## Telas
Painel · Facções · Ficha da facção · Conferência · Catálogo VIP · Economia · Entregas e recolhimentos · Planejador de missões · Métricas · Configurações (admin)

## Arquivos
```
index.html                 casca do app
assets/css/app.css         identidade visual
assets/js/app.js           login, navegação e base em tempo real (Firebase)
assets/js/nuvem.js         Firebase (perfil, base das facções, webhooks, avisos, zonas) e Google Sheets (importar/enviar, ADMIN)
assets/js/base.js          base das facções: planilha ⇄ Firebase, campos calculados, entrega/recolhimento, exportação (funções puras)
assets/js/dados.js         montagem das facções, ocupação, VIPs, economia para as telas (funções puras)
assets/js/avisos.js        modelos dos avisos de entrega e recolhimento
assets/js/telas.js         telas
assets/js/planejador.js    encaixe do planejador (mapa mantido do sistema anterior)
assets/planejador.html     marcação do planejador
firestore.rules            regras do projeto high-os (inclui o bloco /ti do Ítalo InfoTec)
coletor/                   coletor de métricas (Node, roda no PC do administrador)
tests/                     node --test tests/*.test.mjs
```

## Verificar antes de publicar
```
node --test tests/*.test.mjs
```

## Regras do Firestore
O projeto `high-os` é compartilhado com o Ítalo InfoTec (bloco `/ti`, copiado de `italo-alves-ti/firebase/regras-ti.rules`).

Publicar substitui o arquivo inteiro de regras. Antes de colar no Console, confira se há regra de outro app que não esteja aqui.
