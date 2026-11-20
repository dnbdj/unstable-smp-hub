/* Unstable SMP Hub — the world guide: side characters, factions and places.
 *
 * Summaries are spoiler-light one-liners drawn from the community wikis
 * (Unstable Universe Wiki, TV Tropes, NamuWiki). Edit anything here: the page
 * renders straight from this file, no build step.
 *
 *   kind: "person" | "faction" | "place"
 *   skin: Minecraft username for the avatar (mc-heads.net), optional
 *   art:  image path relative to the hub root, optional — the place photos
 *         are real screenshots from the Unstable Universe Wiki (art/places/)
 *   glyph: shown on cards that have no art
 */
(function () {
  "use strict";

  const PEOPLE = [
    {
      id: "princezam", kind: "person", name: "PrinceZam",
      role: "Ruler of the Zam Empire", color: "#a855f7",
      tags: ["Antagonist"],
      blurb: "Wemmbu builds the empire a colony to guard a vault that is never to be opened — then the empire turns on him, and it does not survive the fallout."
    },
    {
      id: "ashswagg", kind: "person", name: "ashswagg",
      role: "Leader of the Invisible Mafia", color: "#ef4444",
      tags: ["Antagonist"],
      blurb: "Ran the group that took the server, spawn included, and hunted players to the corners of the map. It only fell when the protagonists stopped fighting each other."
    },
    {
      id: "clownpierce", kind: "person", name: "ClownPierce",
      role: "King of the Nether Kingdom", color: "#f97316",
      tags: ["Antagonist"],
      blurb: "Cornered netherite and potions, so everyone else fought with whatever was left. Fond of spectacles: scavenger hunts and social experiments on other players."
    },
    {
      id: "leow0ok", kind: "person", name: "Leow0ok",
      role: "Founder of BAT", color: "#38bdf8",
      tags: ["Antagonist"],
      blurb: "Built the Bounty Assassin Team to hunt the players it called corrupt. The team comes apart once its members start leaving — and once he is gone."
    },
    {
      id: "eggchan", kind: "person", name: "eggchan",
      role: "The Immortal Hostage", color: "#22c55e",
      tags: [],
      blurb: "Zam Empire, the Mafia, District 13, an empire under their own name — eggchan outlived every allegiance, which is where the nickname comes from."
    },
    {
      id: "jaden_man", kind: "person", name: "Jaden_MAN",
      role: "King of the Pirates", color: "#f59e0b",
      tags: [],
      blurb: "Led the Pirates and their civilisation, then resurfaced in the later District 13 and the Kingdom of the Caves."
    },
    {
      id: "jumperwho", kind: "person", name: "JumperWho",
      role: "District 13 founder, later BAT", color: "#a3e635",
      tags: [],
      blurb: "Helped found District 13 to stand against the Mafia, then joined BAT. Walking away from the team is part of why it collapsed."
    },
    {
      id: "theobaldthebird", kind: "person", name: "TheobaldTheBird",
      role: "District 13 founder", color: "#60a5fa",
      tags: [],
      blurb: "One of District 13's founding members and an early fixture of its escape rooms and expeditions."
    }
  ];

  const FACTIONS = [
    {
      id: "invisiblemafia", kind: "faction", name: "The Invisible Mafia", color: "#ef4444",
      glyph: "☠", tags: ["Dissolved"],
      blurb: "The main villain group of the Mafia arc. Took spawn, monopolised what it could, and dissolved after the server allied against it."
    },
    {
      id: "bat", kind: "faction", name: "B.A.T.", color: "#38bdf8",
      glyph: "✦", tags: ["Dissolved"],
      blurb: "The Bounty Assassin Team: hunters of players it judged corrupt, allied with The LAW. It ends with its founder."
    },
    {
      id: "thelaw", kind: "faction", name: "The LAW", color: "#facc15",
      glyph: "⚖", tags: [],
      blurb: "Order at spawn, enforced by lawmen. The Farm War is what happens when a thousand of them come for you."
    },
    {
      id: "district13", kind: "faction", name: "District 13", color: "#38bdf8", art: "art/district13.svg",
      tags: [],
      blurb: "Formed to oppose the Invisible Mafia, reformed against later threats. Its roster reads like a who's-who of the server."
    }
  ];

  const PLACES = [
    {
      id: "spawn", kind: "place", name: "Capital City", color: "#fbbf24", art: "art/places/capital.webp",
      tags: ["Spawn", "Active"],
      blurb: "The walled city at spawn, protected by The LAW and run by a mayor. Taken once, rebuilt, still the place everyone passes through."
    },
    {
      id: "nether", kind: "place", name: "The Nether Kingdom", color: "#f97316", art: "art/places/nether.webp",
      tags: ["Nether"],
      blurb: "ClownPierce's kingdom: blackstone, lava and the server's supply of netherite. Getting in was never the hard part."
    },
    {
      id: "farlands", kind: "place", name: "The Far Lands", color: "#a78bfa", art: "art/places/farlands.webp",
      tags: ["Outer map"],
      blurb: "A civilisation out past the normal map, governed by a Warriors Council — with its own politics and its own wars."
    },
    {
      id: "theend", kind: "place", name: "The End", color: "#818cf8", art: "art/places/theend.webp",
      tags: ["Dimension"],
      blurb: "End cities and the central island, fought over more than once for what the dimension hands out."
    },
    {
      id: "purgatory", kind: "place", name: "Purgatory", color: "#f43f5e", art: "art/places/purgatory.webp",
      tags: ["Under the bedrock"],
      blurb: "Terrain under the Nether bedrock where the server forces Adventure Mode, so nobody can place or break a single block."
    }
  ];

  window.HUB = window.HUB || {};
  window.HUB.WORLD = { PEOPLE: PEOPLE, FACTIONS: FACTIONS, PLACES: PLACES };
})();
