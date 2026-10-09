@echo off
REM Builds unstable-smp-hub.apk (debug-signed, installs directly).
REM 1) Deploy the site (Vercel) and paste the URL into
REM    android\app\src\main\java\com\unstablesmp\hub\MainActivity.java (SITE_URL).
REM 2) Double-click this file.
cd /d "%~dp0"
set "SDK=%LOCALAPPDATA%\Android\Sdk"
if not exist "%SDK%\platform-tools\adb.exe" (
  echo Android SDK not found at %SDK%
  echo Install Android Studio, or set SDK manually in android\local.properties as sdk.dir=C:\path\to\Sdk
  pause & exit /b 1
)
echo sdk.dir=%SDK:\=\\% > local.properties
call gradlew.bat assembleDebug --console=plain
if errorlevel 1 (echo BUILD FAILED & pause & exit /b 1)
copy /y app\build\outputs\apk\debug\app-debug.apk ..\unstable-smp-hub.apk
echo.
echo APK ready: unstable-smp-hub\..\unstable-smp-hub.apk
echo Install: adb install -r ..\unstable-smp-hub.apk  (phone on USB, USB debugging on)
pause
