@echo off
REM Double-click to run the Hub over http://localhost (YouTube embeds need http, not file://).
cd /d "%~dp0.."
where javac >nul 2>nul
if errorlevel 1 (
  if defined JAVA_HOME ("%%JAVA_HOME%%\bin\javac.exe" -d "%TEMP%\smp-hub-server" tools\ServeHub.java) else (echo JDK javac not found. Install a JDK 17+ and retry. & pause & exit /b 1)
) else (
  if not exist "%TEMP%\smp-hub-server" mkdir "%TEMP%\smp-hub-server"
  javac -d "%TEMP%\smp-hub-server" tools\ServeHub.java
)
if errorlevel 1 (echo Compile failed. & pause & exit /b 1)
java -cp "%TEMP%\smp-hub-server" ServeHub
pause
