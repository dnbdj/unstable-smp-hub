# iOS build (no Mac needed)

Pushing anything under `ios/` (or the workflow itself) builds an
**unsigned** `.ipa` on GitHub's free Mac runners and attaches it to the
`ios` release. No Apple Developer account required — but Apple only lets
unsigned apps install via sideloading:

## Install on your iPhone (free Apple ID)

**AltStore (no cable after setup):**

1. PC: install AltServer (altstore.io), connect iPhone over USB once,
   install AltStore with your Apple ID.
2. Same Wi-Fi from then on. Download `browser-ios.ipa` from the
   `ios` release on your phone.
3. Open with AltStore → installs. Refreshes itself over Wi-Fi
   (free IDs expire weekly; AltStore auto-refreshes).

**Sideloadly (USB cable):**

1. PC: install Sideloadly, plug in iPhone, sign in with Apple ID.
2. Drag `browser-ios.ipa` in → installs.

Both re-sign the app with *your* free Apple ID on install — that step
can't be done in the cloud, which is why there's no direct-install link.
