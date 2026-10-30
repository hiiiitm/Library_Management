"""
Simple 1-command launcher for Library Management System
Usage:
    python run.py
"""
import subprocess
import sys
import os
import time
import webbrowser

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
VENV_PYTHON = os.path.join(ROOT_DIR, ".venv", "Scripts", "python.exe")
if not os.path.exists(VENV_PYTHON):
    VENV_PYTHON = sys.executable

def main():
    # Ensure .env exists
    env_file = os.path.join(ROOT_DIR, ".env")
    if not os.path.exists(env_file):
        example_env = os.path.join(ROOT_DIR, ".env.example")
        if os.path.exists(example_env):
            import shutil
            shutil.copyfile(example_env, env_file)
            print("[INFO] Generated .env from .env.example")

    print("=" * 65)
    print("  Starting Library Management System (FastAPI + React)")
    print("=" * 65)
    
    # 1. Start Backend
    print("\n[1/2] Starting Backend API on http://127.0.0.1:8000 ...")
    backend_cmd = [
        VENV_PYTHON, "-m", "uvicorn", 
        "backend.app.main:app", 
        "--host", "127.0.0.1", 
        "--port", "8000"
    ]
    backend_proc = subprocess.Popen(backend_cmd, cwd=ROOT_DIR)

    # 2. Start Frontend
    print("[2/2] Starting Frontend on http://127.0.0.1:5173 ...")
    frontend_dir = os.path.join(ROOT_DIR, "frontend")
    frontend_cmd = "npm run dev"
    frontend_proc = subprocess.Popen(frontend_cmd, cwd=frontend_dir, shell=True)

    print("\n" + "=" * 65)
    print("  Application running!")
    print("  - Frontend: http://127.0.0.1:5173")
    print("  - Backend:  http://127.0.0.1:8000/docs")
    print("  Press Ctrl+C at any time to stop both servers.")
    print("=" * 65 + "\n")

    time.sleep(2)
    try:
        webbrowser.open("http://127.0.0.1:5173")
    except Exception:
        pass

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping servers...")
        backend_proc.terminate()
        frontend_proc.terminate()
        print("Servers stopped cleanly.")

if __name__ == "__main__":
    main()
