"""Run Datalith locally — exactly how it runs when deployed (a static site).

    python run.py     ->     http://localhost:8000

No dependencies needed (uses Python's built-in static web server). This serves the
whole project folder, so the app, the diagrams, and all the course content load the
same way locally as they do online. Press Ctrl+C to stop.
"""
from __future__ import annotations

import http.server
import os
import socketserver
import webbrowser
from pathlib import Path

PORT = 8000
ROOT = Path(__file__).resolve().parent


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        # No-cache so your edits (lessons, diagrams) always show on a refresh.
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def log_message(self, *args):  # keep the console quiet
        pass


if __name__ == "__main__":
    os.chdir(ROOT)
    url = f"http://localhost:{PORT}"
    print("\n  Datalith is running (static mode).")
    print(f"  Open your browser at:  {url}\n  (Ctrl+C to stop.)\n")
    try:
        webbrowser.open(url)
    except Exception:
        pass
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n  Stopped.\n")
