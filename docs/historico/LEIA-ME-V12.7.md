# HIGH OS V12.7 — Planejador: dados seguros na nuvem

## O que mudou
- **Uma zona por documento** no Firestore (`highos/data/missoes_zonas/{zona}`), no lugar do documento único `config/missoes_planejador`.
- **Ninguém sobrescreve o trabalho de outra pessoa.** Cada zona tem um número de versão (`rev`). Se alguém salvou a mesma zona depois que você abriu, o sistema pergunta qual versão manter.
- **Exclusão definitiva e para toda a equipe.** Excluir grava um marcador na nuvem. Backups locais, presets e outros navegadores não recriam mais a zona. Sem Firebase conectado, a exclusão é bloqueada e nada é apagado.
- **Salvar envia só as zonas alteradas**, não a lista inteira.
- **Sem limite de 1 MB** para o conjunto de zonas (o limite agora é por zona).

## Migração (automática, uma vez só)
Na primeira abertura do Planejador por alguém com permissão de edição, o sistema junta o documento antigo com a cópia local desse navegador (fica a versão mais recente de cada zona) e cria os documentos novos. Uma trava impede dois navegadores de migrarem ao mesmo tempo.
O documento antigo **não é apagado**: continua como cópia de segurança, somente leitura.

Depois da migração, revise a lista: zonas que já tinham sido excluídas no formato antigo podem reaparecer uma última vez (o formato antigo não guardava exclusões). Exclua de novo; agora é definitivo.

## Ordem para publicar
1. Firebase Console → Firestore → Regras: cole o `firestore.rules` e publique.
2. GitHub: envie `index.html`, `assets/app.js` e `assets/mission-planner.js`.
3. Abra o Planejador com uma conta ADMIN para a migração acontecer.
