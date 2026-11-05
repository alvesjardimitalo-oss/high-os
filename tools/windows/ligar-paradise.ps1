# =====================================================================
#  High OS - liga as métricas pelo Paradise (apidash.touz.dev) no bot do PC
#
#  Uso (Terminal / PowerShell normal, não precisa ser administrador):
#    irm https://raw.githubusercontent.com/alvesjardimitalo-oss/high-os-dev/main/tools/windows/ligar-paradise.ps1 | iex
#
#  O que faz:
#    1. le o cookie da sua sessao no Paradise da area de transferencia (nada e digitado no terminal)
#    2. testa o cookie direto no site antes de salvar
#    3. grava PARADISE_COOKIE no .env do bot (só no seu PC)
#    4. atualiza o bot pelo GitHub e reinicia
#    5. confere se a coleta do Paradise ligou
#  Rodar de novo é seguro: serve também para renovar o cookie quando vencer.
# =====================================================================
$ErrorActionPreference = 'Stop'
$Base    = Join-Path $env:LOCALAPPDATA 'HighOS'
$App     = Join-Path $Base 'high-os-discord'
$EnvFile = Join-Path $App '.env'
$Manage  = Join-Path $Base 'gerenciar.ps1'
$Utf8    = New-Object System.Text.UTF8Encoding($false)
$Teste   = 'https://apidash.touz.dev/api/s/default/groups/hourly-batch?groups=Armas01,Armas04&hours=2'

function Ok([string]$t){ Write-Host "  OK  $t" -ForegroundColor Green }
function Falha([string]$t){ Write-Host "  X   $t" -ForegroundColor Red; throw $t }

Write-Host ''
Write-Host 'HIGH OS - Métricas pelo Paradise' -ForegroundColor Magenta
if (-not (Test-Path $EnvFile)) { Falha "Bot não encontrado em $App. Rode antes o instalador do bot (tools/windows/instalar-bot-windows.ps1)." }

Write-Host ''
Write-Host 'Lendo o cookie da area de transferencia (copie o valor ANTES de rodar este comando)...' -ForegroundColor Cyan
Write-Host '  Como copiar: paradise.touz.dev/groups/daily-peak logado > F12 > aba Rede > clique num grupo >'
Write-Host '  linha "hourly-batch..." > Cabecalhos > Cabecalhos de solicitacao > "cookie" > botao direito > Copiar valor.'
$cookie = ''
try { $cookie = [string](Get-Clipboard -Raw) } catch {}
$cookie = $cookie.Trim()
if ($cookie -match '^(?i)cookie\s*:\s*') { $cookie = $cookie -replace '^(?i)cookie\s*:\s*', '' }
if (-not $cookie) { Falha 'A area de transferencia esta vazia. Copie o valor do cookie e rode o comando de novo.' }
if ($cookie -match '[\r\n]') { Falha 'O que esta copiado tem quebra de linha. Copie so o valor do cookie.' }
if ($cookie -notmatch 'auth_token=') { Falha 'O que esta copiado nao parece o cookie do Paradise (falta auth_token=). Copie o valor da linha cookie.' }

Write-Host ''
Write-Host 'Testando o cookie no Paradise...' -ForegroundColor Cyan
# O Windows PowerShell 5.1 ignora o cabecalho Cookie passado em -Headers;
# por isso os cookies vao numa sessao web (CookieContainer).
$sessao = New-Object Microsoft.PowerShell.Commands.WebRequestSession
foreach ($par in ($cookie -split ';')) {
  $p = $par.Trim(); if (-not $p -or $p -notmatch '=') { continue }
  $i = $p.IndexOf('='); $nome = $p.Substring(0, $i).Trim(); $valor = $p.Substring($i + 1).Trim()
  try { $sessao.Cookies.Add((New-Object System.Net.Cookie($nome, $valor, '/', 'apidash.touz.dev'))) } catch {}
}
try {
  $r = Invoke-RestMethod -Uri $Teste -WebSession $sessao -Headers @{ Origin = 'https://paradise.touz.dev' } -TimeoutSec 20
} catch {
  Falha ("O Paradise recusou o cookie (" + $_.Exception.Message + "). Confira se copiou o valor inteiro e se está logado no site.")
}
if (-not $r.success -or -not $r.data) { Falha 'O Paradise respondeu, mas sem os dados esperados.' }
Ok ('Cookie válido. Grupos lidos: ' + (($r.data.PSObject.Properties.Name) -join ', '))

$linhas = @(Get-Content -Path $EnvFile -Encoding UTF8) | Where-Object { $_ -notmatch '^\s*PARADISE_COOKIE\s*=' }
$linhas = @($linhas) + @("PARADISE_COOKIE=$cookie")
[IO.File]::WriteAllLines($EnvFile, [string[]]$linhas, $Utf8)
$cookie = $null
try { Set-Clipboard -Value ' ' } catch {}
Ok 'Cookie salvo no .env do bot (so no seu PC). Area de transferencia limpa.'

Write-Host ''
Write-Host 'Atualizando e reiniciando o bot...' -ForegroundColor Cyan
if (Test-Path $Manage) { & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $Manage atualizar }
else { Falha "Atalho de manutenção não encontrado ($Manage). Use o atalho Atualizar na pasta High OS Bot." }

Write-Host ''
Write-Host 'Conferindo a coleta (pode levar até 1 minuto)...' -ForegroundColor Cyan
$ok = $false
for ($i = 0; $i -lt 12 -and -not $ok; $i++) {
  Start-Sleep 5
  try {
    $h = Invoke-RestMethod 'http://127.0.0.1:3000/health' -TimeoutSec 5
    if ($h.paradise.ultimoSucesso) { $ok = $true; Ok ("Paradise sincronizado. Linhas lidas: " + $h.paradise.linhas) }
    elseif ($h.paradise.erro) { Write-Host ("  !   Paradise: " + $h.paradise.erro) -ForegroundColor Yellow }
  } catch {}
}
if (-not $ok) { Write-Host '  !   Ainda sem confirmação. O bot pode estar carregando o Discord; confira daqui a pouco pelo atalho "Ver log" (procure "Paradise").' -ForegroundColor Yellow }
Write-Host ''
Write-Host 'Pronto. Quando a sessão do Paradise vencer, rode este mesmo comando de novo.' -ForegroundColor Green
