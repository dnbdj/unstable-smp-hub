# Unstable SMP Hub

Static, dependency-free episode tracker for the Unstable SMP universe.
Live at https://unstablesmp.freebuff.page

157 episodes in plain order for Wemmbu (42), FlameFrags (38),
ParrotX2 (37) and SpokeIsHere (40). No accounts, no backend, no build step — watched
progress lives in this browser's localStorage under `ushub-progress`.

## Rule: flat episodes, never labelled by seasons

Permanent constraint, not a style preference. The hub ships with zero mentions of
seasons — no season wording, no seasonal grouping, no numeric run labels — anywhere in
the data, copy, art, URLs, meta tags, UI or docs. Episodes are one flat, plainly
ordered list per creator (`creator-p1-e1`, shown as E1…En); nothing may group, count
or describe them as a season. This note is the repository's single sanctioned mention
of the concept, kept so a future contributor reading the repo alone knows the rule.
If any other mention appears, remove it.

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
