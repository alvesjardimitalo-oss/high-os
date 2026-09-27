# HIGH OS

Central interna de gestão do Ilegal do High Roleplay.

## Versão operacional

**V12.5.0** — segurança, automação e Planejador de Missões.

A documentação histórica permanece no Git. Este README descreve somente a estrutura atualmente útil do sistema.

## Organização funcional

### Visão Geral
- Dashboard operacional.

### Operação Ilegal
- Organizações / Groups.
- Ocupação, QG/Favela, liderança e histórico.
- Entregas, recolhimentos e solicitações relacionadas à operação.

### Inteligência
- Métricas 14H / 16H / 21H / 23H.
- Visão geral, facção, comparativos, relatórios, boletim e gestão.

### Eventos e Missões
- Planejador de Missões.
- Eventos, zonas, spawns, validação de coordenadas, safe/gás e entrega técnica.

### Sistema
- Usuários e níveis de acesso.
- Administração, integrações e rotinas técnicas.

## Estrutura técnica

- `index.html` — estrutura das telas.
- `assets/app.js` — aplicação legada em processo de modularização.
- `assets/mission-planner.js` — Planejador de Missões.
- `assets/modules/estado.js` — estado compartilhado.
- `assets/modules/formatadores.js` — utilitários e formatação.
- `assets/modules/metricas-parser.js` — parser isolado das métricas.
- `assets/style.css` — estilos legados/base.
- `assets/high-refresh.css` — camada visual atual.
- `assets/mission-planner.css` — estilos do Planejador.
- `assets/ui-kit.css` / `assets/ui-kit.js` — componentes comuns.
- `firestore.rules` / `firestore.indexes.json` — segurança e índices.
- `tools/` — diagnóstico, migração, backup e verificações de integridade.

## Regra de manutenção

Código novo deve entrar no módulo responsável pela função. Evitar adicionar novas regras diretamente ao `app.js` quando a função puder ser isolada.

Antes de remover código legado:
1. confirmar que não há referência ativa;
2. executar as verificações de integridade e regras;
3. testar no ambiente DEV;
4. só depois integrar à branch principal.

## Verificação

As rotinas em `tools/verificar-integridade.mjs` e `tools/verificar-regras.mjs` devem continuar verdes antes de publicação.

## Segurança

Não alterar ou remover regras do Firestore apenas por parecerem sem uso. Coleções, permissões e rotinas de persistência devem ser validadas contra o código antes de qualquer limpeza.

Para detalhes da V12.5, consulte `LEIA-ME-V12.5.md`.
