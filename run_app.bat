@echo off
setlocal
set PORT=8000

echo Starting Climate Storytelling App on port %PORT%...

echo Checking Python launcher...
where py >nul 2>nul
if %errorlevel%==0 (
  start "" "http://127.0.0.1:%PORT%/index.html"
  py -m http.server %PORT%
  goto :end
)

echo Checking Python executable...
where python >nul 2>nul
if %errorlevel%==0 (
  start "" "http://127.0.0.1:%PORT%/index.html"
  python -m http.server %PORT%
  goto :end
)

echo.
echo Python was not found on PATH.
echo Install Python from https://www.python.org/downloads/
echo Then run this file again.
pause

:end
endlocal
