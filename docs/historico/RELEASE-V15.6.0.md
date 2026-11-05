# HIGH OS DEV 15.6.0 — PLANEJADOR DE AÇÕES BLIPADAS
22/10/2026

## Objetivo
Auxiliar a gestão do ilegal na revisão de recompensas de ações com base no número de invasores permitido, custos dos kits, preço de pista/parceria, lavagem de dinheiro, lucro por membro e metas de ROI. Simular não altera a premiação.

## Fontes públicas de leitura
- High Mercado Negro: \`data/acoes-blipadas.json\` (33 ações; prêmios mínimos e máximos JÁ incluem buffs/nerfs publicados, fotos dos locais, kits, regras de invasores, policiais e reféns).
- High Mercado Negro: \`data/catalogo.json\` (preços por item, pista e parceria; mercado atualizado de acordo com o próprio catálogo).
- Arma branca: R$ 975 de pista na aba original VALORES AÇÃO BLIPADA.
- Munição (x100/x200/x250) corresponde a QUANTIDADE por pacote, não valor em reais.

## Cálculo
- Equipe selecionada deve constar nas regras da ação. Policiais e reféns aparecem para a quantidade exata.
- "1 kit por jogador": arma, pacote de munição e colete por invasor; pendrive fica na quantidade fixa publicada. É um CENÁRIO hipotético de equipar todos os participantes, não mudança automática dos itens realmente exigidos.
- "Quantidade cadastrada": conserva exatamente o kit original (inclusive exceções como Auditório, Madeireira e Hollywood). O sistema alerta se o kit for insuficiente para os participantes.
- Valor investido: Σ(quantidade × preço). Preços não encontrados não são tratados como zero; fica pendente.
- Custo efetivo = investimento × (1 − reaproveitamento informado pelo gestor). Padrão conservador: 0%.
- Lucro real estimado = prêmio mínimo sujo × (1 − taxa de lavagem) − custo efetivo.
- Lucro por invasor = lucro total / número de invasores.
- Meta líquida = maior entre (lucro mínimo por invasor × invasores) e (ROI alvo × custo efetivo).
- Prêmio mínimo sugerido (sujo) = teto[(custo efetivo + meta líquida)/(1 − lavagem)].
- Prêmio máximo sugerido preserva a amplitude percentual já publicada entre mínimo e máximo.
- Recomendação: BUFF se lucro atual abaixo de 95% da meta; NERF se acima da meta acrescida da tolerância; caso contrário MANTER.
- Metas de lucro por pessoa, ROI, tolerância, lavagem e recuperação são parâmetros editáveis de estudo. NÃO representam conclusões empíricas sobre chance de sucesso.
- Buffs/nerfs aprovados no mês anterior NÃO são somados outra vez.

## Sincronização com planilha existente
Somente usuários com EDIT em Economia podem clicar "Aprovar e sincronizar planilha existente".
- Google Sheets: arquivo original "Ilegal - High Season 2", aba existente "VALORES AÇÃO BLIPADA". Nenhuma aba nova.
- O sistema procura o cabeçalho da ação por nome **único**. Se estiver ausente ou duplicado, cancela.
- O prêmio mínimo lido da planilha deve coincidir com o do Mercado Negro (tolerância R$1,01), para impedir aplicar propostas baseadas em dados desatualizados.
- Confere valores BUFF/NERF, rejeita células com fórmulas, mostra comparação e pede confirmação explícita.
- Revalida os campos da planilha após confirmação; grava BUFF e NERF em um único batch de duas células.
- Não sobrescreve fórmulas de prêmio mínimo/máximo nem reescreve insumos.
- Tenta registrar a operação no histórico do High OS; se falhar, informa a pendência.
- Uma atualização aprovada não é republicação automática no GitHub Mercado Negro; essa etapa continua regida pelo fluxo de publicação do projeto.

## Proteções e anomalias conhecidas
- A aba original tem dois quadros chamados "AUDITÓRIO 2"; por isso seu ajuste automático é BLOQUEADO até resolver a duplicidade manualmente.
- O custo da JOALHERIA difere R$11.000 da soma do kit com preço de pista; o planejador alerta, sem alterar valor oficial.
- A ação TITANIC está inativa e contém item PENDRIVE CLANDESTINO 3 sem preço cadastrado; recomendações ficam pendentes.
- Fotos carregadas do próprio Mercado Negro pelo nome do arquivo, sem reproduzir mídia externa.
- A validação local e CI não executam alterações reais em facções, Google Sheets ou Firebase.

## Verificações
\`node --test tests/acoes-planejador.test.mjs tests/acoes-sheet-sync.test.mjs\`
\`node --check assets/modules/acoes-core.js\`
\`node --check assets/modules/acoes-sheet-sync.js\`
\`node --check assets/modules/acoes-planejador-ui.js\`
Workflow High OS • Integridade completa.

## Backups
\`backup/highos-before-actions-planner-20261022\` preserva o estado anterior ao módulo.
