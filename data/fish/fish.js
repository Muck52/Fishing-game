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
      length: 34, depth: 12, peak: 0.42, nose: 0.33, ped: 0.28, eye: 0.13, gill: 0.27, mouth: 0.07,
      back: '#2c5a5c', side: '#5f968a', belly: '#f0a030', backTo: 0.32, sideTo: 0.7,
      fin: '#4f6656', dorsal: [0.3, 0.88], dorsalH: 0.32, spiny: 0.5, dorsalSpot: '#1c2622', tail: 'square', scales: 3,
      pattern: [
        { type: 'bars', n: 6, color: '#2c403a', depth: 0.8 },
        { type: 'cheek', color: '#7fb0d8' },
        { type: 'ear', color: '#10161c' },
      ],
    },
  },
  {
    id: 'perch',
    name: 'Yellow Perch',
    latin: 'Perca flavescens',
    note: 'Perch travel in loose schools. Where there is one, there are usually more.',
    rarity: 'common', minWeight: 0.3, maxWeight: 1.5, strength: 0.35, value: 6,
    art: {
      length: 40, depth: 9, peak: 0.4, nose: 0.3, ped: 0.26, eye: 0.12, gill: 0.25, mouth: 0.08,
      back: '#3f5a14', side: '#ecc02c', belly: '#f6eccc', backTo: 0.28, sideTo: 0.75,
      fin: '#c9a63a', lowerFin: '#e07a2e', dorsal: [0.2, 0.8], dorsalH: 0.5, spiny: 0.55, dorsalSpot: '#26301a', tail: 'fork', scales: 3,
      pattern: [{ type: 'bars', n: 7, color: '#2f3a10', taper: true, depth: 0.82 }],
    },
  },
  {
    id: 'bass',
    name: 'Smallmouth Bass',
    latin: 'Micropterus dolomieu',
    note: 'Bronze-backed and fond of rocky drop-offs. Pound for pound, few fish fight harder.',
    rarity: 'uncommon', minWeight: 1, maxWeight: 6, strength: 0.55, value: 15,
    art: {
      length: 50, depth: 12, peak: 0.45, nose: 0.4, ped: 0.3, eye: 0.12, eyeColor: '#c8402c', gill: 0.26, mouth: 0.14, mouthSlope: 0.25,
      back: '#4a3a1c', side: '#ad8640', belly: '#eee0b4', backTo: 0.3, sideTo: 0.74,
      fin: '#7f6639', dorsal: [0.28, 0.84], dorsalH: 0.38, spiny: 0.5, tail: 'square', scales: 3,
      pattern: [
        { type: 'bars', n: 9, color: '#4a3820', depth: 0.75, strength: 0.45 },
        { type: 'eyebars', color: '#3a2c18' },
      ],
    },
  },
  {
    id: 'trout',
    name: 'Brook Trout',
    latin: 'Salvelinus fontinalis',
    note: 'Strictly a char, not a trout. Its red, blue-haloed spots are a sign of cold, clean water.',
    rarity: 'uncommon', minWeight: 0.5, maxWeight: 5, strength: 0.6, value: 18,
    art: {
      length: 50, depth: 10, peak: 0.45, nose: 0.33, ped: 0.3, eye: 0.12, gill: 0.24, mouth: 0.1,
      back: '#28402a', side: '#5a7448', belly: '#f2622a', backTo: 0.4, sideTo: 0.72,
      fin: '#7a7a4a', lowerFin: '#d8603a', finEdge: true, finBars: true, dorsal: [0.4, 0.56], dorsalH: 0.5, tail: 'square',
      scales: 0, lateral: 0.42,
      pattern: [
        { type: 'vermic', color: '#c8c08a' },
        { type: 'spots', color: '#d8c060', density: 0.35, cell: 4, v0: 0.35, v1: 0.7, seed: 30 },
        { type: 'spots', color: '#d8442e', halo: '#5f86c6', density: 0.22, cell: 6, size: 0.7, v0: 0.42, v1: 0.72, seed: 40 },
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
      length: 60, depth: 8, peak: 0.25, nose: 0.55, ped: 0.28, eye: 0.09, gill: 0.2, mouth: 0.08,
      back: '#3e3818', side: '#7a6c38', belly: '#e2d8aa', backTo: 0.42, sideTo: 0.78,
      fin: '#5a5032', dorsal: [0.44, 0.95], dorsal2: [0.33, 0.4], dorsalH: 0.28, anal: [0.5, 0.95], analH: 0.28,
      tail: 'round', barbels: 'chin', scales: 0,
      pattern: [{ type: 'mottle', color: '#2a2614' }],
    },
  },
  {
    id: 'pike',
    name: 'Northern Pike',
    latin: 'Esox lucius',
    note: 'Waits motionless in the weeds, then strikes faster than the eye can follow.',
    rarity: 'rare', minWeight: 4, maxWeight: 20, strength: 0.85, value: 45,
    art: {
      length: 70, depth: 8, peak: 0.55, nose: 0.14, snout: 1.5, ped: 0.3, eye: 0.13, gill: 0.22, mouth: 0.16, mouthSlope: 0.1,
      back: '#22401a', side: '#4e8a34', belly: '#f2f0d2', backTo: 0.3, sideTo: 0.72,
      fin: '#8f6a3a', dorsal: [0.77, 0.9], dorsalH: 0.65, anal: [0.77, 0.9], analH: 0.55, finBars: true, tail: 'fork', scales: 2,
      scaleStrength: 0.6,
      pattern: [{ type: 'spots', color: '#e6ec9a', density: 0.85, cell: 4, rx: 1.6, ry: 0.8, size: 0.9, v0: 0.18, v1: 0.8, seed: 50 }],
    },
  },
  {
    id: 'golden',
    name: 'Lake Sturgeon',
    latin: 'Acipenser fulvescens',
    note: 'A lineage older than the dinosaurs. This one may have outlived every tree on the shore.',
    rarity: 'legendary', minWeight: 15, maxWeight: 80, strength: 1.0, value: 150,
    art: {
      length: 72, depth: 9, peak: 0.33, nose: 0.1, snout: 1.7, ped: 0.2, eye: 0.13, gill: 0.22, mouth: 0,
      back: '#3c4844', side: '#76857a', belly: '#ece8d6', backTo: 0.36, sideTo: 0.74,
      fin: '#59625a', dorsal: [0.78, 0.87], dorsalH: 0.45, tail: 'shark', barbels: 'four', scales: 0, lateral: false,
      pattern: [{ type: 'scutes', color: '#c9ccbf' }],
    },
  },
];

// Colours are bright enough to read on the blue field-journal window.
export const RARITY = {
  common: { weight: 60, label: 'Common', color: '#d0d4e8' },
  uncommon: { weight: 25, label: 'Uncommon', color: '#7cf07c' },
  rare: { weight: 12, label: 'Rare', color: '#7cc8ff' },
  legendary: { weight: 3, label: 'Legendary', color: '#ffd84a' },
};
