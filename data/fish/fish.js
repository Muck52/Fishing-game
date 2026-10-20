// Every species in Loon Lake. Weights are in pounds, value is base coins.
// strength (0-1) controls how hard the fish pulls while you reel it in.
// `art` describes body shape and markings for the pixel painter.
// ids are save-file keys: keep them stable even if a species is renamed.
export const FISH = [
  {
    id: 'bluegill',
    name: 'Bluegill',
    latin: 'Lepomis macrochirus',
    note: 'Males sweep saucer-shaped nests in the shallows and guard them against all comers.',
    rarity: 'common', minWeight: 0.2, maxWeight: 1.2, strength: 0.3, value: 5,
    art: {
      length: 22, depth: 8, peak: 0.42, nose: 0.35, ped: 0.3, eye: 0.12,
      back: '#3e5a5c', side: '#7a9480', belly: '#e0a048', backTo: 0.3, sideTo: 0.68,
      fin: '#56705f', dorsal: [0.3, 0.86], dorsalH: 0.35, spiny: true, tail: 'square',
      pattern: [{ type: 'bars', n: 6, color: '#3b5148' }, { type: 'ear', color: '#141c24' }],
    },
  },
  {
    id: 'perch',
    name: 'Yellow Perch',
    latin: 'Perca flavescens',
    note: 'Perch travel in loose schools. Where there is one, there are usually more.',
    rarity: 'common', minWeight: 0.3, maxWeight: 1.5, strength: 0.35, value: 6,
    art: {
      length: 26, depth: 6, peak: 0.4, nose: 0.3, ped: 0.28, eye: 0.12,
      back: '#4f5a28', side: '#d4b446', belly: '#efe6c0', backTo: 0.3, sideTo: 0.72,
      fin: '#d97a36', dorsal: [0.22, 0.78], dorsalH: 0.5, spiny: true, tail: 'fork',
      pattern: [{ type: 'bars', n: 7, color: '#3d4a1e' }],
    },
  },
  {
    id: 'bass',
    name: 'Smallmouth Bass',
    latin: 'Micropterus dolomieu',
    note: 'Bronze-backed and fond of rocky drop-offs. Pound for pound, few fish fight harder.',
    rarity: 'uncommon', minWeight: 1, maxWeight: 6, strength: 0.55, value: 15,
    art: {
      length: 32, depth: 8, peak: 0.45, nose: 0.4, ped: 0.3, eye: 0.12, eyeColor: '#c8402c',
      back: '#5a4a2a', side: '#9c7c46', belly: '#e4d4a6', backTo: 0.32, sideTo: 0.72,
      fin: '#86693c', dorsal: [0.3, 0.82], dorsalH: 0.38, spiny: true, tail: 'square',
      pattern: [{ type: 'bars', n: 9, color: '#5c4626' }],
    },
  },
  {
    id: 'trout',
    name: 'Brook Trout',
    latin: 'Salvelinus fontinalis',
    note: 'Strictly a char, not a trout. Its red, blue-haloed spots are a sign of cold, clean water.',
    rarity: 'uncommon', minWeight: 0.5, maxWeight: 5, strength: 0.6, value: 18,
    art: {
      length: 32, depth: 6.5, peak: 0.45, nose: 0.35, ped: 0.32, eye: 0.12,
      back: '#3a4a33', side: '#6c7a58', belly: '#e07a3c', backTo: 0.35, sideTo: 0.72,
      fin: '#d86a36', dorsal: [0.4, 0.55], dorsalH: 0.5, tail: 'square',
      pattern: [
        { type: 'vermic', color: '#c9c28c' },
        { type: 'spots', color: '#d8442e', halo: '#6f8fc4', density: 0.05, v0: 0.42, v1: 0.7 },
      ],
    },
  },
  {
    id: 'catfish',
    name: 'Burbot',
    latin: 'Lota lota',
    note: "The lake's only cod. Burbot spawn in midwinter, in tangled balls beneath the ice.",
    rarity: 'rare', minWeight: 2, maxWeight: 12, strength: 0.75, value: 35,
    art: {
      length: 40, depth: 5, peak: 0.25, nose: 0.55, ped: 0.3, eye: 0.1,
      back: '#4a4228', side: '#7a6c44', belly: '#d9cfa6', backTo: 0.4, sideTo: 0.75,
      fin: '#5e5434', dorsal: [0.44, 0.94], dorsalH: 0.3, anal: [0.52, 0.94], tail: 'round', barbels: true,
      pattern: [{ type: 'mottle', color: '#2e2a1a' }],
    },
  },
  {
    id: 'pike',
    name: 'Northern Pike',
    latin: 'Esox lucius',
    note: 'Waits motionless in the weeds, then strikes faster than the eye can follow.',
    rarity: 'rare', minWeight: 4, maxWeight: 20, strength: 0.85, value: 45,
    art: {
      length: 46, depth: 5, peak: 0.55, nose: 0.18, snout: 1.4, ped: 0.32, eye: 0.14, gill: 0.22,
      back: '#2f4a2c', side: '#5f7f45', belly: '#e6e6c4', backTo: 0.3, sideTo: 0.7,
      fin: '#9a6a3a', dorsal: [0.76, 0.9], dorsalH: 0.7, anal: [0.76, 0.9], tail: 'fork',
      pattern: [{ type: 'beans', color: '#d4dc98' }],
    },
  },
  {
    id: 'golden',
    name: 'Lake Sturgeon',
    latin: 'Acipenser fulvescens',
    note: 'A lineage older than the dinosaurs. This one may have outlived every tree on the shore.',
    rarity: 'legendary', minWeight: 15, maxWeight: 80, strength: 1.0, value: 150,
    art: {
      length: 46, depth: 6, peak: 0.35, nose: 0.12, snout: 1.6, ped: 0.22, eye: 0.14,
      back: '#48524d', side: '#7c8780', belly: '#d9d7c9', backTo: 0.35, sideTo: 0.72,
      fin: '#5f6964', dorsal: [0.76, 0.86], dorsalH: 0.5, tail: 'shark', barbels: true,
      pattern: [{ type: 'scutes', color: '#cdd0c4' }],
    },
  },
];

// Colours are dark enough to read on the parchment field-journal card.
export const RARITY = {
  common: { weight: 60, label: 'Common', color: '#6b6458' },
  uncommon: { weight: 25, label: 'Uncommon', color: '#4f7a3a' },
  rare: { weight: 12, label: 'Rare', color: '#2f6a9a' },
  legendary: { weight: 3, label: 'Legendary', color: '#a8740b' },
};
