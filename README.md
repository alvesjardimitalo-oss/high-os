# HIGH OS · Central do Ilegal

Painel da staff do Ilegal do High Roleplay. Sistema refeito do zero em novembro de 2026: do anterior ficaram só o **Planejador de missões** (mapa e editor) e os **modelos de aviso de entrega e recolhimento**. O sistema antigo continua guardado no histórico do Git.

## Como funciona
- **Site estático** no GitHub Pages: `index.html` + módulos em `assets/js/`, sem etapa de build.
- **Login Google** pelo Firebase (projeto `high-os`). Só entra quem está em `users/{email}` com `active` diferente de `false`.
  - Papéis: `ADMIN` (tudo, incluindo Configurações), `STAFF` (publica avisos e edita o planejador) e `CONSULTA` / `RH_*` (só vê).
- **Planilhas: leitura, com uma exceção.** O login pede ao Google `spreadsheets`. O High OS só lê, exceto no **recolhimento**: depois de postar o aviso, limpa na aba *Cadastro de Facções* as colunas da org do Group (ASSUMIDO → NÃO, NOME DA FACÇÃO, líder, sublíder, STATUS → DISPONÍVEL). Group, QG, VIPs e benefícios não são tocados. Quem publica precisa ter permissão de edição na planilha; se a limpeza falhar, o aviso sai mesmo assim e o sistema avisa o que limpar à mão.
  - Cada pessoa lê com a própria conta, que precisa ter acesso às planilhas.
  - O acesso vale 1 hora. Depois aparece o botão **Renovar acesso**.
  - Os dados são lidos de novo a cada 5 minutos.
  - Planilhas usadas:
    - *HIGH · Documento das facções do Ilegal*: cadastro, conferência, base de groups, catálogo de VIPs e histórico.
    - *Ilegal · High Season 3*: economia e log de sincronização.
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
assets/js/app.js           login, navegação e leitura periódica das planilhas
assets/js/nuvem.js         Firebase (perfil, webhooks, avisos, zonas) e Google Sheets (leitura + limpeza da org no recolhimento)
assets/js/dados.js         conversão das planilhas em facções, ocupação, VIPs, economia (funções puras)
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
