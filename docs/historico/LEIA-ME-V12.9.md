# HIGH OS V12.9 — Entrega: benefícios lidos da planilha

## O problema
A janela de entrega só deixava marcar benefícios já cadastrados no High OS. Depois da saída do Firestore os Groups ficaram sem benefícios cadastrados, então a coluna "Ativar para a facção" ficava vazia e a coluna "Instalações disponíveis" era só informativa (não clicável).

## O que mudou
- A entrega lê as abas **BENEFICIOS FACÇÕES** e **BLIPS COORDENADAS**, que o Apps Script da planilha principal já envia ao bot a cada 30 min. Não precisa configurar nada.
- A planilha manda; o cadastro do High OS completa o que não estiver nela.
- Painel único com **todos os benefícios marcáveis**:
  - **INSTALADO**: vem marcado, mostra a CDS e a origem (planilha).
  - **SOLICITAR**: ao marcar, pede as CDS/dados (blip, spawn, telão, rádio, salário...) e gera a solicitação como NOVA INSTALAÇÃO.
- Novos itens: ATM, Garagem Deluxe, Shop Deluxe, Academia, Sinuca e Roupas de Facção.
- BENEFICIOS FACÇÕES: lê as colunas VIP'S (guarda o nível do VIP), ROUPAS DE FACÇÃO, BARBEARIA, SHOP D, RADIO P, LOJA DE R, ROTA FAC, CHAT FAC, SINUCA e a tabela de Benefícios Temporários. Vazio ou "NÃO" = não instalado.
- Garagem "blip / spawn" na mesma célula é separada automaticamente.
- Ao concluir, os benefícios lidos da planilha passam a constar no cadastro do Group.
- Botão **ATUALIZAR DA PLANILHA** força nova leitura (cache de 5 min).

## Publicar
Envie `index.html`, `assets/app.js` e `assets/style.css`. Depois: Ctrl + F5.
