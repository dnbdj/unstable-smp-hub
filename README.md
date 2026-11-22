# Unstable SMP Hub

Static, dependency-free episode tracker for the Unstable SMP universe.
Live at https://unstablesmp.freebuff.page

157 episodes in plain order for Wemmbu (42), FlameFrags (38),
ParrotX2 (37) and SpokeIsHere (40). No accounts, no backend, no build step — watched
progress lives in this browser's localStorage under `ushub-progress`.

## Rule: flat episode list, never grouped into runs

Permanent constraint, not a style preference. Episodes are one flat, plainly ordered
list per creator (`creator-p1-e1`, shown as E1…En). Nothing may group, count, label or
describe them as a larger numbered unit: no run numbers, no run names, no bundling of
episodes under a heading. This holds everywhere — data, copy, art, URLs, meta tags, UI
and docs — and it includes this note: the forbidden grouping concept is not to be named
here either, so a future contributor reading the repo alone still knows the rule without
the wording existing anywhere. If a grouped label shows up in any file, remove it and
keep the flat list.

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
