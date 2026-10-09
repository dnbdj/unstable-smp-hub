# Unstable SMP Hub (mobile-first PWA + native wrapper)

Mobile-first web app to browse and track 157 Unstable SMP episodes
across Season 1 / Season 2 / Season 2+, with per-creator progress,
in-app YouTube viewing, and Google Sign-In (guest mode works with no keys).

This lives alongside the Fabric mod in this repo — it is a separate
static site in `unstable-smp-hub/`, no build step required.

## Run it now (no Node needed)

Easiest (Windows, uses your mod JDK): double-click
`unstable-smp-hub/Start-Hub.bat`. It prints a PC link and a phone link
(`http://192.168.x.x:8080` — same Wi-Fi, allow the Java firewall prompt).

Any static server also works. With Python:

```powershell
cd unstable-smp-hub
python -m http.server 8080
# open http://localhost:8080
```

Or with VS Code Live Server / `npx serve`.

## What is inside

```
unstable-smp-hub/
  index.html          app shell: dashboard, catalog, watch view
  styles.css          mobile-first CSS, animated square tiles
  config.js           GOOGLE_CLIENT_ID + channel handles (edit me)
  data/episodes.js    deterministic 157-episode catalog (edit titles/IDs here)
  app.js              rendering, progress, auth, player, PWA
  manifest.json       PWA manifest (installable)
  sw.js               offline cache
  icons/icon-*.svg    install icons
  capacitor.config.json  wrapper config for .apk / .ipa
```

## Episode data (157)

`data/episodes.js` generates exactly 157 episodes deterministically:

| Creator | S1 | S2 | S2+ | Total |
|---|---|---|---|---|
| Wemmbu | 14 | 18 | 10 | 42 |
| FlameFrags | 12 | 17 | 9 | 38 |
| ParrotX2 | 12 | 16 | 9 | 37 |
| SpokeIsHere | 14 | 17 | 9 | 40 |
| **Total** | **52** | **68** | **37** | **157** |

The first episode(s) per creator use real YouTube IDs found via search
(e.g. Wemmbu `MXD53PF5nvY`, FlameFrags `xxbwmsi4n-U`, Spoke `wG9dbWNsems`).
To pin an exact video, set `youtubeId: "<11-char id>"` on that episode —
thumbnails switch to that video automatically.

Playback note: the Watch view plays videos in-app via the YouTube embed
player, with a rich "Watch on YouTube" handoff card (thumbnail backdrop,
exact-video link) if a video ever refuses. All pinned IDs verified
embeddable on hosted builds. Serve over http(s) - YouTube answers
`file://` origins with Error 153, so judge playback on hosting, the PWA,
or the Capacitor shell, never on a bare local file. Opening `index.html`
directly (`file://`) always refuses with 153 — the app detects that and
says so instead of trying. Pinning more real IDs
(`youtubeId`) improves thumbnails and deep links.

## Google Sign-In

* Guest mode works with `GOOGLE_CLIENT_ID = ""` — progress is stored in
  `localStorage` on the device.
* To enable real sign-in: create an OAuth Client (Web) in Google Cloud
  Console, add your origin to Authorized JavaScript origins, paste the
  `...apps.googleusercontent.com` ID into `config.js`.
* Progress is namespaced per signed-in email (`ushub-progress-<email>`),
  so each Google account keeps its own watched set on that device.
* True cross-device sync needs a backend (Firebase/Supabase). The app is
  structured for it: `Auth.getUser()` + `Store` are the only two places to
  swap `localStorage` for a cloud DB.

## Character faces (pinned, exact)

Tiles show pinned 3D busts in `skins/*-3d.webp` (verified against live
Mojang textures — no CDN staleness, works offline), falling back to the
pinned flat faces in `skins/*.png`. Refresh after a creator changes
their skin:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File unstable-smp-hub/tools/fetch-skins.ps1
```

If a tile ever looks wrong, that script re-pulls the authoritative skin.
Live render APIs (mc-heads, Minotar) remain as automatic fallback only.

## Brand art

Header mark + wordmark are the official Unstable SMP brand images from
unstablesmp.gg (`icons/official-logo.png`, `icons/official-wordmark.png`).
They belong to their owners and are bundled here for fan-hub
identification only.

## YouTube channels

Tiles show Minecraft faces (see above). Channel handles for
"Open on YouTube" links live in `config.js`:

* Wemmbu → `@wemmbumc`
* FlameFrags → `@FlameFragsMC`
* ParrotX2 → `@ParrotX2`
* SpokeIsHere → `@Spokeishere`

## Go public on Vercel free

Yes — this is a plain static folder, ideal for the free plan
(100 GB bandwidth, free HTTPS, which embeds require).

1. Push this repo to GitHub (Vercel deploys from git — no Node needed
   on your PC).
2. vercel.com → Add New → Project → Import the repo.
3. Set **Root Directory** to `unstable-smp-hub`, Framework Preset to
   **Other**, leave Build/Output commands empty. (`vercel.json` is
   already in that folder.)
4. Deploy → you get `https://<name>.vercel.app`. Custom domains work
   on free too.

Every push to the branch redeploys. The service worker auto-reloads
the app when a new version takes over.

## Compile the .apk WebView wrapper (proven here)

`unstable-smp-hub/android/` is a minimal native shell that loads your
Vercel URL in a WebView (JS + localStorage on, YouTube links open the
YouTube app, phone back button walks pages). Compiled cleanly in this
workspace: `assembleDebug` BUILD SUCCESSFUL, 0.87 MB APK, package
`com.unstablesmp.hub`.

1. Paste the Vercel URL into `SITE_URL` in
   `android/app/src/main/java/com/unstablesmp/hub/MainActivity.java`.
2. Double-click `android/Build-Apk.bat` (writes `local.properties`
   from your SDK, builds, copies `unstable-smp-hub.apk` next to it).
3. Install: `adb install -r unstable-smp-hub.apk` (USB debugging on),
   or copy the APK to the phone and tap it.
4. No Play signing needed for personal installs. For the Play Store,
   build `assembleRelease` + sign via Play App Signing instead —
   or point PWABuilder at the Vercel URL and let it cloud-build.

Notes: needs JDK 17+ (you have 25) and the Android SDK (already at
`%LOCALAPPDATA%\Android\Sdk` here). First build downloads AGP (~1 GB
with deps) — later builds take ~30 s. iOS still needs a Mac + Xcode;
this wrapper is Android-only.

### Alternative shells: Capacitor / PWABuilder

Yes — it's a plain static site, so it runs as-is inside Capacitor's
native shell too: pages, tiles, progress rings, localStorage progress,
YouTube embeds, and the handoff fallback all work. Two things to know:

* **Google Sign-In button won't work inside the compiled app.** Google
  blocks OAuth in embedded WebViews, so the web button fails and the app
  stays in guest mode (progress still saves on-device). For real sign-in,
  add a native plugin (`@capacitor/google-login` or Firebase Auth) and
  feed its result into `Store.user` in `app.js` (plus `localStorage`
  `ushub-user`) — that object is the only auth seam.
* **Embeds depend on origin.** Android runs `http://localhost` (verified
  fine for embeds). iOS defaults to a `capacitor://` origin, which
  YouTube *usually* accepts; if a video ever refuses there, the app
  already swaps to the YouTube-app handoff instead of erroring. Escape
  hatch: set `server.iosScheme` in `capacitor.config.json`.
* `target="_blank"` YouTube links open the YouTube app / browser —
  correct behavior on mobile, plus the Mark-watched pulse on return.

### What you need

* Node LTS (https://nodejs.org) — only for the Capacitor path
* Android: SDK already installed here (no Android Studio needed —
  `Build-Apk.bat` uses it directly)
* iOS (`.ipa`): a Mac with Xcode + Apple Developer account ($99/yr
  for App Store; free account can sideload to your own phone).

### Option A — PWABuilder (easiest, no code change)

1. Deploy this folder to any HTTPS host (GitHub Pages / Netlify / Vercel).
2. Go to pwabuilder.com, enter the URL, Download Android (`.apk`/`.aab`)
   and iOS (Share → Add to Home Screen / PWABuilder iOS package).

### Option B — Capacitor (native shell, needs Node LTS)

```powershell
cd unstable-smp-hub
npm init -y
npm i @capacitor/core @capacitor/cli
npx cap init "Unstable SMP Hub" com.unstablesmp.hub --web-dir=.
npx cap add android
npx cap add ios
npx cap sync
# Android: open android/ in Android Studio → Build → Build APK(s)
# iOS: open ios/App/App.xcworkspace in Xcode on a Mac → Archive
```

`capacitor.config.json` is already in this folder with the right appId.

## Verify counts

Open DevTools console on the app — it logs
`[hub] episodes: 157`. Or in PowerShell:

```powershell
Select-String -Path unstable-smp-hub\data\episodes.js -Pattern "S1_COUNT|TOTAL" | Select-Object -First 10
```
