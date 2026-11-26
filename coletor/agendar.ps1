# HIGH OS — agenda o coletor de métricas no Agendador de Tarefas do Windows.
# Roda às 14:05, 16:05, 21:05 e 23:05, só quando você está logado no Windows
# (precisa da sua sessão para usar o perfil do Edge). Para remover:
#   Unregister-ScheduledTask -TaskName "High OS - Coletor de metricas" -Confirm:$false
$ErrorActionPreference = 'Stop'
$pasta = $PSScriptRoot
$node = (Get-Command node).Source
$nome = 'High OS - Coletor de metricas'

$acao = New-ScheduledTaskAction -Execute 'cmd.exe' -WorkingDirectory $pasta `
  -Argument "/c `"`"$node`" coletor.mjs coletar >> coletor.log 2>&1`""
$gatilhos = '14:05', '16:05', '21:05', '23:05' | ForEach-Object { New-ScheduledTaskTrigger -Daily -At $_ }
# StartWhenAvailable: se o PC estava desligado no horário, roda assim que ligar.
$config = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 15) -MultipleInstances IgnoreNew
$quem = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $nome -Action $acao -Trigger $gatilhos -Settings $config -Principal $quem -Force | Out-Null
Get-ScheduledTask -TaskName $nome | Get-ScheduledTaskInfo | Select-Object TaskName, NextRunTime
