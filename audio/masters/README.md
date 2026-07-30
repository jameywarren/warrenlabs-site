# Audio masters — drop your source files here

**This is where your own artists' tracks go.** Put full-quality masters here — WAV, AIFF, FLAC,
high-bitrate MP3, whatever you have. This folder is **gitignored** (except this README), so large
masters never bloat the repo or get served to the public.

The web-facing demo loops live one level up in `public/audio/` as small ~24s MP3s (see
`public/audio/CREDITS.md`). To turn a master into a shipped loop:

1. Drop the file here (e.g. `public/audio/masters/my-artist-track.wav`).
2. Hand it to Claude, or run ffmpeg yourself: pick a ~24s musical section, loudness-normalize, and
   encode to a small web format, e.g.
   ```
   ffmpeg -y -ss 30 -t 24 -i masters/my-artist-track.wav \
     -af "loudnorm=I=-16:TP=-1.5,afade=t=in:st=0:d=0.05,afade=t=out:st=23.8:d=0.2" \
     -ar 44100 -ac 2 -c:a libmp3lame -b:a 192k my-artist-track.mp3
   ```
3. Register it in the `TRACKS` array in `src/scripts/attune-engine.js` (id / url / label / title /
   artist / credit) so it shows up in the demo's music picker — and add it to `CREDITS.md`.

## On WAV / "higher quality"

WAV works — the Web Audio engine decodes WAV, MP3, AAC, etc. all the same. **But** a 24-second stereo
WAV is ~4–5 MB versus ~0.5 MB for MP3, and the demo already EQ's and plays the audio in the browser,
so uncompressed source buys almost nothing audible here while making the page load much heavier.

**Recommendation:** keep the WAV as your master (here, gitignored), and ship a compressed loop
(192–256k MP3, or AAC/Opus for near-transparent + tiny). Best of both — master quality on disk,
web-appropriate delivery. If you genuinely want WAV served in the demo, say so and we'll wire it,
just know the size cost.

## Licensing note

Your own artists' tracks are used **with permission** — record that in `CREDITS.md` (artist name +
"used with permission of the artist"), same as the CC-BY credits. Everything in the demo needs a clear
right to use it, per the site's honest-rights stance.
