#!/usr/bin/env python3
"""Minimal static file server for local dev.

Works around iCloud sandboxing where the launch cwd is unreadable (which makes
`python3 -m http.server` crash on os.getcwd()) by chdir-ing to this file's own
directory before serving.
"""
import http.server
import os
import socketserver

ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)
PORT = 8123

Handler = http.server.SimpleHTTPRequestHandler
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Focus Pet serving {ROOT} at http://localhost:{PORT}")
    httpd.serve_forever()
