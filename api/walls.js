/* 4K wallpaper search for Nova's Wallpaper Store, backed by Unsplash (free photos).
   The Unsplash access key lives in the UNSPLASH_ACCESS_KEY environment variable on Vercel,
   so it never reaches the browser.
   GET /api/walls?q=mountains&page=1   → a page of landscape photos
   GET /api/walls?track=<download_location> → tells Unsplash a photo was used (their API rules) */
const API = 'https://api.unsplash.com';

module.exports = async (req, res) => {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=600');
  if (!key) { res.status(503).json({ error: 'not_configured' }); return; }
  const url = new URL(req.url, 'http://x');
  const headers = { Authorization: 'Client-ID ' + key, 'Accept-Version': 'v1' };
  try {
    const track = url.searchParams.get('track');
    if (track) {
      const t = new URL(track);
      if (t.hostname !== 'api.unsplash.com' || !/^\/photos\/[\w-]+\/download$/.test(t.pathname)) { res.status(400).json({ error: 'bad_track' }); return; }
      await fetch(t.toString(), { headers });
      res.setHeader('Cache-Control', 'no-store');
      res.status(204).end();
      return;
    }
    const q = (url.searchParams.get('q') || '').trim().slice(0, 60);
    const page = Math.max(1, Math.min(50, parseInt(url.searchParams.get('page'), 10) || 1));
    const endpoint = q
      ? API + '/search/photos?query=' + encodeURIComponent(q) + '&orientation=landscape&content_filter=high&per_page=24&page=' + page
      : API + '/topics/wallpapers/photos?orientation=landscape&per_page=24&page=' + page;
    const r = await fetch(endpoint, { headers });
    if (!r.ok) { res.status(r.status === 403 ? 429 : 502).json({ error: 'upstream', status: r.status }); return; }
    const j = await r.json();
    const list = (Array.isArray(j) ? j : j.results || []).map((p) => ({
      id: p.id,
      w: p.width, h: p.height, color: p.color,
      alt: p.alt_description || p.description || 'Wallpaper',
      thumb: p.urls.small,
      full: p.urls.raw + '&w=3840&q=85&fm=jpg&fit=max',
      author: p.user && p.user.name, authorUrl: p.user && p.user.links && p.user.links.html + '?utm_source=nova&utm_medium=referral',
      link: p.links.html + '?utm_source=nova&utm_medium=referral',
      dl: p.links.download_location
    }));
    res.status(200).json({ list, total: j.total || null });
  } catch (e) {
    res.status(502).json({ error: 'failed' });
  }
};
