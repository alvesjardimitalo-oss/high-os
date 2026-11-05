# =============================================================================
#  HIGH OS • Instalador do bot (high-os-discord) no Windows 11
# -----------------------------------------------------------------------------
#  Abra o "Terminal (Administrador)" (botão direito no Iniciar) e cole:
#
#    irm https://raw.githubusercontent.com/alvesjardimitalo-oss/high-os-dev/main/tools/windows/instalar-bot-windows.ps1 | iex
#
#  O que ele faz (pode rodar de novo; não apaga nada):
#    1. instala Node.js, Git e Tailscale (winget)
#    2. baixa o bot do GitHub (login pelo navegador na 1ª vez)
#    3. abre o Bloco de Notas para colar as variáveis do bot (.env)
#    4. liga o bot sozinho quando você entra no Windows e reinicia se cair
#    5. publica o bot num endereço https fixo (Tailscale Funnel, grátis)
#    6. cria a pasta "High OS Bot" na Área de Trabalho com Status/Log/Reiniciar/Atualizar
#  Nenhum segredo fica neste arquivo nem no GitHub.
# =============================================================================
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch {}

$Repo    = 'https://github.com/alvesjardimitalo-oss/high-os-discord.git'
$Base    = Join-Path $env:LOCALAPPDATA 'HighOS'
$App     = Join-Path $Base 'high-os-discord'
$Logs    = Join-Path $Base 'logs'
$Snaps   = Join-Path $Base 'snapshots'
$Runner  = Join-Path $Base 'executar.ps1'
$Manage  = Join-Path $Base 'gerenciar.ps1'
$UrlFile = Join-Path $Base 'endereco.txt'
$Task    = 'HighOS Bot'
$Port    = 3000
$Ts      = Join-Path $env:ProgramFiles 'Tailscale\tailscale.exe'
$Utf8    = New-Object System.Text.UTF8Encoding($false)

function Passo([string]$t){ Write-Host ''; Write-Host "▶ $t" -ForegroundColor Magenta }
function Ok([string]$t){ Write-Host "  ✔ $t" -ForegroundColor Green }
function Aviso([string]$t){ Write-Host "  ! $t" -ForegroundColor Yellow }
function Falha([string]$t){ Write-Host "  ✖ $t" -ForegroundColor Red; throw $t }
function Atualizar-Path { $env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User') }
function Checar([string]$msg){ if ($LASTEXITCODE -ne 0) { Falha $msg } }
function Instalar([string]$id, [string]$nome) {
  Write-Host "  instalando $nome..."
  winget install --id $id -e --silent --accept-package-agreements --accept-source-agreements --disable-interactivity | Out-Null
  Atualizar-Path
}

$admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $admin) { Falha 'Abra o "Terminal (Administrador)": botão direito no Iniciar > Terminal (Administrador). Depois cole o comando de novo.' }
if (-not (Get-Command winget -ErrorAction SilentlyContinue)) { Falha 'winget não encontrado. Atualize o "Instalador de Aplicativo" pela Microsoft Store e tente de novo.' }
New-Item -ItemType Directory -Force -Path $Base, $Logs, $Snaps | Out-Null

# ---------------------------------------------------------------------------
Passo '1/6 Programas (Node.js, Git, Tailscale)'
Atualizar-Path
$nodeOk = $false
if (Get-Command node -ErrorAction SilentlyContinue) { $nodeOk = [int]((& node -p 'process.versions.node.split(".")[0]')) -ge 20 }
if (-not $nodeOk) { Instalar 'OpenJS.NodeJS.LTS' 'Node.js' }
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Instalar 'Git.Git' 'Git' }
if (-not (Test-Path $Ts)) { Instalar 'Tailscale.Tailscale' 'Tailscale' }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Falha 'O Node.js não ficou disponível. Feche o Terminal, abra de novo como Administrador e rode o comando outra vez.' }
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Falha 'O Git não ficou disponível. Feche o Terminal, abra de novo como Administrador e rode o comando outra vez.' }
if (-not (Test-Path $Ts)) { Falha 'O Tailscale não foi instalado. Instale por https://tailscale.com/download/windows e rode de novo.' }
Ok ("Node " + (& node -v) + ", " + (& git --version) + ", Tailscale instalados.")

# ---------------------------------------------------------------------------
Passo '2/6 Código do bot'
function Parar-Bot {
  try { Stop-ScheduledTask -TaskName $Task -ErrorAction SilentlyContinue } catch {}
  Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
    Where-Object { $_.CommandLine -match 'src[\\/]index\.js' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
  Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" |
    Where-Object { $_.CommandLine -like '*HighOS*executar.ps1*' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
}
Parar-Bot
if (Test-Path (Join-Path $App '.git')) {
  git -C $App pull --ff-only; Checar 'Não consegui atualizar o código (git pull).'
} else {
  Write-Host '  Se abrir o navegador pedindo login no GitHub, entre com a sua conta e autorize.'
  git clone --depth 50 $Repo $App; Checar 'Não consegui baixar o bot. Confira se entrou na conta do GitHub dona do repositório.'
}
Push-Location $App
try {
  & npm.cmd ci --omit=dev --no-audit --no-fund --loglevel=error; Checar 'Falha ao instalar as dependências (npm ci).'
  & npm.cmd run -s check; Checar 'O código do bot não passou na conferência (npm run check).'
} finally { Pop-Location }
Ok ('Bot baixado: ' + (git -C $App log -1 --format='%h %s'))

# ---------------------------------------------------------------------------
Passo '3/6 Variáveis do bot (.env)'
$EnvFile = Join-Path $App '.env'
function Tem-Token { (Test-Path $EnvFile) -and (Select-String -Path $EnvFile -Pattern '^\s*DISCORD_TOKEN\s*=\s*\S' -Quiet) }
if (-not (Tem-Token)) {
  $modelo = @(
    '# COLE ABAIXO as variáveis do bot (DISCORD_TOKEN, DISCORD_GUILD_ID, HIGH_OS_API_KEY...), uma por linha.',
    '# Depois: Ctrl+S para salvar e FECHE o Bloco de Notas para o instalador continuar.',
    ''
  )
  [IO.File]::WriteAllLines($EnvFile, $modelo, $Utf8)
  for ($i = 1; $i -le 3 -and -not (Tem-Token); $i++) {
    Write-Host '  Abrindo o Bloco de Notas: cole as variáveis do bot, salve (Ctrl+S) e feche.' -ForegroundColor Cyan
    Start-Process notepad.exe -ArgumentList "`"$EnvFile`"" -Wait
    if (-not (Tem-Token)) { Aviso 'Não encontrei DISCORD_TOKEN no arquivo. Vamos abrir de novo.' }
  }
  if (-not (Tem-Token)) { Falha "Variáveis não preenchidas. Edite $EnvFile e rode o instalador de novo." }
  Ok 'Variáveis salvas (ficam só no seu PC).'
} else { Ok "Variáveis já existem (mantidas). Para editar: notepad `"$EnvFile`"" }
# Ajustes do PC: porta local fixa, backups na pasta HighOS, sem variáveis de túnel antigas.
$linhas = @(Get-Content -Path $EnvFile -Encoding UTF8) | Where-Object { $_ -notmatch '^\s*(PORT|SNAPSHOT_DIR|CONTROL_PLANE_TUNNEL_ID|CONTROL_PLANE_API_KEY)\s*=' }
$linhas = @($linhas) + @("PORT=$Port", ('SNAPSHOT_DIR=' + ($Snaps -replace '\\','/')))
[IO.File]::WriteAllLines($EnvFile, [string[]]$linhas, $Utf8)

# Confere as variáveis do mesmo jeito que o bot lê (dotenv).
$checar = Join-Path $App 'checar-variaveis.tmp.mjs'
@'
import "dotenv/config";
const e = process.env;
const falta = ["DISCORD_TOKEN", "DISCORD_GUILD_ID", "HIGH_OS_API_KEY"].filter(k => !String(e[k] || "").trim());
if (falta.length) { console.error("  ✖ Faltando: " + falta.join(", ")); process.exit(1); }
console.log("  ✔ DISCORD_TOKEN, DISCORD_GUILD_ID e HIGH_OS_API_KEY presentes.");
if (e.HIGH_OS_FIREBASE_SERVICE_ACCOUNT_JSON) {
  try { const j = JSON.parse(e.HIGH_OS_FIREBASE_SERVICE_ACCOUNT_JSON); if (!j.client_email || !j.private_key) throw 0; console.log("  ✔ Conta de serviço do Firebase legível."); }
  catch { console.log("  ! HIGH_OS_FIREBASE_SERVICE_ACCOUNT_JSON não ficou legível (só afeta a cópia para o Firestore; painel e bot funcionam)."); }
}
'@ | ForEach-Object { [IO.File]::WriteAllText($checar, $_, $Utf8) }
Push-Location $App
try { & node $checar; $rc = $LASTEXITCODE } finally { Pop-Location; Remove-Item $checar -Force -ErrorAction SilentlyContinue }
if ($rc -ne 0) { Falha "Variáveis incompletas. Corrija com: notepad `"$EnvFile`" e rode o instalador de novo." }

# ---------------------------------------------------------------------------
Passo '4/6 Ligar sozinho com o Windows'
$runnerTxt = @"
# Gerado pelo instalador do High OS. Mantém o bot rodando e reinicia se cair.
`$App  = '$App'
`$Log  = '$(Join-Path $Logs 'bot.log')'
`$Old  = '$(Join-Path $Logs 'bot.anterior.log')'
Set-Location `$App
while (`$true) {
  if ((Test-Path `$Log) -and ((Get-Item `$Log).Length -gt 10MB)) { Move-Item `$Log `$Old -Force }
  Add-Content -Path `$Log -Encoding UTF8 -Value ("[" + (Get-Date -Format s) + "] iniciando bot")
  cmd /c "node src\index.js >> ""`$Log"" 2>&1"
  Add-Content -Path `$Log -Encoding UTF8 -Value ("[" + (Get-Date -Format s) + "] bot parou (codigo " + `$LASTEXITCODE + "); reiniciando em 5s")
  Start-Sleep -Seconds 5
}
"@
[IO.File]::WriteAllText($Runner, $runnerTxt, (New-Object System.Text.UTF8Encoding($true)))

$usuario = "$env:USERDOMAIN\$env:USERNAME"
$acao    = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$Runner`""
$gatilho = New-ScheduledTaskTrigger -AtLogOn -User $usuario
$config  = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew
$quem    = New-ScheduledTaskPrincipal -UserId $usuario -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName $Task -Action $acao -Trigger $gatilho -Settings $config -Principal $quem -Force | Out-Null
Start-ScheduledTask -TaskName $Task
$vivo = $false
for ($i = 0; $i -lt 30 -and -not $vivo; $i++) {
  Start-Sleep -Seconds 3
  try { $h = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/health" -TimeoutSec 5; $vivo = [bool]$h.ok } catch {}
}
if (-not $vivo) { Falha ("O bot não respondeu. Veja o log: " + (Join-Path $Logs 'bot.log')) }
Ok "Bot rodando (tarefa agendada '$Task'). Discord conectado: $($h.discordReady)"

# ---------------------------------------------------------------------------
Passo '5/6 Endereço público (Tailscale Funnel)'
function Ts-Status { try { (& $Ts status --json 2>$null | Out-String) | ConvertFrom-Json } catch { $null } }
$st = Ts-Status
if (-not $st -or $st.BackendState -ne 'Running') {
  Write-Host '  Vai abrir o navegador: entre no Tailscale (pode usar a conta Google) e confirme o PC.' -ForegroundColor Cyan
  & $Ts up --timeout 300s | Out-Host
  for ($i = 0; $i -lt 60; $i++) { $st = Ts-Status; if ($st -and $st.BackendState -eq 'Running') { break }; Start-Sleep 3 }
  if (-not $st -or $st.BackendState -ne 'Running') { Falha 'O Tailscale não conectou. Abra o Tailscale pela bandeja do relógio, faça login e rode o instalador de novo.' }
}
Write-Host '  Se aparecer um link pedindo para habilitar o Funnel, abra, clique em Enable e volte aqui.' -ForegroundColor Cyan
& $Ts funnel --bg $Port | Out-Host
Checar 'Não consegui ligar o Funnel. Rode o instalador de novo depois de habilitar o Funnel no link mostrado.'
$dns = ([string](Ts-Status).Self.DNSName).TrimEnd('.')
if (-not $dns) { Falha 'Não consegui descobrir o endereço do Tailscale.' }
$Url = "https://$dns"
[IO.File]::WriteAllText($UrlFile, $Url, $Utf8)
$publico = $false
for ($i = 0; $i -lt 40 -and -not $publico; $i++) {
  try { $p = Invoke-RestMethod -Uri "$Url/health" -TimeoutSec 10; $publico = [bool]$p.ok } catch { Start-Sleep -Seconds 4 }
}
if ($publico) { Ok "Endereço público respondendo: $Url" }
else { Aviso "O endereço $Url ainda não respondeu (o certificado pode levar alguns minutos). Teste depois pelo atalho 'Status'." }

# ---------------------------------------------------------------------------
Passo '6/6 Atalhos de manutenção'
$manageTxt = @"
# Gerado pelo instalador do High OS.
param([string]`$Acao = 'status')
`$App = '$App'; `$Task = '$Task'; `$Port = $Port
`$Log = '$(Join-Path $Logs 'bot.log')'; `$Url = (Get-Content '$UrlFile' -ErrorAction SilentlyContinue)
function Parar { Stop-ScheduledTask -TaskName `$Task -ErrorAction SilentlyContinue
  Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { `$_.CommandLine -match 'src[\\/]index\.js' } | ForEach-Object { Stop-Process -Id `$_.ProcessId -Force -ErrorAction SilentlyContinue }
  Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" | Where-Object { `$_.CommandLine -like '*HighOS*executar.ps1*' } | ForEach-Object { Stop-Process -Id `$_.ProcessId -Force -ErrorAction SilentlyContinue } }
function Status { Write-Host ('Tarefa: ' + (Get-ScheduledTask -TaskName `$Task).State)
  foreach (`$u in @("http://127.0.0.1:`$Port/health", "`$Url/health")) { try { `$h = Invoke-RestMethod `$u -TimeoutSec 8; Write-Host ("OK  `$u  (Discord: " + `$h.discordReady + ")") -ForegroundColor Green } catch { Write-Host "SEM RESPOSTA  `$u" -ForegroundColor Red } }
  Write-Host ''; Write-Host "Endereço do bot para o painel: `$Url" -ForegroundColor Cyan }
switch (`$Acao) {
  'log'       { Get-Content `$Log -Tail 80 -Wait -Encoding UTF8 }
  'reiniciar' { Parar; Start-ScheduledTask -TaskName `$Task; Start-Sleep 10; Status }
  'parar'     { Parar; Write-Host 'Bot parado. Ele volta quando você entrar no Windows de novo (ou use Reiniciar).' }
  'atualizar' { Parar; git -C `$App pull --ff-only; Push-Location `$App; npm.cmd ci --omit=dev --no-audit --no-fund --loglevel=error; npm.cmd run -s check; Pop-Location; Start-ScheduledTask -TaskName `$Task; Start-Sleep 10; Status }
  default     { Status }
}
"@
[IO.File]::WriteAllText($Manage, $manageTxt, (New-Object System.Text.UTF8Encoding($true)))
$pasta = Join-Path ([Environment]::GetFolderPath('Desktop')) 'High OS Bot'
New-Item -ItemType Directory -Force -Path $pasta | Out-Null
$atalhos = [ordered]@{ 'Status' = 'status'; 'Ver log' = 'log'; 'Reiniciar' = 'reiniciar'; 'Parar' = 'parar'; 'Atualizar' = 'atualizar' }
foreach ($nome in $atalhos.Keys) {
  $cmd = "@echo off`r`npowershell -NoProfile -ExecutionPolicy Bypass -File `"$Manage`" $($atalhos[$nome])`r`npause`r`n"
  [IO.File]::WriteAllText((Join-Path $pasta "$nome.cmd"), $cmd, (New-Object System.Text.ASCIIEncoding))
}
Ok "Pasta 'High OS Bot' criada na Área de Trabalho."

$r = Read-Host "  Quer impedir que o PC entre em suspensão quando estiver na tomada? (o bot para se o PC dormir) [S/N]"
if ($r -match '^[sS]') { powercfg /change standby-timeout-ac 0; Ok 'Suspensão na tomada desativada (a tela ainda pode desligar).' }

Write-Host ''
Write-Host "  PRONTO! Endereço do bot:  $Url" -ForegroundColor Green
Write-Host ''
Write-Host '  Próximo passo: colocar esse endereço no painel (assets/api-config.js no GitHub)'
Write-Host "  e no Apps Script 'HIGH OS - Sync Métricas' (HIGH_OS_BOT_URL)."
Set-Clipboard -Value $Url -ErrorAction SilentlyContinue
Write-Host '  (o endereço já foi copiado para a área de transferência)'
