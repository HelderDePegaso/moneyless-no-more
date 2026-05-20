# Script de Configuração de Node.js e NPM Portátil
# Este script baixa a versão de desenvolvimento do Node.js x64 (portátil) e a extrai na pasta local do workspace.

$NodeDir = Join-Path $PSScriptRoot ".node"
$ZipPath = Join-Path $PSScriptRoot "node-portable.zip"
$DownloadUrl = "https://nodejs.org/dist/v20.12.2/node-v20.12.2-win-x64.zip"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Configurando Node.js e NPM Portátil...     " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 1. Verifica se já está instalado
if (Test-Path (Join-Path $NodeDir "node.exe")) {
    Write-Host "[Info] Node.js portátil já está configurado em $NodeDir." -ForegroundColor Green
    exit 0
}

# 2. Cria pasta de destino
if (-not (Test-Path $NodeDir)) {
    New-Item -ItemType Directory -Path $NodeDir -Force | Out-Null
}

# 3. Baixa o Node.js Zip
Write-Host "[1/3] Baixando Node.js (v20.12.2 Win-x64)..." -ForegroundColor Yellow
Write-Host "URL: $DownloadUrl" -ForegroundColor Gray
try {
    # Usando BITS Transfer para maior estabilidade e progresso nativo
    Start-BitsTransfer -Source $DownloadUrl -Destination $ZipPath -ErrorAction Stop
} catch {
    Write-Host "[Aviso] BitsTransfer falhou. Tentando Invoke-WebRequest..." -ForegroundColor Yellow
    try {
        Invoke-WebRequest -Uri $DownloadUrl -OutFile $ZipPath -ErrorAction Stop
    } catch {
        Write-Host "[Erro] Falha ao baixar o Node.js zip. Verifique sua conexão com a internet." -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        exit 1
    }
}

# 4. Extrai o conteúdo
Write-Host "[2/3] Extraindo arquivos ZIP..." -ForegroundColor Yellow
$TempExtract = Join-Path $PSScriptRoot "temp_extract"
if (Test-Path $TempExtract) { Remove-Item -Recurse -Force $TempExtract | Out-Null }
New-Item -ItemType Directory -Path $TempExtract -Force | Out-Null

try {
    Expand-Archive -Path $ZipPath -DestinationPath $TempExtract -Force
} catch {
    Write-Host "[Erro] Falha ao descompactar o arquivo ZIP." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Move os arquivos da subpasta interna do zip para a pasta principal .node
$SubFolder = Get-ChildItem -Path $TempExtract -Directory | Select-Object -First 1
if ($SubFolder) {
    Copy-Item -Path (Join-Path $SubFolder.FullName "*") -Destination $NodeDir -Recurse -Force
} else {
    Write-Host "[Erro] Pasta interna do zip não encontrada." -ForegroundColor Red
    exit 1
}

# Limpeza dos arquivos temporários
Remove-Item -Path $ZipPath -Force | Out-Null
Remove-Item -Recurse -Force $TempExtract | Out-Null

# 5. Verifica sucesso
if (Test-Path (Join-Path $NodeDir "node.exe")) {
    Write-Host "[3/3] Sucesso! Node.js portátil instalado com êxito." -ForegroundColor Green
    Write-Host "Executando testes básicos..." -ForegroundColor Gray
    
    $nodeVer = & (Join-Path $NodeDir "node.exe") --version
    $npmVer = & (Join-Path $NodeDir "npm.cmd") --version
    
    Write-Host "Node: $nodeVer" -ForegroundColor Green
    Write-Host "NPM:  $npmVer" -ForegroundColor Green
    
    # Criar um arquivo batch auxiliar de atalho para facilitar execução
    $RunDevBat = @"
@echo off
SET PATH=%~dp0.node;%PATH%
echo Ambiente configurado com Node portatil!
npm run dev
"@
    $RunDevBat | Out-File -FilePath (Join-Path $PSScriptRoot "dev.bat") -Encoding ASCII -Force
    
    Write-Host "Arquivo de atalho 'dev.bat' criado para execução simplificada." -ForegroundColor Green
} else {
    Write-Host "[Erro] Arquivo node.exe não foi encontrado na pasta final." -ForegroundColor Red
    exit 1
}
