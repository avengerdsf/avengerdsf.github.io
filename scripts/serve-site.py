"""Preview the built site with the same clean article URLs as GitHub Pages."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from functools import partial
import sys

class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, request_path):
        result = super().translate_path(request_path)
        if not Path(result).exists() and Path(result + '.html').is_file():
            return result + '.html'
        return result

root = Path(sys.argv[1] if len(sys.argv) > 1 else '.build/preview').resolve()
if not (root / 'knowledge/index.html').is_file():
    raise SystemExit('Build the site first: npm run build:knowledge')
server = ThreadingHTTPServer(('127.0.0.1', 4173), partial(Handler, directory=str(root)))
print('Preview: http://127.0.0.1:4173/', flush=True)
try:
    server.serve_forever()
except KeyboardInterrupt:
    server.server_close()
