from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urljoin
import os

import requests


TARGET_BASE = os.environ.get(
    "PROXY_TARGET",
    "https://content-machine-18.preview.emergentagent.com",
).rstrip("/")
HOST = os.environ.get("PROXY_HOST", "127.0.0.1")
PORT = int(os.environ.get("PROXY_PORT", "3002"))
TIMEOUT = int(os.environ.get("PROXY_TIMEOUT", "60"))


class ProxyHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def _set_cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")

    def do_OPTIONS(self):
        self.send_response(204)
        self._set_cors()
        self.send_header("Content-Length", "0")
        self.end_headers()

    def _forward(self):
        body = None
        content_length = self.headers.get("Content-Length")
        if content_length:
            body = self.rfile.read(int(content_length))

        target_url = urljoin(f"{TARGET_BASE}/", self.path.lstrip("/"))
        headers = {
            key: value
            for key, value in self.headers.items()
            if key.lower() not in {"host", "content-length", "connection"}
        }

        try:
            response = requests.request(
                method=self.command,
                url=target_url,
                headers=headers,
                data=body,
                stream=True,
                timeout=TIMEOUT,
                allow_redirects=False,
            )
        except requests.RequestException as exc:
            payload = f'{{"success": false, "error": "Proxy error", "detail": "{str(exc)}"}}'.encode()
            self.send_response(502)
            self._set_cors()
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return

        self.send_response(response.status_code)
        self._set_cors()
        excluded = {"content-encoding", "transfer-encoding", "connection"}
        for key, value in response.headers.items():
            if key.lower() in excluded:
                continue
            self.send_header(key, value)

        content = response.content
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def do_GET(self):
        self._forward()

    def do_POST(self):
        self._forward()

    def do_PUT(self):
        self._forward()

    def do_PATCH(self):
        self._forward()

    def do_DELETE(self):
        self._forward()


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), ProxyHandler)
    print(f"Dev proxy running on http://{HOST}:{PORT} -> {TARGET_BASE}")
    server.serve_forever()
