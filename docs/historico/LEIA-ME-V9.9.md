# High OS V9.9 — o que entrou, o que não entrou e por quê

Versão fechada em cima da 9.8.1, já com o login destravado e o parser de
métricas validado contra a planilha real.

---

## Entrou nesta versão

### 1. Histórico paginado

Era a maior ameaça à cota. O sistema grava um evento em 45 pontos diferentes e
nada nunca era arquivado, mas toda visita ao módulo lia a coleção inteira.

Agora a leitura é ordenada no servidor, em janelas de 250 registros, com botão
**CARREGAR MAIS** usando cursor. Se o Firestore recusar a consulta ordenada —
documentos antigos sem o campo `data`, por exemplo — o sistema cai sozinho na
leitura completa antiga e avisa no rodapé, para nenhuma tela ficar vazia.

Efeito: a primeira abertura do Histórico sai de "N leituras, onde N é tudo que
já aconteceu" para 250 fixas.

### 2. Backup do Firestore — `tools/backup-firestore.html`

O plano gratuito não tem export automático, então até agora **não existia volta**
se alguém apagasse uma coleção. A ferramenta lê as dez coleções e os cinco
documentos de configuração e baixa tudo num `.json`, com os Timestamps
convertidos para texto ISO. Só lê, nunca escreve.

Rode uma vez por mês e guarde o arquivo fora do computador de trabalho. Cada
documento lido conta na cota, então não rode repetidamente.

### 3. Verificação de integridade — `tools/verificar-integridade.mjs`

Foi assim que perdemos `loadStore`, `mergeOfficialPresets` e as cinco funções do
Google Sheets sem ninguém notar. O script compara o código atual com uma
referência gravada e reprova a publicação se alguma função sumiu.

```
node tools/verificar-integridade.mjs            # confere
node tools/verificar-integridade.mjs --salvar   # grava nova referência
```

A referência desta versão já vem gravada em `tools/referencia-funcoes.json`.
Rode o comando antes de cada publicação.

### 4. Toasts com severidade

Os avisos deixaram de ser todos iguais. Agora têm título por tipo (Pronto, Não
deu certo, Atenção, Aviso) e **erro não desaparece sozinho** — fica até você
fechar. Antes, um erro grave sumia em 7 segundos igual a um "salvo com sucesso".

### 5. Acessibilidade contínua

O app redesenha telas inteiras com `innerHTML` o tempo todo, então rótulos
aplicados uma vez se perdiam. Um observador reaplica `aria-label` nos botões só
com ícone e nos campos sem rótulo sempre que a tela muda, com agendamento para
não pesar.

---

## Não entrou — e a razão de cada um

Estes ficaram de fora **de propósito**. Todos exigem algo que eu não tenho aqui:
rede para baixar arquivos, ou a sua base real para testar.

### Modularização do `app.js`

É o maior risco estrutural do projeto: 4.055 linhas, com uma linha de 20.516
caracteres. Mas quebrar isso em módulos às cegas é exatamente o tipo de operação
que já apagou seis funções nesta semana. Precisa ser feito com o sistema rodando
ao lado, um módulo por vez, verificando depois de cada corte.

Sugestão de ordem: `auth` → `ui` → `metrics` → `orgs` → `chat` → `planner`,
rodando `verificar-integridade.mjs` entre cada um.

### Auto-hospedar Leaflet e html2canvas

As três origens externas continuam sem `integrity`. Para hospedar no próprio
repositório eu precisaria **baixar** os arquivos, e este ambiente está sem rede.
São dois downloads e duas linhas no `index.html`:

```
https://unpkg.com/leaflet@1.9.4/dist/leaflet.js        → assets/vendor/leaflet.js
https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js → assets/vendor/html2canvas.js
```

O Leaflet também precisa do `leaflet.css` e da pasta de imagens dos marcadores.

### Anexos do chat para o Firebase Storage

Hoje vão em base64 dentro do documento, até 600 KB cada, contra 1 GiB totais.
Migrar exige ativar o Storage no projeto, publicar regras próprias para ele e
mover os anexos antigos. Escrever esse código sem poder testar contra o seu
projeto seria apostar — e o chat é o módulo onde um erro aparece na hora, para
todo mundo.

### Consolidação do CSS

1.737 cores fixas contra 34 variáveis, e 343 `!important`. Boa parte é culpa da
`high-refresh.css`, que corrige por cima em vez de corrigir na origem. Funciona,
mas cada ajuste fica mais difícil. A limpeza é mecânica e demorada, e mexe na
aparência de tudo ao mesmo tempo — melhor fazer com você olhando tela por tela.

### Ambiente de teste

Continua não existindo: todo deploy vai direto para quem usa. Uma branch `dev`
publicada num segundo site do GitHub Pages custa nada e teria evitado boa parte
dos sustos desta semana. É a mudança de processo com melhor relação
esforço/retorno de toda esta lista.

---

## Ordem sugerida daqui

1. Publicar esta versão e rodar o backup pela primeira vez.
2. Criar a branch `dev` com Pages próprio.
3. Modularizar o `app.js`, um módulo por vez, com o verificador entre cada corte.
4. Auto-hospedar as bibliotecas externas.
5. Anexos do chat para o Storage.
6. Limpeza do CSS.
