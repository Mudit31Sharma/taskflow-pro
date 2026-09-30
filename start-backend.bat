@echo off
echo ========================================================
echo Starting TaskFlow Pro FastAPI Backend on http://127.0.0.1:8000
echo Docs available at http://127.0.0.1:8000/docs
echo ========================================================
set PYTHONPATH=backend
backend\.venv\Scripts\uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
