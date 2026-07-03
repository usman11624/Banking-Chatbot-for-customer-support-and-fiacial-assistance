@echo off
setlocal enabledelayedexpansion

set "DB_NAME=banking_bot"
set "DB_USER=postgres"
set "SCHEMA_FILE=%~dp0postgres_setup.sql"
set "TEMP_SCHEMA=%TEMP%\banking_bot_schema_import.sql"

echo.
echo ========================================
echo  Banking Chat Bot - PostgreSQL Setup
echo ========================================
echo.

where psql >nul 2>nul
if errorlevel 1 (
    echo ERROR: psql was not found in PATH.
    echo Install PostgreSQL or add psql.exe to PATH and try again.
    pause
    exit /b 1
)

if not exist "%SCHEMA_FILE%" (
    echo ERROR: Schema file not found: %SCHEMA_FILE%
    pause
    exit /b 1
)

echo Creating temporary import schema...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Content '%SCHEMA_FILE%' | Where-Object { $_ -notmatch '^\s*CREATE DATABASE\s+banking_bot\s*;\s*$' } | Set-Content '%TEMP_SCHEMA%'"
if errorlevel 1 (
    echo ERROR: Could not prepare import schema.
    pause
    exit /b 1
)

for /f "usebackq delims=" %%i in (`psql -U %DB_USER% -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='%DB_NAME%'"`) do set "DB_EXISTS=%%i"

if not "%DB_EXISTS%"=="1" (
    echo Creating database %DB_NAME%...
    psql -U %DB_USER% -d postgres -c "CREATE DATABASE %DB_NAME%;"
    if errorlevel 1 (
        del "%TEMP_SCHEMA%" >nul 2>nul
        echo ERROR: Could not create database %DB_NAME%.
        pause
        exit /b 1
    )
) else (
    echo Database %DB_NAME% already exists.
)

echo Importing schema and seed data...
psql -U %DB_USER% -d %DB_NAME% -f "%TEMP_SCHEMA%"
set "IMPORT_ERROR=%ERRORLEVEL%"

del "%TEMP_SCHEMA%" >nul 2>nul

if not "%IMPORT_ERROR%"=="0" (
    echo ERROR: Schema import failed.
    pause
    exit /b %IMPORT_ERROR%
)

echo.
echo PostgreSQL setup complete.
echo Database: %DB_NAME%
echo.
pause