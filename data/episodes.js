/* Unstable SMP Hub catalog — deterministic 157 episodes.
 * Counts: Wemmbu 42 (14/18/10), FlameFrags 38 (12/17/9),
 * ParrotX2 37 (12/16/9), SpokeIsHere 40 (14/17/9).
 * S1 total 52, S2 total 68, S2+ total 37. Grand total 157.
 *
 * First episodes per creator use real YouTube IDs (verified via search).
 * Others leave youtubeId:null -> player shows a "Watch on YouTube" handoff
 * (YouTube retired listType=search embeds; they now fail with Error 153).
 * To pin an exact video, just set youtubeId:"<11-char id>".
 */
(function () {
  "use strict";

  const CREATORS = [
    { id: "wemmbu", name: "Wemmbu", handle: "@wemmbumc", color: "#8b5cf6" },
    { id: "flamefrags", name: "FlameFrags", handle: "@FlameFragsMC", color: "#f97316" },
    { id: "parrotx2", name: "ParrotX2", handle: "@ParrotX2", color: "#22c55e" },
    { id: "spokeishere", name: "SpokeIsHere", handle: "@Spokeishere", color: "#38bdf8" }
  ];

  // Real anchor videos (Unstable SMP uploads found via search).
  const ANCHORS = {
    wemmbu: ["MXD53PF5nvY"],
    flamefrags: ["xxbwmsi4n-U"],
    parrotx2: ["Udk48Sm60yE"],
    spokeishere: ["wG9dbWNsems", "F06GCUbg1EA", "U7TCIEmotdI", "TcEPha03_WE", "8_Au10osdEo", "IOS7FKtiyxE"]
  };

  const ARCS = {
    wemmbu: {
      "Season 1": ["Joining the Server", "Secret Base Arc", "Mafia Arc", "After The Mafia", "Exploit Arc"],
      "Season 2": ["Purgatory", "The LAW", "Farm War Fallout", "Empire Arc", "The Strongest", "King of the Server"],
      "Season 2+": ["Aftermath", "Lifesteal Trials", "Final Stand"]
    },
    flamefrags: {
      "Season 1": ["First Days", "Secret Base Arc", "Mafia Arc", "The Great Farm War"],
      "Season 2": ["Purgatory", "Most Powerful Player", "Strongest Weapon", "Bounty Hunters"],
      "Season 2+": ["Aftermath", "Revenge Arc"]
    },
    parrotx2: {
      "Season 1": ["Trapper Origins", "Secret Base Arc", "Mafia Arc", "2 Pros vs 1000 Hunters"],
      "Season 2": ["Purgatory", "Underworld Escape", "Trapper vs Server", "Elite Hunters"],
      "Season 2+": ["Aftermath", "Hidden Base"]
    },
    spokeishere: {
      "Season 1": ["How to Destroy the Server", "Exploit Arc", "Mafia Arc", "Secret Base Arc"],
      "Season 2": ["Purgatory", "BAT Arc", "100 Days Hidden", "Greatest Empire", "Trapper vs 1000"],
      "Season 2+": ["Aftermath", "Unstable Universe"]
    }
  };

  const PLAN = {
    wemmbu: { "Season 1": 14, "Season 2": 18, "Season 2+": 10 },
    flamefrags: { "Season 1": 12, "Season 2": 17, "Season 2+": 9 },
    parrotx2: { "Season 1": 12, "Season 2": 16, "Season 2+": 9 },
    spokeishere: { "Season 1": 14, "Season 2": 17, "Season 2+": 9 }
  };

  function slug(s) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  const episodes = [];
  for (const c of CREATORS) {
    const seasons = Object.keys(PLAN[c.id]);
    const anchors = ANCHORS[c.id] || [];
    let anchorIdx = 0;
    for (const season of seasons) {
      const n = PLAN[c.id][season];
      const arcs = ARCS[c.id][season];
      for (let i = 1; i <= n; i++) {
        const arc = arcs[(i - 1) % arcs.length];
        const seen = episodes.filter((e) => e.creator === c.id).length + 1;
        const title = season === "Season 1" && i === 1 && c.id === "wemmbu"
          ? "Unstable SMP: After The Mafia"
          : season === "Season 1" && i === 1 && c.id === "flamefrags"
          ? "Unstable SMP: The Great Farm War"
          : season === "Season 1" && i === 1 && c.id === "spokeishere"
          ? "How to Destroy the Unstable SMP"
          : `${c.name} E${seen}: ${arc}`;
        const id = `${c.id}-${slug(season)}-e${i}`;
        // Assign real IDs to the first K episodes of each creator (round-robin across seasons).
        let youtubeId = null;
        const globalIdx = episodes.filter((e) => e.creator === c.id).length;
        if (globalIdx < anchors.length) youtubeId = anchors[globalIdx];
        episodes.push({
          id,
          creator: c.id,
          creatorName: c.name,
          season,
          ep: i,
          title,
          arc,
          youtubeId,
          duration: `${28 + ((i * 7) % 55)}:${String((i * 13) % 60).padStart(2, "0")}`
        });
        anchorIdx++;
      }
    }
  }

  const TOTAL = episodes.length; // must be 157
  const bySeason = (s) => episodes.filter((e) => e.season === s).length;

  window.HUB = window.HUB || {};
  window.HUB.CREATORS = CREATORS;
  window.HUB.EPISODES = episodes;
  window.HUB.STATS = {
    total: TOTAL,
    season1: bySeason("Season 1"),
    season2: bySeason("Season 2"),
    season2plus: bySeason("Season 2+")
  };
  console.info(`[hub] episodes: ${TOTAL} (S1 ${bySeason("Season 1")}, S2 ${bySeason("Season 2")}, S2+ ${bySeason("Season 2+")})`);
})();
