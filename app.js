/* Unstable SMP Hub — views, progress, player. No build step, no accounts, no backend. */
(function () {
  "use strict";
  const APP_VER = "v25";
  const HUB = window.HUB || {};
  const EPISODES = HUB.EPISODES || [];
  const CREATORS = HUB.CREATORS || [];

  const $ = (s) => document.querySelector(s);
  const grid = $("#creatorGrid"), browse = $("#browseList"), upNext = $("#upNext");
  const playerWrap = $("#playerWrap"), meta = $("#watchMeta");

  let currentCreator = "";
  let currentEpId = null;

  /* ---- Store: watched state lives in localStorage on this device ---- */
  const Store = {
    key: "ushub-progress",
    read() { try { return JSON.parse(localStorage.getItem(this.key) || "{}"); } catch { return {}; } },
    write(map) { localStorage.setItem(this.key, JSON.stringify(map)); },
    isWatched(id) { return !!this.read()[id]; },
    toggle(id) { const m = this.read(); m[id] ? delete m[id] : (m[id] = 1); this.write(m); render(); },
    set(id, v) { const m = this.read(); v ? (m[id] = 1) : delete m[id]; this.write(m); render(); }
  };

  /* ---- Resume points: how many seconds into a video you got, so a
     half-watched episode opens where it stopped. Device-only, like the
     watched list — no account, no server. ---- */
  const POS_KEY = "ushub-pos";
  const Pos = {
    read() { try { return JSON.parse(localStorage.getItem(POS_KEY) || "{}"); } catch { return {}; } },
    get(id) { const p = this.read()[id]; return p && p.d > 0 && p.t >= 15 ? p : null; },
    set(id, t, d) {
      const m = this.read();
      if (!(t >= 15) || !(d > 0) || t >= d - 8) delete m[id];
      else m[id] = { t: Math.round(t), d: Math.round(d), at: Date.now() };
      try { localStorage.setItem(POS_KEY, JSON.stringify(m)); } catch {}
    },
    clear(id) { const m = this.read(); delete m[id]; try { localStorage.setItem(POS_KEY, JSON.stringify(m)); } catch {} }
  };

  /* Older saved progress used longer episode ids; remap those keys to the
     ids the catalogue uses now, so a device keeps its marks and resume points. */
  (function remapSavedIds() {
    const OLD = /^(.+)-([a-z]+)-(\d)-e(\d+)$/;
    for (const key of [Store.key, POS_KEY]) {
      let raw;
      try { raw = JSON.parse(localStorage.getItem(key) || "null"); } catch { continue; }
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
      let changed = false;
      const next = {};
      for (const [id, val] of Object.entries(raw)) {
        const m = id.match(OLD);
        const nid = m ? `${m[1]}-p${m[3]}-e${m[4]}` : id;
        if (nid !== id) changed = true;
        next[nid] = val;
      }
      if (changed) { try { localStorage.setItem(key, JSON.stringify(next)); } catch {} }
    }
  })();

  /* ---- Progress backup: the map lives in this browser only, so let
     people download it and load it back (new phone, cleared data). ---- */
  const EP_IDS = new Set(EPISODES.map((e) => e.id));
  function toast(msg) {
    const t = document.createElement("div");
    t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add("on"));
    setTimeout(() => { t.classList.remove("on"); setTimeout(() => t.remove(), 320); }, 2600);
  }
  window.hubToast = toast;
  function exportProgress() {
    const map = Store.read();
    const ids = Object.keys(map).filter((k) => EP_IDS.has(k) && map[k]);
    if (!ids.length) return toast("Nothing to back up yet — mark an episode watched first.");
    const payload = {
      app: "unstablesmp-hub", version: 1,
      exportedAt: new Date().toISOString(),
      progress: ids.reduce((o, k) => (o[k] = 1, o), {})
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "unstablesmp-hub-progress-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast("Backed up " + ids.length + " watched episode" + (ids.length === 1 ? "" : "s") + ".");
  }
  function importProgress(file) {
    const r = new FileReader();
    r.onload = () => {
      let data;
      try { data = JSON.parse(String(r.result)); } catch { return toast("That file isn't valid JSON."); }
      const src = (data && typeof data === "object" && (data.progress || data.episodes)) || data;
      if (!src || typeof src !== "object") return toast("No progress found in that file.");
      const map = Store.read();
      let added = 0, skipped = 0;
      for (const [k, v] of Object.entries(src)) {
        if (!EP_IDS.has(k)) { if (v) skipped++; continue; }
        if (v && !map[k]) { map[k] = 1; added++; }
      }
      Store.write(map); render();
      if (!added) return toast(skipped ? "Those episodes aren't in this catalogue." : "Already up to date — nothing new in that file.");
      toast("Restored " + added + " watched episode" + (added === 1 ? "" : "s") + (skipped ? " (" + skipped + " unknown skipped)" : "") + ".");
    };
    r.onerror = () => toast("Couldn't read that file.");
    r.readAsText(file);
  }

  function creatorEps(id) { return EPISODES.filter((e) => !id || e.creator === id); }
  function pctFor(id) {
    const list = creatorEps(id); if (!list.length) return 0;
    const m = Store.read(); const n = list.filter((e) => m[e.id]).length;
    return Math.round((n / list.length) * 100);
  }
  function overall() { return pctFor(""); }

  // Pinned 3D busts in skins/<id>-3d.webp + flat faces in skins/<id>.png.
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

  /* ---- Dashboard tiles ---- */
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

  /* ---- Browse list ---- */
  function epNum(ep) { return creatorEps(ep.creator).findIndex((e) => e.id === ep.id) + 1; }
  function epRow(ep) {
    const done = Store.isWatched(ep.id);
    const num = epNum(ep);
    const pos = Pos.get(ep.id);
    const pctPos = pos ? Math.min(99, Math.round((pos.t / pos.d) * 100)) : 0;
    const d = document.createElement("div");
    d.className = "ep" + (done ? " done" : "");
    const th = thumbFor(ep);
    d.innerHTML = `
      <span class="thumb">
        ${th ? `<img loading="lazy" src="${th}" alt="">` : `<div class="fallback-thumb" style="background:#1e293b;color:#94a3b8">E${num}</div>`}
        ${pctPos ? `<i class="epbar" aria-hidden="true"><b style="width:${pctPos}%"></b></i>` : ""}
      </span>
      <div class="t"><strong>${ep.title}</strong><small>${ep.creatorName} · E${num} · ${ep.duration}${pos ? ` · <em class="resume">▶ ${pctPos}%</em>` : ""}</small></div>
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

  /* ---- Watch view ---- */
  function orderedList() {
    return EPISODES.filter((e) => !currentCreator || e.creator === currentCreator);
  }
  /* Player: in-app YouTube embed first, rich YouTube handoff if a video
     refuses (Error 153 etc.). Bare file:// origins always get the handoff. */
  let ytApiState = 0; // 0 idle, 1 loading, 2 ready, 3 failed
  const ytApiQueue = [];
  let ytPlayer = null, posTimer = 0;
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
  /* Watch position: poll the player while it runs, and save on every state
     change (pause, end, buffering) plus when the tab is hidden or closed. */
  function savePos(id) {
    try {
      if (!ytPlayer || !ytPlayer.getCurrentTime || !ytPlayer.getDuration) return;
      const d = ytPlayer.getDuration();
      if (d > 0) Pos.set(id, ytPlayer.getCurrentTime(), d);
    } catch {}
  }
  function trackPos(id) {
    clearInterval(posTimer);
    posTimer = setInterval(() => savePos(id), 5000);
  }
  window.hubEnsureYT = ensureYTApi;
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
      showHandoff(ep, "Bare local files can't play embeds — serve this folder over http(s).");
    } else {
      playerWrap.innerHTML = `<div id="ytSlot"><p class="empty">Loading player…</p></div>`;
      ensureYTApi((ok) => {
        if (currentEpId !== id) return; // user moved on
        if (!ok) return showHandoff(ep);
        const slot = document.getElementById("ytSlot");
        if (!slot) return;
        const resume = Pos.get(id);
        try { if (ytPlayer && ytPlayer.destroy) ytPlayer.destroy(); } catch {}
        ytPlayer = new YT.Player(slot, {
          width: "100%", height: "100%", videoId: ep.youtubeId,
          playerVars: resume ? { rel: 0, start: resume.t } : { rel: 0 },
          events: {
            onReady: () => { trackPos(id); if (resume) toast("Resuming at " + Math.min(99, Math.round((resume.t / resume.d) * 100)) + "%."); },
            onError: () => { if (currentEpId === id) showHandoff(ep, "This video refused in-app playback."); },
            // state 0 = ENDED: clear the resume point, mark it watched, roll on.
            onStateChange: (ev) => {
              savePos(id);
              if (ev.data !== 0 || currentEpId !== id) return;
              Pos.clear(id);
              Store.set(id, true);
              const list = orderedList();
              const next = list[list.findIndex((e) => e.id === id) + 1];
              if (!next) return toast("That's the last episode in this list.");
              toast("Next up: " + next.title);
              setTimeout(() => { if (currentEpId === id) location.replace("#/w/" + next.id); }, 1200);
            }
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
    ["home", "creator", "watch", "world"].forEach((p) =>
      document.getElementById("page-" + p).classList.toggle("active", p === name));
    document.getElementById("backBtn").hidden = name === "home";
    window.scrollTo(0, 0);
  }
  function route() {
    const h = location.hash || "#/";
    let m = h.match(/^#\/c\/([\w-]+)/);
    if (m && CREATORS.some((c) => c.id === m[1])) {
      currentCreator = m[1];
      renderTiles(); renderCreatorHead(); renderBrowse();
      showPage("creator");
      return;
    }
    m = h.match(/^#\/w\/([\w-]+)/);
    if (m) {
      const ep = EPISODES.find((e) => e.id === m[1]);
      if (ep) {
        if (ep.creator !== currentCreator) currentCreator = ep.creator;
        openEpisode(ep.id);
        showPage("watch");
        return;
      }
    }
    if (/^#\/world/.test(h)) { showPage("world"); return; }
    currentCreator = "";
    renderTiles();
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
  $("#exportBtn").onclick = exportProgress;
  $("#importBtn").onclick = () => $("#importFile").click();
  $("#importFile").onchange = (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (f) importProgress(f);
  };
  // Coming back from the YouTube app with the episode still unwatched?
  // Pulse the Mark-watched button as a reminder.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && currentEpId) savePos(currentEpId);
    if (!document.hidden && currentEpId && !Store.isWatched(currentEpId)) {
      const b = $("#toggleWatched");
      b.classList.remove("pulse"); void b.offsetWidth; b.classList.add("pulse");
    }
  });

  // Refresh visible bits without rebuilding the player (never restart video).
  function render() {
    renderTiles();
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
  /* ---- Touch/hover polish: a ripple on press, so every button answers
     the finger even on devices with no hover at all. ---- */
  document.addEventListener("pointerdown", (e) => {
    const el = e.target.closest(".check,.tool,.wchip,.clip-add,.back,.creator,.wcard,.watch-controls button");
    if (!el || el.disabled) return;
    const r = el.getBoundingClientRect();
    const d = Math.max(r.width, r.height) * 1.6;
    const s = document.createElement("span");
    s.className = "ripple";
    s.style.width = s.style.height = d + "px";
    s.style.left = (e.clientX - r.left - d / 2) + "px";
    s.style.top = (e.clientY - r.top - d / 2) + "px";
    el.appendChild(s);
    setTimeout(() => s.remove(), 620);
  }, { passive: true });

  window.addEventListener("pagehide", () => { if (currentEpId) savePos(currentEpId); });
  window.addEventListener("beforeunload", () => { if (currentEpId) savePos(currentEpId); });

  try { const v = document.getElementById("appVer"); if (v) v.textContent = APP_VER; } catch {}
  window.addEventListener("load", route);
  route();
})();

/* ================= World guide: characters, factions, places, clips =================
   Content comes from data/world.js. Imported clips + their resume points live
   in localStorage, the same device-only deal as the watched list. */
(function () {
  "use strict";
  const W = (window.HUB && window.HUB.WORLD) || {};
  const BASE = [].concat(W.PEOPLE || [], W.FACTIONS || [], W.PLACES || []);
  const KIND_LABEL = { person: "Character", faction: "Faction", place: "Place", clip: "Clip" };

  const gridEl = document.getElementById("worldGrid");
  const chipsEl = document.getElementById("worldFilters");
  const formEl = document.getElementById("clipForm");
  const inputEl = document.getElementById("clipUrl");
  const sheet = document.getElementById("sheet");
  const sheetBody = document.getElementById("sheetBody");
  if (!gridEl || !chipsEl || !formEl || !sheet || !sheetBody) return;

  const CLIP_KEY = "ushub-clips", POS_KEY = "ushub-pos";
  const readJSON = (k, f) => { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? f : v; } catch { return f; } };
  const writeJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const clips = () => readJSON(CLIP_KEY, []);
  const posOf = (id) => { const p = readJSON(POS_KEY, {})[id]; return p && p.d > 0 ? p : null; };
  const note = (m) => { if (window.hubToast) window.hubToast(m); };
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const thumb = (yt) => "https://i.ytimg.com/vi/" + yt + "/hqdefault.jpg";

  let filter = "all";
  let sheetClip = null, sheetPlayer = null, sheetTimer = 0, hideTimer = 0;

  function ytId(value) {
    const s = String(value || "").trim();
    const m = s.match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{11})/);
    if (m) return m[1];
    return /^[A-Za-z0-9_-]{11}$/.test(s) ? s : null;
  }

  function items() {
    const out = BASE.map((x) => x);
    for (const c of clips()) {
      out.push({ id: c.id, kind: "clip", name: c.title, yt: c.yt, color: "#f43f5e", tags: ["Imported"] });
    }
    return out;
  }

  function media(it) {
    if (it.kind === "clip") {
      return '<span class="wmedia"><img loading="lazy" src="' + thumb(it.yt) + '" alt=""><span class="wplay">▶</span></span>';
    }
    if (it.art) return '<span class="wmedia"><img loading="lazy" src="' + esc(it.art) + '" alt=""></span>';
    // Monogram covers everyone without art: no dependence on a skin CDN, and
    // no wrong-face problem when a username does not resolve.
    const letters = String(it.name || "?").replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase();
    return '<span class="wmedia"><span class="wglyph">' + esc(it.glyph || letters || "✦") + '</span></span>';
  }

  function card(it) {
    const pos = it.kind === "clip" ? posOf(it.id) : null;
    const pct = pos ? Math.min(99, Math.round((pos.t / pos.d) * 100)) : 0;
    const sub = it.kind === "clip"
      ? (pct ? pct + "% watched" : "Imported clip")
      : (it.role || (it.tags && it.tags[0]) || KIND_LABEL[it.kind]);
    return '<button class="wcard" data-id="' + esc(it.id) + '" data-kind="' + it.kind +
      '" style="--c:' + esc(it.color || "#8b5cf6") + '">' + media(it) +
      '<span class="wbody"><span class="wkind">' + KIND_LABEL[it.kind] + '</span>' +
      '<strong class="wname">' + esc(it.name) + '</strong>' +
      '<span class="wrole">' + esc(sub) + '</span>' +
      (pct ? '<i class="wbar"><b style="width:' + pct + '%"></b></i>' : '') +
      '</span></button>';
  }

  function render() {
    const list = items().filter((it) => filter === "all" || it.kind === filter);
    render.reset && render.reset();
    if (!list.length) {
      gridEl.innerHTML = '<p class="world-empty">' +
        (filter === "clip" ? "No clips yet — paste a YouTube link above and it lands here." : "Nothing here yet.") + '</p>';
      return;
    }
    gridEl.innerHTML = list.map(card).join("");
  }

  function applyFilter(kind) {
    filter = kind;
    for (const b of chipsEl.querySelectorAll(".wchip")) {
      const on = b.dataset.kind === kind;
      b.classList.toggle("on", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    }
    formEl.hidden = kind !== "clip";
    render();
  }

  /* ---- Sheet ---- */
  function saveSheetPos() {
    if (!sheetClip || !sheetPlayer || !sheetPlayer.getCurrentTime) return;
    try {
      const d = sheetPlayer.getDuration(), t = sheetPlayer.getCurrentTime();
      if (!(d > 0)) return;
      const m = readJSON(POS_KEY, {});
      if (t >= 15 && t < d - 8) m[sheetClip.id] = { t: Math.round(t), d: Math.round(d), at: Date.now() };
      else if (t >= d - 8) delete m[sheetClip.id];
      writeJSON(POS_KEY, m);
    } catch {}
  }
  function stopSheetPlayer() {
    clearInterval(sheetTimer);
    try { if (sheetPlayer && sheetPlayer.destroy) sheetPlayer.destroy(); } catch {}
    sheetPlayer = null;
  }
  function mountSheetPlayer(it, pos) {
    const slot = document.getElementById("sheetPlayer");
    if (!slot) return;
    const fallback = function () {
      slot.innerHTML = '<a class="watch-yt" href="https://www.youtube.com/watch?v=' + it.yt + '" target="_blank" rel="noopener">Watch on YouTube</a>';
    };
    if (!window.hubEnsureYT) return fallback();
    window.hubEnsureYT(function (ok) {
      if (!ok || sheet.hidden || sheetClip !== it) return fallback();
      slot.innerHTML = "";
      try {
        sheetPlayer = new YT.Player(slot, {
          width: "100%", height: "100%", videoId: it.yt,
          playerVars: pos ? { rel: 0, start: pos.t } : { rel: 0 },
          events: {
            onReady: function () { clearInterval(sheetTimer); sheetTimer = setInterval(saveSheetPos, 5000); },
            onStateChange: function (ev) {
              saveSheetPos();
              if (ev.data !== 0) return;
              const m = readJSON(POS_KEY, {});
              delete m[it.id];
              writeJSON(POS_KEY, m);
              render();
            }
          }
        });
      } catch { fallback(); }
    });
  }
  function closeSheet() {
    saveSheetPos();
    stopSheetPlayer();
    sheetClip = null;
    sheet.classList.remove("open");
    document.body.classList.remove("sheet-open");
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () { sheet.hidden = true; sheetBody.innerHTML = ""; }, 220);
  }
  function openSheet(it) {
    clearTimeout(hideTimer);
    stopSheetPlayer();
    sheetClip = it.kind === "clip" ? it : null;
    const pos = it.kind === "clip" ? posOf(it.id) : null;
    const head = '<div class="sheet-head" style="--c:' + esc(it.color || "#8b5cf6") + '">' +
      '<span class="wkind">' + KIND_LABEL[it.kind] + '</span>' +
      '<h2 id="sheetTitle">' + esc(it.name) + '</h2>' +
      (it.role ? '<p class="sheet-role">' + esc(it.role) + '</p>' : '') + '</div>';

    if (it.kind === "clip") {
      sheetBody.innerHTML = head +
        '<div class="sheet-player" id="sheetPlayer"><p class="empty">Loading player…</p></div>' +
        '<p class="sheet-line">' + (pos ? "You're " + Math.min(99, Math.round((pos.t / pos.d) * 100)) + '% in — it carries on from there.' : 'Play it here and this page remembers where you stopped.') + '</p>' +
        '<div class="sheet-actions"><a class="btn-ghost" href="https://www.youtube.com/watch?v=' + it.yt + '" target="_blank" rel="noopener">Open on YouTube</a>' +
        '<button class="btn-danger" id="clipRemove" type="button">Remove clip</button></div>';
      document.getElementById("clipRemove").onclick = function () {
        writeJSON(CLIP_KEY, clips().filter((c) => c.id !== it.id));
        const m = readJSON(POS_KEY, {});
        delete m[it.id];
        writeJSON(POS_KEY, m);
        closeSheet();
        applyFilter("clip");
        note("Clip removed.");
      };
    } else {
      sheetBody.innerHTML = head +
        (it.art ? '<img class="sheet-art" loading="lazy" src="' + esc(it.art) + '" alt="">' : '') +
        '<p class="sheet-blurb">' + esc(it.blurb) + '</p>' +
        '<div class="sheet-tags">' + (it.tags || []).map((t) => '<span class="wtag">' + esc(t) + '</span>').join("") + '</div>';
    }

    sheet.hidden = false;
    document.body.classList.add("sheet-open");
    requestAnimationFrame(function () { sheet.classList.add("open"); });
    if (it.kind === "clip") mountSheetPlayer(it, pos);
  }

  /* ---- Home page lists: side characters, places and factions reuse the
     world cards, so tapping one opens the same detail sheet. ---- */
  const homeEl = document.getElementById("page-home");
  const HOME_LISTS = [
    ["homePeople", W.PEOPLE || []],
    ["homePlaces", W.PLACES || []],
    ["homeFactions", W.FACTIONS || []]
  ];
  function renderHome() {
    for (const [id, list] of HOME_LISTS) {
      const el = document.getElementById(id);
      if (el) el.innerHTML = list.map(card).join("");
    }
  }
  if (homeEl) homeEl.addEventListener("click", (e) => {
    const c = e.target.closest(".wcard");
    if (!c) return;
    const it = BASE.find((x) => x.id === c.dataset.id);
    if (it) openSheet(it);
  });

  /* ---- Events ---- */
  chipsEl.addEventListener("click", (e) => {
    const b = e.target.closest(".wchip");
    if (b) applyFilter(b.dataset.kind);
  });
  gridEl.addEventListener("click", (e) => {
    const c = e.target.closest(".wcard");
    if (!c) return;
    const it = items().find((x) => x.id === c.dataset.id);
    if (it) openSheet(it);
  });
  // Pointer-light: the highlight follows the cursor, and on hover-capable
  // devices the card leans a few degrees towards it.
  function wirePointer(root) {
    root.addEventListener("pointermove", (e) => {
      const c = e.target.closest(".wcard");
      if (!c) return;
      const r = c.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
      c.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      if (window.matchMedia("(hover:hover) and (pointer:fine)").matches) {
        c.style.setProperty("--rx", ((0.5 - y) * 6).toFixed(2) + "deg");
        c.style.setProperty("--ry", ((x - 0.5) * 6).toFixed(2) + "deg");
      }
    }, { passive: true });
    root.addEventListener("pointerleave", () => {
      for (const c of root.querySelectorAll(".wcard")) {
        c.style.setProperty("--rx", "0deg");
        c.style.setProperty("--ry", "0deg");
      }
    }, true);
  }
  wirePointer(gridEl);
  if (homeEl) wirePointer(homeEl);

  sheet.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeSheet(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !sheet.hidden) closeSheet(); });

  formEl.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = ytId(inputEl.value);
    if (!id) { note("That doesn't look like a YouTube link."); inputEl.focus(); return; }
    const list = clips();
    if (list.some((c) => c.yt === id)) { note("That clip is already imported."); return; }
    const entry = { id: "clip-" + id, yt: id, title: "Imported clip", addedAt: Date.now() };
    list.unshift(entry);
    writeJSON(CLIP_KEY, list);
    inputEl.value = "";
    applyFilter("clip");
    note("Clip imported.");
    // If YouTube lets us read the oEmbed title, use it; otherwise keep the label.
    fetch("https://www.youtube.com/oembed?format=json&url=" + encodeURIComponent("https://youtu.be/" + id))
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j || !j.title) return;
        writeJSON(CLIP_KEY, clips().map((c) => (c.id === entry.id ? Object.assign({}, c, { title: j.title }) : c)));
        render();
      })
      .catch(() => {});
  });

  window.addEventListener("hashchange", () => { if (location.hash.indexOf("#/world") === 0) render(); });
  renderHome();
  applyFilter("all");
})();
