@echo off
SET PATH=C:\Program Files\nodejs;%PATH%
echo Starting Frontend Website...
cd frontend
CALL npm.cmd run dev
pause
