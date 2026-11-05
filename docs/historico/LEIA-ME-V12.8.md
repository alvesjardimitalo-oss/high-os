# HIGH OS V12.8 — Planejador: navegação por etapas

## O que mudou
- Etapas numeradas acima do editor: 1 Zona · 2 Spawns · 3 Validação · 4 Safe (só gás) · 5 Solicitação.
- Cada etapa mostra só os cards dela; rodapé com Voltar / Próxima etapa.
- Botões com legenda curta e ícone de linha, sem caixa alta e sem emoji (assets/mission-planner-nav.js + .css).
- Corrigido: todas as abas ficavam empilhadas; Salvar/Cancelar/Desfazer/Refazer apareciam fora do modo edição.

## Inclui a V12.7
Este pacote também traz os arquivos da V12.7 (dados por zona no Firestore). Se a V12.7 ainda não foi publicada:
1. Firebase Console → Firestore → Regras: cole o firestore.rules e publique ANTES de subir o código.

## Publicar
Envie para a RAIZ do repositório (não dentro de uma pasta nova):
- index.html
- assets/app.js, assets/mission-planner.js, assets/mission-planner-nav.js, assets/mission-planner-nav.css
Depois: Ctrl + F5. O selo do planejador deve mostrar DEV 12.8.0.
