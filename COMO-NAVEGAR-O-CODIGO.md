# High OS — guia rápido do código

Este arquivo descreve somente a estrutura ativa. O histórico de versões permanece no Git.

## Núcleo

| Arquivo | Responsabilidade |
|---|---|
| `index.html` | estrutura das telas e navegação |
| `assets/app.js` | controlador legado principal, em processo de modularização |
| `assets/mission-planner.js` | lógica do Planejador de Missões |
| `firestore.rules` | autorização e proteção das coleções |
| `firestore.indexes.json` | índices necessários do Firestore |

## Módulos ativos

| Módulo | Responsabilidade |
|---|---|
| `assets/modules/estado.js` | estado compartilhado |
| `assets/modules/formatadores.js` | escape, normalização e formatação |
| `assets/modules/metricas-parser.js` | leitura e normalização das métricas |

## Estilos

| Arquivo | Uso |
|---|---|
| `assets/style.css` | base/legado ainda utilizado |
| `assets/high-refresh.css` | camada visual atual e ajustes V13 |
| `assets/mission-planner.css` | Planejador |
| `assets/ui-kit.css` | componentes comuns |
| `assets/calma.css` | compatibilidade visual; remover somente após auditoria de seletores |

## Ferramentas

- `tools/verificar-integridade.mjs`: detecta perda de funções/referências durante refatorações.
- `tools/verificar-regras.mjs`: compara caminhos usados pelo app com regras do Firestore.
- `tools/mapa-do-codigo.mjs`: gera mapa técnico quando necessário.
- ferramentas HTML de backup, diagnóstico, migração e recuperação são utilitários administrativos; não fazem parte da navegação normal.

## Regra para refatorar

1. mover um domínio por vez para `assets/modules/`;
2. manter contrato e comportamento da função;
3. verificar referências;
4. rodar integridade e regras;
5. testar no DEV;
6. remover o legado somente quando não houver referência ativa.

Não criar cópias V10/V11/V12 de uma mesma função. A versão válida deve substituir a anterior e o Git preserva o histórico.
