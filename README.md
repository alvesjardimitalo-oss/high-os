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
