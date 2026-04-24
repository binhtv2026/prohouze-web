from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os


ROOT = Path(__file__).resolve().parent
BUILD_DIR = ROOT / "build"
HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", "3005"))


class SpaHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(BUILD_DIR), **kwargs)

    def do_GET(self):
        requested = self.translate_path(self.path)
        build_root = str(BUILD_DIR)
        index_file = BUILD_DIR / "index.html"

        if requested.startswith(build_root) and Path(requested).exists():
            return super().do_GET()

        self.path = "/index.html"
        return super().do_GET()


def main():
    if not BUILD_DIR.exists():
        raise SystemExit(f"Build directory not found: {BUILD_DIR}")

    server = ThreadingHTTPServer((HOST, PORT), SpaHandler)
    print(f"Serving ProHouzing preview at http://{HOST}:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
