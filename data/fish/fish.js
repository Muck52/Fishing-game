// Every species in Loon Lake, a cool, clear lake in the northern Midwest
// fed by a mountain stream. Weights are in pounds, value is base coins.
// strength (0-1) controls how hard the fish pulls while you reel it in.
// How each one looks is in tools/fish_art.py.
// ids are save-file keys: keep them stable even if a species is renamed.
export const FISH = [
  {
    id: 'bluegill',
    name: 'Bluegill',
    latin: 'Lepomis macrochirus',
    note: 'Males sweep saucer-shaped nests in the shallows and guard them against all comers.',
    rarity: 'common', minWeight: 0.2, maxWeight: 1.2, strength: 0.3, value: 5,
  },
  {
    id: 'pumpkinseed',
    name: 'Pumpkinseed',
    latin: 'Lepomis gibbosus',
    note: 'Wears a scarlet spot on its gill flap and blue squiggles on its cheeks, like war paint.',
    rarity: 'common', minWeight: 0.2, maxWeight: 1, strength: 0.3, value: 5,
  },
  {
    id: 'perch',
    name: 'Yellow Perch',
    latin: 'Perca flavescens',
    note: 'Perch travel in loose schools. Where there is one, there are usually more.',
    rarity: 'common', minWeight: 0.3, maxWeight: 1.5, strength: 0.35, value: 6,
  },
  {
    id: 'crappie',
    name: 'Black Crappie',
    latin: 'Pomoxis nigromaculatus',
    note: 'Feeds at dusk and dawn under docks and fallen trees. Its paper-thin mouth tears easily.',
    rarity: 'common', minWeight: 0.3, maxWeight: 2, strength: 0.35, value: 7,
  },
  {
    id: 'whitebass',
    name: 'White Bass',
    latin: 'Morone chrysops',
    note: 'Roams open water in big schools, boiling the surface when it chases shad.',
    rarity: 'common', minWeight: 0.5, maxWeight: 3, strength: 0.45, value: 8,
  },
  {
    id: 'carp',
    name: 'Common Carp',
    latin: 'Cyprinus carpio',
    note: 'Roots through the silt for food, sucking up mud and spitting it out. Strong and stubborn.',
    rarity: 'common', minWeight: 3, maxWeight: 25, strength: 0.6, value: 9,
  },
  {
    id: 'bass',
    name: 'Smallmouth Bass',
    latin: 'Micropterus dolomieu',
    note: 'Bronze-backed and fond of rocky drop-offs. Pound for pound, few fish fight harder.',
    rarity: 'uncommon', minWeight: 1, maxWeight: 6, strength: 0.55, value: 15,
  },
  {
    id: 'largemouth',
    name: 'Largemouth Bass',
    latin: 'Micropterus salmoides',
    note: 'Its jaw reaches past the eye. It will swallow frogs, ducklings, anything that fits.',
    rarity: 'uncommon', minWeight: 1, maxWeight: 10, strength: 0.6, value: 16,
  },
  {
    id: 'trout',
    name: 'Brook Trout',
    latin: 'Salvelinus fontinalis',
    note: 'Strictly a char, not a trout. Its red, blue-haloed spots are a sign of cold, clean water.',
    rarity: 'uncommon', minWeight: 0.5, maxWeight: 5, strength: 0.6, value: 18,
  },
  {
    id: 'rainbow',
    name: 'Rainbow Trout',
    latin: 'Oncorhynchus mykiss',
    note: 'Comes down from the stream below the falls. Leaps again and again once hooked.',
    rarity: 'uncommon', minWeight: 1, maxWeight: 8, strength: 0.65, value: 18,
  },
  {
    id: 'channelcat',
    name: 'Channel Catfish',
    latin: 'Ictalurus punctatus',
    note: 'Tastes with its whole skin. It can smell bait from the far side of the lake.',
    rarity: 'uncommon', minWeight: 2, maxWeight: 20, strength: 0.7, value: 20,
  },
  {
    id: 'drum',
    name: 'Freshwater Drum',
    latin: 'Aplodinotus grunniens',
    note: 'Grunts by drumming a muscle on its swim bladder. Its ear stones were once lucky charms.',
    rarity: 'uncommon', minWeight: 1, maxWeight: 15, strength: 0.6, value: 14,
  },
  {
    id: 'walleye',
    name: 'Walleye',
    latin: 'Sander vitreus',
    note: 'Its glassy eyes gather the faintest light, so it hunts best at dusk and under cloud.',
    rarity: 'rare', minWeight: 1, maxWeight: 12, strength: 0.65, value: 30,
  },
  {
    id: 'catfish',
    name: 'Burbot',
    latin: 'Lota lota',
    note: "The lake's only cod. Burbot spawn in midwinter, in tangled balls beneath the ice.",
    rarity: 'rare', minWeight: 2, maxWeight: 12, strength: 0.75, value: 35,
  },
  {
    id: 'pike',
    name: 'Northern Pike',
    latin: 'Esox lucius',
    note: 'Waits motionless in the weeds, then strikes faster than the eye can follow.',
    rarity: 'rare', minWeight: 4, maxWeight: 20, strength: 0.85, value: 45,
  },
  {
    id: 'muskie',
    name: 'Muskellunge',
    latin: 'Esox masquinongy',
    note: 'The fish of ten thousand casts. Anglers chase one for years and count themselves lucky.',
    rarity: 'legendary', minWeight: 10, maxWeight: 50, strength: 0.95, value: 120,
  },
  {
    id: 'golden',
    name: 'Lake Sturgeon',
    latin: 'Acipenser fulvescens',
    note: 'A lineage older than the dinosaurs. This one may have outlived every tree on the shore.',
    rarity: 'legendary', minWeight: 15, maxWeight: 80, strength: 1.0, value: 150,
  },
];

// How often each rarity bites, its label and its colour on the catch card.
export const RARITY = {
  common: { weight: 60, label: 'Common', color: '#d0d4e8' },
  uncommon: { weight: 25, label: 'Uncommon', color: '#7cf07c' },
  rare: { weight: 12, label: 'Rare', color: '#7cc8ff' },
  legendary: { weight: 3, label: 'Legendary', color: '#ffd84a' },
};
