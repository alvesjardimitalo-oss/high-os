# Bot do High OS no seu PC (Windows 11)

Grátis, sem cartão. O bot liga sozinho quando você entra no Windows, reinicia se cair
e lê tudo de volta do canal 💾 storage do Discord (nada fica só no PC).

## Instalar (uma vez, ~10 minutos)
1. Botão direito no **Iniciar** → **Terminal (Administrador)** → Sim.
2. Cole e aperte ENTER:
   ```powershell
   irm https://raw.githubusercontent.com/alvesjardimitalo-oss/high-os-dev/main/tools/windows/instalar-bot-windows.ps1 | iex
   ```
3. Ele vai pedir, nesta ordem:
   - **Login no GitHub** (abre o navegador) — entre com a conta dona do repositório do bot.
   - **Bloco de Notas** — cole as variáveis do bot (`DISCORD_TOKEN`, `DISCORD_GUILD_ID`, `HIGH_OS_API_KEY`… — guarde uma cópia em lugar seguro), **Ctrl+S** e **feche**. Reinstalando no mesmo PC, as variáveis já salvas são mantidas.
   - **Login no Tailscale** (abre o navegador; pode usar a conta Google) e, se aparecer, o link para **habilitar o Funnel** → *Enable*.
   - Se quer impedir o PC de suspender na tomada (recomendado: **S**).
4. No final aparece `PRONTO! Endereço do bot: https://seu-pc.xxxx.ts.net` (já copiado).

## Apontar o painel e a planilha
1. GitHub → `high-os-dev` → `assets/api-config.js` → ✏️ → troque o endereço antigo pelo novo → **Commit**.
2. Apps Script **"HIGH OS - Sync Métricas"** → troque `HIGH_OS_BOT_URL` (nos scripts antigos: `HIGH_OS_RAILWAY_URL`) pelo novo endereço → Salvar.

## Métricas pelo Paradise (opcional, recomendado)
Faz o bot ler o online de cada Group direto do painel Paradise (mesma fonte do "Pico Diário por Grupo").
```powershell
irm https://raw.githubusercontent.com/alvesjardimitalo-oss/high-os-dev/main/tools/windows/ligar-paradise.ps1 | iex
```
Copie antes o valor do cookie da sua sessão no Paradise; o script lê da área de transferência, testa, salva só no `.env` do PC, atualiza e reinicia o bot. Quando a sessão vencer, rode de novo.

## Atalhos (pasta "High OS Bot" na Área de Trabalho)
| Atalho | Para quê |
| --- | --- |
| **Status** | bot ligado? endereço respondendo? |
| **Ver log** | o que o bot está fazendo agora |
| **Reiniciar** | desliga e liga o bot |
| **Parar** | desliga até você entrar no Windows de novo |
| **Atualizar** | baixa a versão nova do GitHub e reinicia |

Arquivos ficam em `%LOCALAPPDATA%\HighOS` (variáveis em `high-os-discord\.env`, log em `logs\bot.log`).

## Com o PC desligado
- O painel abre **só para leitura** (contingência) e não salva nada até o bot voltar.
- Comandos e automações do bot no Discord ficam parados.
- Métricas: a planilha continua coletando; o Apps Script reenvia os últimos 45 dias quando o bot volta.

## Avisos
- Só um bot ligado por vez com o mesmo token (dois = posts duplicados).
- O OCR de print de evento precisa do Tesseract; sem ele o resto funciona normalmente.
- Rodar o instalador de novo é seguro: mantém as variáveis e só atualiza.
