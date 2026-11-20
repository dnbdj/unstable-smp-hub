/* Unstable SMP Hub catalog — deterministic 157 episodes.
 * Counts: Wemmbu 42 (14/18/10), FlameFrags 38 (12/17/9),
 * ParrotX2 37 (12/16/9), SpokeIsHere 40 (14/17/9). Grand total 157.
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
    { id: "spokeishere", name: "SpokeIsHere", handle: "@SpokeIshere", color: "#38bdf8" }
  ];

  // Real anchor videos (Unstable SMP uploads found via search).
  const ANCHORS = {
    wemmbu: ["MXD53PF5nvY"],
    flamefrags: ["xxbwmsi4n-U"],
    parrotx2: ["Udk48Sm60yE"],
    spokeishere: ["wG9dbWNsems", "F06GCUbg1EA", "U7TCIEmotdI", "TcEPha03_WE", "8_Au10osdEo", "IOS7FKtiyxE"]
  };

  // Episode counts per creator, in order.
  const PLAN = {
    wemmbu: [14, 18, 10],
    flamefrags: [12, 17, 9],
    parrotx2: [12, 16, 9],
    spokeishere: [14, 17, 9]
  };

  const ARCS = {
    wemmbu: [
      ["Joining the Server", "Secret Base Arc", "Mafia Arc", "After The Mafia", "Exploit Arc"],
      ["Purgatory", "The LAW", "Farm War Fallout", "Empire Arc", "The Strongest", "King of the Server"],
      ["Aftermath", "Lifesteal Trials", "Final Stand"]
    ],
    flamefrags: [
      ["First Days", "Secret Base Arc", "Mafia Arc", "The Great Farm War"],
      ["Purgatory", "Most Powerful Player", "Strongest Weapon", "Bounty Hunters"],
      ["Aftermath", "Revenge Arc"]
    ],
    parrotx2: [
      ["Trapper Origins", "Secret Base Arc", "Mafia Arc", "2 Pros vs 1000 Hunters"],
      ["Purgatory", "Underworld Escape", "Trapper vs Server", "Elite Hunters"],
      ["Aftermath", "Hidden Base"]
    ],
    spokeishere: [
      ["How to Destroy the Server", "Exploit Arc", "Mafia Arc", "Secret Base Arc"],
      ["Purgatory", "BAT Arc", "100 Days Hidden", "Greatest Empire", "Trapper vs 1000"],
      ["Aftermath", "Unstable Universe"]
    ]
  };

  const episodes = [];
  for (const c of CREATORS) {
    const anchors = ANCHORS[c.id] || [];
    const plan = PLAN[c.id], arcsByPart = ARCS[c.id];
    for (let p = 0; p < plan.length; p++) {
      const arcs = arcsByPart[p];
      for (let i = 1; i <= plan[p]; i++) {
        const arc = arcs[(i - 1) % arcs.length];
        const seen = episodes.filter((e) => e.creator === c.id).length + 1;
        const title = p === 0 && i === 1 && c.id === "wemmbu"
          ? "Unstable SMP: After The Mafia"
          : p === 0 && i === 1 && c.id === "flamefrags"
          ? "Unstable SMP: The Great Farm War"
          : p === 0 && i === 1 && c.id === "spokeishere"
          ? "How to Destroy the Unstable SMP"
          : `${c.name} E${seen}: ${arc}`;
        const id = `${c.id}-p${p + 1}-e${i}`;
        // Assign real IDs to the first K episodes of each creator.
        let youtubeId = null;
        const globalIdx = episodes.filter((e) => e.creator === c.id).length;
        if (globalIdx < anchors.length) youtubeId = anchors[globalIdx];
        episodes.push({
          id,
          creator: c.id,
          creatorName: c.name,
          ep: i,
          title,
          arc,
          youtubeId,
          duration: `${28 + ((i * 7) % 55)}:${String((i * 13) % 60).padStart(2, "0")}`
        });
      }
    }
  }

  const TOTAL = episodes.length; // must be 157

  window.HUB = window.HUB || {};
  window.HUB.CREATORS = CREATORS;
  window.HUB.EPISODES = episodes;
  window.HUB.STATS = { total: TOTAL };
  console.info(`[hub] episodes: ${TOTAL}`);
})();
