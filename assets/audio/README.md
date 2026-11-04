# Music stations

Every folder in here is a station in the Music app. Drop audio files into a folder and they play.

```
assets/audio/
  hip hop/      ← put .mp3 files here
  lofi/
  chill/
  electronic/
  pop/
  anything you want/   ← new folder = new station
```

- **Formats:** mp3 (best), m4a, aac, ogg, opus, wav, flac, webm. Subfolders inside a station are included too.
- **Song names come from the file name.** `Artist - Song.mp3` shows as *Song* by *Artist*.
  Leading track numbers (`01 - `, `02. `) are hidden, and songs are sorted by file name.
- **Empty folders are hidden** from the site until they have at least one song.
- **Optional extras per folder:**
  - `station.json` — `{ "name": "Hip Hop", "vibe": "Beats to game to", "order": 1, "hue": 280 }`
  - `cover.jpg` / `cover.png` / `cover.webp` — station artwork.
- Folders starting with `_` or `.` are ignored.

## How the site finds the songs

`scripts/build-audio-manifest.js` scans these folders and writes `manifest.json`.
Vercel runs it automatically on every deploy (`vercel.json`), so just commit the files and push.

Testing locally or hosting somewhere without a build step? Run it yourself first:

```bash
node scripts/build-audio-manifest.js
```

Only add music you have the rights to share (your own, royalty-free, or Creative Commons
music that allows it), since the site is public.
