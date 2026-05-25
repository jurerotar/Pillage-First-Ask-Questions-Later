@echo off
chcp 65001 >nul
title Pillage First - Setup
setlocal EnableDelayedExpansion

echo.
echo ========================================
echo  Pillage First - Ask Questions Later
echo  Setup automatico para Windows 11
echo ========================================
echo.

winget --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] winget nao encontrado.
    echo Atualize o Windows 11 pela Windows Store ^(App Installer^) e tente novamente.
    pause
    exit /b 1
)

where git >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Git nao encontrado. Instalando...
    winget install --id Git.Git --silent --accept-source-agreements --accept-package-agreements
    echo [OK] Git instalado.
) else (
    echo [OK] Git ja esta instalado.
)

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Node.js nao encontrado. Instalando...
    winget install --id OpenJS.NodeJS.LTS --silent --accept-source-agreements --accept-package-agreements
    echo [OK] Node.js instalado.
) else (
    echo [OK] Node.js ja esta instalado.
)

echo [INFO] Atualizando PATH...
for /f "delims=" %%i in ('powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')"') do set "PATH=%%i"

where git >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Git ainda nao esta no PATH apos instalacao.
    echo Feche este arquivo e abra novamente.
    pause
    exit /b 1
)

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js ainda nao esta no PATH apos instalacao.
    echo Feche este arquivo e abra novamente.
    pause
    exit /b 1
)

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] npm nao encontrado. Reinstale o Node.js em https://nodejs.org
    pause
    exit /b 1
)

echo.

set "PASTA=%USERPROFILE%\Documentos\pillage-first"

if exist "%PASTA%\.git" (
    echo [INFO] Jogo ja baixado. Atualizando...
    cd /d "%PASTA%"
    git pull
) else (
    echo [INFO] Baixando o jogo ^(pode demorar alguns minutos^)...
    git clone https://github.com/jurerotar/Pillage-First-Ask-Questions-Later.git "%PASTA%"
    cd /d "%PASTA%"
)

echo.

echo [INFO] Instalando dependencias do jogo...
call npm install --ignore-scripts
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao instalar dependencias.
    pause
    exit /b 1
)

echo.

cd /d "%PASTA%\apps\web"

echo ========================================
echo  Acesse o jogo em: http://localhost:5173
echo  Pressione Ctrl+C para encerrar
echo ========================================
echo.

start "" http://localhost:5173
call npm run dev

pause
