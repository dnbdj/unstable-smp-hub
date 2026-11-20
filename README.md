# Unstable SMP Hub

Static, dependency-free episode tracker for the Unstable SMP universe.
Live at https://unstablesmp.freebuff.page

157 episodes in plain order for Wemmbu (42), FlameFrags (38),
ParrotX2 (37) and SpokeIsHere (40). No accounts, no backend, no build step — watched
progress lives in this browser's localStorage under `ushub-progress`.

## Rule: no seasons

This project contains no seasons. No season concepts, labels, chapters, numbering,
badges, filters, fields or derived mentions — anywhere in the data, copy, art, URLs,
meta tags or UI. Episodes are plain ordered parts (`creator-p1-e1`); nothing in the
site, docs, commits or metadata may group them, count them or describe them as a
season. If you find a season mention, remove it.

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
| `data/world.js` | Side characters, factions and places for the world guide |
| `manifest.json`, `sw.js` | Installable PWA, network-first service worker |
| `icons/`, `skins/`, `art/` | Artwork |

Episodes with a pinned YouTube ID play inline; the rest open the YouTube handoff card.
