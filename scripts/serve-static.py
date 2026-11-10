# Static server for the web export that maps /route to route.html (like Vercel cleanUrls). Dev use only.
import http.server, os, sys
class H(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split('?')[0]
        if not os.path.splitext(path)[1] and path != '/' and os.path.exists(self.translate_path(path) + '.html'):
            self.path = path + '.html'
        return super().do_GET()
    def log_message(self, *a): pass
os.chdir(sys.argv[1]); http.server.ThreadingHTTPServer(('127.0.0.1', 8765), H).serve_forever()
