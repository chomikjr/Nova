/* ==========================================================================
   Nova Browser servers.
   Scramjet needs a Wisp server (a small WebSocket relay) to reach websites.
   Vercel can't run one, so host it somewhere else (see wisp-server/README.md)
   and put its address here. Players can also add their own in the Browser's
   server menu ("Bring your own server").
   Example: { name: 'Server 1', url: 'wss://your-wisp-host.example.com/wisp/' }
   ========================================================================== */
window.NOVA_PROXY = {
  servers: [
    // { name: 'Server 1', url: 'wss://YOUR-WISP-SERVER/wisp/' },
  ],
  searchEngine: 'https://duckduckgo.com/?q=%s',
  quickLinks: [
    { name: 'Google', url: 'https://www.google.com' },
    { name: 'YouTube', url: 'https://www.youtube.com' },
    { name: 'Discord', url: 'https://discord.com/app' },
    { name: 'Reddit', url: 'https://www.reddit.com' },
    { name: 'Spotify', url: 'https://open.spotify.com' },
    { name: 'GeForce NOW', url: 'https://play.geforcenow.com' },
    { name: 'now.gg', url: 'https://now.gg' },
    { name: 'Wikipedia', url: 'https://www.wikipedia.org' }
  ]
};
