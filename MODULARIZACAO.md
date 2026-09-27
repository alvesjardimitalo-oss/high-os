# Modularização do High OS — V13

## Estado atual

Já extraídos do `assets/app.js`:
- `modules/metricas-parser.js`
- `modules/formatadores.js`
- `modules/estado.js`

O `app.js` ainda concentra vários domínios e deve ser reduzido sem alterar o comportamento do sistema.

## Categorias oficiais

1. **Visão Geral** — Dashboard.
2. **Operação Ilegal** — Organizações, Groups, ocupação, entregas, recolhimentos, craft/farm/rotas e solicitações.
3. **Inteligência** — Métricas, relatórios, boletim e gestão.
4. **Eventos e Missões** — Planejador, zonas, spawns, safe/gás e validação.
5. **Ferramentas** — recursos auxiliares que não são fluxo principal.
6. **Sistema** — usuários, permissões, integrações, auditoria e administração.

## Destino dos próximos cortes

- `modules/dashboard.js`
- `modules/organizacoes.js`
- `modules/metricas-ui.js`
- `modules/boletim.js`
- `modules/chat.js`
- `modules/solicitacoes.js`
- `modules/integracoes.js`

O Planejador permanece em `mission-planner.js` até a lógica dinâmica de safe/gás estabilizar.

## O que deve ser removido

Remover apenas quando comprovadamente sem referência:
- funções substituídas por implementação atual;
- CSS sem seletor ativo;
- páginas antigas não navegáveis e sem chamadas internas;
- documentação de versão antiga já preservada pelo Git;
- comentários, flags e aliases de migração que não participam mais do runtime.

## O que não deve ser apagado por limpeza estética

- coleções e regras do Firestore;
- utilitários de backup/recuperação;
- compatibilidade de dados persistidos;
- campos históricos usados para migração;
- lógica de fallback local/nuvem;
- funções chamadas dinamicamente por eventos ou atributos HTML.

## Critério de conclusão da V13

A limpeza só está concluída quando:
- navegação está organizada por categoria;
- documentação ativa descreve somente a arquitetura atual;
- não existem documentos V9 na raiz;
- verificadores de integridade e regras passam;
- telas principais abrem no DEV;
- Organizações, Métricas e Planejador preservam os dados existentes;
- nenhum novo arquivo de versão duplicada é criado.
