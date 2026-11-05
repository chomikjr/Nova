/* Nova Wisp server — the relay the Nova Browser connects to (wss://HOST/wisp/).
   Env:
     PORT             port to listen on (default 8080; most hosts set this for you)
     ALLOWED_ORIGINS  comma-separated sites allowed to use this server, e.g.
                      https://nova.vercel.app,https://yourdomain.com
                      Leave empty to allow any site. */
import { createServer } from 'node:http';
import { server as wisp, logging } from '@mercuryworkshop/wisp-js/server';

logging.set_level(logging.WARN);
Object.assign(wisp.options, {
  allow_udp_streams: false,
  dns_servers: ['1.1.1.3', '1.0.0.3'] // Cloudflare "family" DNS: blocks malware and adult sites
});

const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean);
const port = parseInt(process.env.PORT || '8080', 10);

const http = createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.end('Nova Wisp server is running. Point the Nova Browser at wss://' + (req.headers.host || 'this-host') + '/wisp/\n');
});
http.on('upgrade', (req, socket, head) => {
  if (allowed.length && !allowed.includes(String(req.headers.origin || '').replace(/\/$/, ''))) { socket.destroy(); return; }
  if (req.url.endsWith('/wisp/')) wisp.routeRequest(req, socket, head);
  else socket.end();
});
http.listen(port, '0.0.0.0', () => console.log('Nova Wisp server on :' + port + '  →  /wisp/' + (allowed.length ? '  (origins: ' + allowed.join(', ') + ')' : '')));
