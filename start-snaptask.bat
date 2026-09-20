@echo off
title Launching SnapTask PWA...
cd /d "%~dp0"
echo ===================================================
echo     SnapTask Local PWA Launcher
echo ===================================================
echo.
echo Starting local web server at http://localhost:3000 ...
echo Opening your web browser automatically...
echo.
echo TIP: Once open in Microsoft Edge or Chrome, click 
echo the "Install App" icon in the top right address bar 
echo to install SnapTask to your Desktop / Start Menu!
echo ===================================================
echo.

node node_modules\vite\bin\vite.js --port 3000 --open
