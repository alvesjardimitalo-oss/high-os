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


## High OS Bot — limpeza e retenção do Discord

O módulo Discord deverá prever administração de conversas sem misturar essa responsabilidade ao painel operacional.

### Limpeza manual
- comando administrativo para limpar mensagens de um canal;
- quantidade/período explicitamente informado;
- opção de limitar por usuário quando suportado;
- confirmação antes de ações destrutivas de grande volume;
- registrar executor, canal, quantidade, data e motivo no log do High OS.

### Limpeza automática
- política configurável por canal/categoria;
- retenção em horas ou dias;
- execução programada pelo bot;
- nunca apagar mensagens fixadas;
- proteger canais de auditoria/log;
- não limpar tickets/conversas ainda abertos;
- permitir lista de canais excluídos da automação;
- registrar cada execução e falhas para auditoria.

### Segurança
A limpeza automática deve vir desativada por padrão. Somente administradores autorizados podem criar/alterar políticas de retenção ou executar limpeza manual.


### Comando `/anunciar`

O High OS Bot deverá possuir um comando administrativo `/anunciar` para publicação estruturada de anúncios no Discord.

Fluxo:
- executar `/anunciar`;
- escolher o canal de destino entre os canais autorizados;
- abrir formulário/modal de criação;
- informar título obrigatório;
- informar descrição obrigatória;
- escolher a posição da imagem: acima do conteúdo, abaixo do conteúdo ou sem imagem;
- aceitar imagem por URL;
- aceitar upload/anexo de imagem quando a integração do Discord disponibilizar o arquivo ao bot;
- exibir prévia do anúncio antes da publicação;
- permitir confirmar ou cancelar;
- publicar usando o padrão visual oficial do High OS.

Segurança e auditoria:
- restringir o comando aos cargos/permissões configurados;
- nunca solicitar senha, token ou informação confidencial no formulário;
- registrar autor, canal, data/hora, título e identificador da mensagem publicada;
- permitir identificar no log edições ou exclusões posteriores do anúncio;
- bloquear publicação em canais fora da lista autorizada.

Evolução prevista:
- modelos reutilizáveis para Aviso, Evento, Assumir Facção, Manutenção e Comunicado;
- integração com dados do High OS para preencher anúncios sem redigitação quando a origem for uma facção, evento ou solicitação existente.
