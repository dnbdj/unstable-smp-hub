# Unstable SMP Hub

Static, dependency-free episode tracker for the Unstable SMP universe.
Live at https://unstablesmp.freebuff.page

157 episodes across Season 1, Season 2 and Season 2+ for Wemmbu (42), FlameFrags (38),
ParrotX2 (37) and SpokeIsHere (40). No accounts, no backend, no build step — watched
progress lives in this browser's localStorage under `ushub-progress`.

## Run it locally

```sh
python3 -m http.server 8080
# open http://localhost:8080
```

## What's here

| File | Purpose |
| --- | --- |
| `index.html` | Shell: dashboard, creator pages, watch view |
| `app.js` | Hash router, progress store, YouTube player |
| `styles.css` | Portrait-first layout with tablet / laptop / wide breakpoints |
| `data/episodes.js` | The 157-episode catalogue |
| `manifest.json`, `sw.js` | Installable PWA, network-first service worker |
| `icons/`, `skins/` | Artwork |

Episodes with a pinned YouTube ID play inline; the rest open the YouTube handoff card.
