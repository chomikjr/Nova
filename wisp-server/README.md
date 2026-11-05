# Nova Wisp server

The Nova Browser (Scramjet) reaches websites through a **Wisp** server — a small WebSocket
relay. Vercel can't host WebSockets, so run this folder somewhere else, then add its address
to `proxy/config.js` (or paste it into the Browser's server menu → *Bring your own server*).

The address always ends in `/wisp/`, e.g. `wss://nova-wisp.onrender.com/wisp/`.

## Option A — Render (free tier)
1. render.com → **New → Web Service** → connect this GitHub repo.
2. **Root directory:** `wisp-server` · **Build:** `npm install` · **Start:** `npm start`.
3. Environment variable `ALLOWED_ORIGINS` = your Nova site, e.g. `https://your-site.vercel.app`.
4. When it's live, your server is `wss://<name>.onrender.com/wisp/`.
   (Free Render services sleep when idle; the first page load after a while takes ~30 s.)

Railway, Koyeb and Fly.io work the same way — deploy the `wisp-server` folder (there's a
Dockerfile) and use `wss://<their-domain>/wisp/`.

## Option B — your Raspberry Pi / old laptop
```sh
cd wisp-server
npm install
ALLOWED_ORIGINS=https://your-site.vercel.app PORT=8080 npm start
```
The Browser runs on an https page, so the relay needs `wss://` (TLS). The easiest way from
home is a Cloudflare Tunnel: `cloudflared tunnel --url http://localhost:8080` gives you an
https address — use it as `wss://<that-address>/wisp/`.

## Add it to Nova
In `proxy/config.js`:
```js
servers: [
  { name: 'Server 1', url: 'wss://nova-wisp.onrender.com/wisp/' },
],
```
You can list several (Server 1, Server 2…); players pick one from the server menu.

`ALLOWED_ORIGINS` keeps other sites from using your server (`https://*.example.com` allows every subdomain). The relay uses Cloudflare's
family DNS (1.1.1.3), which blocks malware and adult sites.
