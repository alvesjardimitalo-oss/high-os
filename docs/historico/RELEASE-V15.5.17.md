# High OS Dev 15.5.17 — auditoria e correções (22/10/2026)

## Corrigido
- Métricas: registros nulos, strings vazias e valores inválidos não são contados como coletas; normalização de horários e rejeição de datas impossíveis; transferência usa dataEfetiva em vez do horário de gravação.
- Solicitações: cadastro de garagens e helipontos adiciona novos pontos sem sobrescrever os existentes; modifica ponto identificado pelo mesmo blip ou spawn; impede cadastrar placeholders como CDS; preserva veículos VIP durante a alteração.
- Solicitações de coordenadas: espelhamento de CDS para BLIPS COORDENADAS após aplicar ao Group, com aviso se a planilha não estiver conectada.
- Rotas exclusivas: corrige variável benefícios incorreta que interrompia o salvamento; ficha e histórico passam a ser gravados juntos.
- Importação de métricas: reconhecimento de Group Galpão e grafia legada da Mecânica.
- Planejador: auditoria de SAFE configurada, verificação de mínimo de 1200s para Modo Sobrevivência e Battle Royale, geometria com SAFEs contidas e possibilidade de fuga a pé; solicitações inválidas são bloqueadas, mas rascunhos existentes não são apagados.
- CI: inclui validação de regras Firestore para novas coleções e testes de regressão para os cenários identificados.

## Limites
- Não foram modificados registros de facções, operações do Discord, Google Sheets ou Firebase em produção durante a auditoria.
- Testes automatizados não equivalem a testes completos com sessão real em todos os módulos, incluindo integrações Discord/FiveM e Google Sheets.
- A base e o frontend devem ser validados no navegador autenticado ao usar operações críticas, especialmente nos formatos legados de cadastro.
- O backup do código anterior está na branch `backup/highos-before-audit-20261022-b`.
- As regras Firestore não foram alteradas nesta release; não é necessário republicá-las por causa destas mudanças.
