/* Unstable SMP Hub — views, progress, auth, player. No build step. */
(function () {
  "use strict";
  const APP_VER = "v19";
  const HUB = window.HUB || {};
  const EPISODES = HUB.EPISODES || [];
  const CREATORS = HUB.CREATORS || [];
  const CFG = window.HUB_CONFIG || { GOOGLE_CLIENT_ID: "", CHANNELS: {} };

  const $ = (s) => document.querySelector(s);
  const grid = $("#creatorGrid"), browse = $("#browseList"), upNext = $("#upNext");
  const playerWrap = $("#playerWrap"), meta = $("#watchMeta");

  let currentCreator = "";
  let currentEpId = null;

  /* ---- Store: per-user namespaced localStorage ---- */
  const Store = {
    user: null, // {email,name,picture} or null (guest)
    key() { return this.user && this.user.email ? `ushub-progress-${this.user.email}` : "ushub-progress-guest"; },
    read() { try { return JSON.parse(localStorage.getItem(this.key()) || "{}"); } catch { return {}; } },
    write(map) { localStorage.setItem(this.key(), JSON.stringify(map)); },
    isWatched(id) { return !!this.read()[id]; },
    toggle(id) { const m = this.read(); m[id] ? delete m[id] : (m[id] = 1); this.write(m); render(); },
    set(id, v) { const m = this.read(); v ? (m[id] = 1) : delete m[id]; this.write(m); render(); }
  };

  function creatorEps(id) { return EPISODES.filter((e) => !id || e.creator === id); }
  function pctFor(id) {
    const list = creatorEps(id); if (!list.length) return 0;
    const m = Store.read(); const n = list.filter((e) => m[e.id]).length;
    return Math.round((n / list.length) * 100);
  }
  function overall() { return pctFor(""); }

  // Pinned 3D busts in skins/<id>-3d.webp + flat faces in skins/<id>.png
  // (exact Mojang textures, see tools/fetch-skins.ps1).
  // Live render APIs are fallback only, so tiles never depend on CDN freshness.
  const MC_USERNAMES = { wemmbu: "Wemmbu", flamefrags: "FlameFrags", parrotx2: "ParrotX2", spokeishere: "SpokeIsHere" };
  function skinURL(c, h) {
    const u = MC_USERNAMES[c.id] || c.name;
    if (h === 0) return `skins/${encodeURIComponent(c.id)}-3d.webp`;
    if (h === 1) return `skins/${encodeURIComponent(c.id)}.png`;
    if (h === 2) return `https://mc-heads.net/head/${encodeURIComponent(u)}/100`;
    return `https://minotar.net/helm/${encodeURIComponent(u)}/100.png`;
  }
  // Image fallback chain for tiles: steps through data-srcs on each error.
  window.hubImgFb = function (img) {
    const list = (img.dataset.srcs || "").split("|").filter(Boolean);
    const n = +(img.dataset.fb || 0) + 1;
    img.dataset.fb = n;
    if (n < list.length) { img.src = list[n]; }
    else { img.style.display = "none"; img.nextElementSibling.style.display = "block"; }
  };
  function thumbFor(ep) {
    return ep.youtubeId ? `https://i.ytimg.com/vi/${ep.youtubeId}/hqdefault.jpg` : null;
  }
  function ytLink(ep) {
    if (ep.youtubeId) return `https://www.youtube.com/watch?v=${ep.youtubeId}`;
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(ep.title + " Unstable SMP " + ep.creatorName)}`;
  }

  /* ---- Dashboard tiles: 4 large animated squares ---- */
  function renderTiles() {
    grid.innerHTML = "";
    for (const c of CREATORS) {
      const pct = pctFor(c.id);
      const b = document.createElement("button");
      b.className = "creator";
      b.style.setProperty("--c", c.color);
      b.style.setProperty("--p", pct);
      b.setAttribute("aria-label", `${c.name}, ${pct}% watched`);
      const srcs = [skinURL(c, 0), skinURL(c, 1), skinURL(c, 2), skinURL(c, 3)];
      b.innerHTML = `
        <span class="creator-inner">
          <span class="mc-wrap">
            <img class="mc" loading="lazy" src="${srcs[0]}" data-fb="0" data-srcs="${srcs.join("|")}" alt="${c.name} Minecraft character" onerror="hubImgFb(this)">
            <span class="steve" style="display:none"></span>
          </span>
          <strong>${c.name}</strong>
          <span class="count">${creatorEps(c.id).length} eps</span>
          <span class="pct">${pct}%</span>
        </span>`;
      b.onclick = () => { location.hash = "#/c/" + c.id; };
      grid.appendChild(b);
    }
    $("#overallBar").style.width = overall() + "%";
    $("#overallLabel").textContent = `${overall()}% watched (${Object.keys(Store.read()).length}/${EPISODES.length})`;
    if (HUB.STATS) $("#countsLine").textContent = `${HUB.STATS.total} episodes`;
  }

  /* ---- Browse list (no seasons: creator-wide numbering) ---- */
  function epNum(ep) { return creatorEps(ep.creator).findIndex((e) => e.id === ep.id) + 1; }
  function epRow(ep) {
    const done = Store.isWatched(ep.id);
    const num = epNum(ep);
    const d = document.createElement("div");
    d.className = "ep" + (done ? " done" : "");
    const th = thumbFor(ep);
    d.innerHTML = `
      ${th ? `<img loading="lazy" src="${th}" alt="">` : `<div class="fallback-thumb" style="background:#1e293b;color:#94a3b8">E${num}</div>`}
      <div class="t"><strong>${ep.title}</strong><small>${ep.creatorName} · E${num} · ${ep.duration}</small></div>
      <span class="badge">${done ? "✓ watched" : "E" + num}</span>
      <button class="check">${done ? "Uncheck" : "✓"}</button>`;
    d.querySelector(".check").onclick = (ev) => { ev.stopPropagation(); Store.toggle(ep.id); };
    d.onclick = () => { location.hash = "#/w/" + ep.id; };
    return d;
  }

  function renderBrowse() {
    const q = ($("#csearch").value || "").toLowerCase();
    browse.innerHTML = "";
    const list = EPISODES.filter((e) =>
      e.creator === currentCreator &&
      (!q || (e.title + e.arc + e.creatorName).toLowerCase().includes(q)));
    const head = document.createElement("p");
    head.style.color = "#9aa6c7";
    const c = CREATORS.find((x) => x.id === currentCreator);
    head.textContent = `${list.length} episodes — ${c ? c.name : ""}`;
    browse.appendChild(head);
    for (const ep of list.slice(0, 400)) browse.appendChild(epRow(ep));
  }

  function renderCreatorHead() {
    const c = CREATORS.find((x) => x.id === currentCreator);
    const el = $("#creatorHead");
    if (!c) { el.innerHTML = ""; return; }
    const pct = pctFor(c.id);
    el.innerHTML = `
      <img class="mc" loading="lazy" src="${skinURL(c, 0)}" alt="${c.name} Minecraft character" onerror="hubImgFb(this)" data-fb="0" data-srcs="${[skinURL(c, 0), skinURL(c, 1), skinURL(c, 2), skinURL(c, 3)].join("|")}">
      <div><strong>${c.name}</strong><small>${creatorEps(c.id).length} episodes · ${pct}% watched</small>
      <div class="bar"><div class="fill" style="width:${pct}%"></div></div></div>`;
  }

  /* ---- Watch view with prev/next ---- */
  function orderedList() {
    return EPISODES.filter((e) => !currentCreator || e.creator === currentCreator);
  }
  /* ---- Player: in-app YouTube embed first (works on any http(s) host —
     all pinned IDs verified cueing fine on a real origin), rich YouTube
     handoff fallback if a video ever refuses (Error 153 etc.).
     NOTE: file:// origins get 153s from YouTube itself; always judge
     playback on a hosted build, never on a bare local file. */
  let ytApiState = 0; // 0 idle, 1 loading, 2 ready, 3 failed
  const ytApiQueue = [];
  function ensureYTApi(cb) {
    if (ytApiState === 2) return cb(true);
    if (ytApiState === 3) return cb(false);
    ytApiQueue.push(cb);
    if (ytApiState === 1) return;
    ytApiState = 1;
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.onerror = () => { ytApiState = 3; ytApiQueue.splice(0).forEach((f) => f(false)); };
    document.head.appendChild(s);
    const iv = setInterval(() => {
      if (window.YT && YT.Player) { clearInterval(iv); ytApiState = 2; ytApiQueue.splice(0).forEach((f) => f(true)); }
    }, 250);
    setTimeout(() => {
      if (ytApiState === 1) { clearInterval(iv); ytApiState = 3; ytApiQueue.splice(0).forEach((f) => f(false)); }
    }, 12000);
  }
  function showHandoff(ep, why) {
    const thumb = ep.youtubeId ? `https://i.ytimg.com/vi/${ep.youtubeId}/hqdefault.jpg` : "";
    playerWrap.innerHTML = `<div class="noembed">
      ${thumb ? `<img class="noembed-bg" loading="lazy" src="${thumb}" alt="">` : ""}
      <div class="noembed-shade"></div>
      <div class="noembed-fg">
        <a class="noembed-play" href="${ytLink(ep)}" target="_blank" rel="noopener" aria-label="Play on YouTube">▶</a>
        <p>${why || (ep.youtubeId ? "Tap play to watch in the YouTube app." : "No direct video linked for this episode yet.")}</p>
        <a class="watch-yt" href="${ytLink(ep)}" target="_blank" rel="noopener">Watch on YouTube</a>
      </div>
    </div>`;
  }
  function openEpisode(id) {
    currentEpId = id;
    const ep = EPISODES.find((e) => e.id === id);
    if (!ep) return;
    if (currentCreator && ep.creator !== currentCreator) currentCreator = ep.creator;
    if (!ep.youtubeId) {
      showHandoff(ep);
    } else if (location.protocol === "file:") {
      // YouTube answers file:// origins with Error 153, always. Say so
      // instead of flashing a doomed player.
      showHandoff(ep, "Bare local files can't play embeds — run Start-Hub.bat or serve this folder over http(s).");
    } else {
      playerWrap.innerHTML = `<div id="ytSlot"><p class="empty">Loading player…</p></div>`;
      ensureYTApi((ok) => {
        if (currentEpId !== id) return; // user moved on
        if (!ok) return showHandoff(ep);
        const slot = document.getElementById("ytSlot");
        if (!slot) return;
        new YT.Player(slot, {
          width: "100%", height: "100%", videoId: ep.youtubeId,
          playerVars: { rel: 0 },
          events: {
            onError: () => { if (currentEpId === id) showHandoff(ep, "This video refused in-app playback."); }
          }
        });
      });
    }
    meta.innerHTML = `<strong style="color:#eef2ff">${ep.title}</strong><br>${ep.creatorName} · E${epNum(ep)} · ${ep.duration} · <a href="${ytLink(ep)}" target="_blank" rel="noopener" style="color:#38bdf8">Open on YouTube</a>`;
    $("#toggleWatched").textContent = Store.isWatched(id) ? "✓ Watched (tap to uncheck)" : "Mark watched";
    upNext.innerHTML = "";
    const list = orderedList();
    const i = list.findIndex((e) => e.id === id);
    for (const n of list.slice(i + 1, i + 6)) upNext.appendChild(epRow(n));
    renderTiles();
  }

  function step(dir) {
    const list = orderedList();
    let i = list.findIndex((e) => e.id === currentEpId);
    if (i < 0) i = 0; else i = Math.min(list.length - 1, Math.max(0, i + dir));
    if (list[i]) location.replace("#/w/" + list[i].id);
  }

  /* ---- Hash router: home <-> creator page <-> watch page ---- */
  function showPage(name) {
    ["home", "creator", "watch"].forEach((p) =>
      document.getElementById("page-" + p).classList.toggle("active", p === name));
    document.getElementById("backBtn").hidden = name === "home";
    window.scrollTo(0, 0);
  }
  function route() {
    const h = location.hash || "#/";
    let m = h.match(/^#\/c\/([\w-]+)/);
    if (m && CREATORS.some((c) => c.id === m[1])) {
      currentCreator = m[1];
      renderTiles(); renderCreatorHead(); renderBrowse(); renderAuth();
      showPage("creator");
      return;
    }
    m = h.match(/^#\/w\/([\w-]+)/);
    if (m) {
      const ep = EPISODES.find((e) => e.id === m[1]);
      if (ep) {
        if (ep.creator !== currentCreator) currentCreator = ep.creator;
        openEpisode(ep.id);
        renderAuth();
        showPage("watch");
        return;
      }
    }
    currentCreator = "";
    renderTiles(); renderAuth();
    showPage("home");
  }

  /* ---- Controls ---- */
  $("#csearch").oninput = () => { renderCreatorHead(); renderBrowse(); };
  document.getElementById("backBtn").onclick = () => {
    if (history.length > 1) history.back();
    else location.hash = "#/";
  };
  window.addEventListener("hashchange", route);
  $("#prevBtn").onclick = () => step(-1); $("#nextBtn").onclick = () => step(1);
  $("#toggleWatched").onclick = () => { if (currentEpId) Store.set(currentEpId, !Store.isWatched(currentEpId)); };
  // Coming back from the YouTube app with the episode still unwatched?
  // Pulse the Mark-watched button as a reminder.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && currentEpId && !Store.isWatched(currentEpId)) {
      const b = $("#toggleWatched");
      b.classList.remove("pulse"); void b.offsetWidth; b.classList.add("pulse");
    }
  });

  /* ---- Google Sign-In (GIS, guest fallback) ---- */
  function renderAuth() {
    const a = $("#authArea");
    if (Store.user) {
      a.innerHTML = `<div class="userchip"><img src="${Store.user.picture || ""}" alt="" onerror="this.remove()"><span>${Store.user.name || Store.user.email}</span><button class="guest" id="signOut">Sign out</button></div>`;
      $("#signOut").onclick = () => { Store.user = null; localStorage.removeItem("ushub-user"); render(); initGIS(); };
    } else {
      a.innerHTML = `<button class="guest" id="guestBadge">Guest</button>`;
    }
  }
  function initGIS() {
    renderAuth();
    const slot = $("#gisButton"); if (!slot) return; slot.innerHTML = "";
    try {
      const saved = JSON.parse(localStorage.getItem("ushub-user") || "null");
      if (saved && saved.email) { Store.user = saved; renderAuth(); }
    } catch {}
    if (!CFG.GOOGLE_CLIENT_ID || !window.google || !google.accounts) {
      slot.innerHTML = `<small style="color:#9aa6c7">${CFG.GOOGLE_CLIENT_ID ? "Loading Google button…" : "Add GOOGLE_CLIENT_ID in config.js for sync"}</small>`;
      return;
    }
    google.accounts.id.initialize({
      client_id: CFG.GOOGLE_CLIENT_ID, callback: (resp) => {
        try {
          const p = JSON.parse(atob(resp.credential.split(".")[1]));
          Store.user = { email: p.email, name: p.name || p.email, picture: p.picture };
          localStorage.setItem("ushub-user", JSON.stringify(Store.user));
        } catch { Store.user = { email: "google-user", name: "Google user" }; }
        render();
      }
    });
    google.accounts.id.renderButton(slot, { theme: "outline", size: "large", text: "signin_with" });
  }

  // Refresh visible bits without rebuilding the player (never restart video).
  function render() {
    renderTiles(); renderAuth();
    const active = (document.querySelector(".page.active") || {}).id;
    if (active === "page-creator") { renderCreatorHead(); renderBrowse(); }
    if (active === "page-watch" && currentEpId) {
      $("#toggleWatched").textContent = Store.isWatched(currentEpId) ? "✓ Watched (tap to uncheck)" : "Mark watched";
      const list = orderedList();
      const i = list.findIndex((e) => e.id === currentEpId);
      upNext.innerHTML = "";
      for (const n of list.slice(i + 1, i + 6)) upNext.appendChild(epRow(n));
    }
  }
  try { const v = document.getElementById("appVer"); if (v) v.textContent = APP_VER; } catch {}
  window.addEventListener("load", () => { initGIS(); route(); });
  route(); initGIS();
})();
