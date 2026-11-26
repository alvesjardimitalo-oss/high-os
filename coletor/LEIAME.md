# Coletor de métricas

Lê o **metricas.highrp.net** com a sessão do Discord do administrador e grava no Firestore do High OS. A tela **Métricas** mostra o que ele grava.

O site só aceita chamadas vindas dele mesmo, por isso o High OS não lê a API direto. O coletor abre o site num Edge com perfil próprio, faz só leituras (GET) e grava:

- `hos/metricas`: a última leitura, com hoje, semana, mês, catálogo dos groups e situação do coletor.
- `hos/metricas/semanas/{segunda}`: ficha de cada semana (segunda a domingo) com pico, média simultânea, ativos e horas online, no global e por organização. É a base do relatório semanal.
- `hos/metricas/dias/{AAAA-MM-DD}`: média e pico do dia por organização, e média e pico de cada hora. Cada coleta completa o dia sem apagar o que já existe, então o histórico fica no Firestore mesmo que o site o descarte.

## Instalar (uma vez)

1. Na pasta `coletor`, instale as dependências:
   ```
   npm install
   ```
2. **Chave do Firebase.** No Console do Firebase, abra o projeto *high-os* e vá em **Configurações do projeto › Contas de serviço › Gerar nova chave privada**. Salve o arquivo como `coletor/chave-servico.json`.
   - Ele está no `.gitignore` e nunca vai para o GitHub.
   - A chave dá acesso total ao projeto, então não a envie para ninguém.
3. **Login no Discord.** Rode o comando abaixo, entre com o Discord na janela do Edge que abrir e aguarde. A janela fecha sozinha.
   ```
   npm run login
   ```
   A sessão fica em `coletor/perfil/`, que também está no `.gitignore`.
4. **Conferir.** O comando abaixo lê o site sem gravar nada:
   ```
   npm run testar
   ```
5. **Primeira coleta.** O comando abaixo lê o site e grava no Firestore:
   ```
   npm run coletar
   ```
6. **Agendar.** No PowerShell, rode:
   ```
   powershell -ExecutionPolicy Bypass -File agendar.ps1
   ```
   O coletor passa a rodar às 14:05, 16:05, 21:05 e 23:05. Se o PC estiver desligado no horário, ele roda assim que ligar. O registro fica em `coletor/coletor.log`.

## Atalhos na Área de Trabalho

- **High OS - Login do coletor (Discord)**: o mesmo que `npm run login`.
- **High OS - Coletar métricas agora**: o mesmo que `npm run coletar`.

## Quando algo falha

A tela Métricas avisa em três situações:

- **Sessão expirada:** abra o atalho *High OS - Login do coletor (Discord)*.
- **Falha na coleta:** a mensagem de erro aparece na tela e também em `coletor.log`.
- **Leitura antiga:** o coletor não gravou nada nas últimas 8 horas. Confira se o PC ficou ligado.

## Regras do Firestore

As regras de `hos/metricas` estão em `firestore.rules`: qualquer usuário ativo lê, e ninguém grava pelo navegador. O coletor usa a chave de serviço, que não passa pelas regras. Publique o arquivo inteiro no Console, conforme o README da raiz.
