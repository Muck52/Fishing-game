// Every species in the lake. Weights are in pounds, value is base coins.
// strength (0-1) controls how hard the fish pulls while you reel it in.
export const FISH = [
  { id: 'bluegill', name: 'Bluegill', rarity: 'common', minWeight: 0.2, maxWeight: 1.2, strength: 0.3, value: 5, color: 0x5b8fb0 },
  { id: 'perch', name: 'Yellow Perch', rarity: 'common', minWeight: 0.3, maxWeight: 1.5, strength: 0.35, value: 6, color: 0xd8b84a },
  { id: 'bass', name: 'Largemouth Bass', rarity: 'uncommon', minWeight: 1.5, maxWeight: 8, strength: 0.55, value: 15, color: 0x5f8a3e },
  { id: 'trout', name: 'Rainbow Trout', rarity: 'uncommon', minWeight: 1, maxWeight: 6, strength: 0.6, value: 18, color: 0xc98aa0 },
  { id: 'catfish', name: 'Channel Catfish', rarity: 'rare', minWeight: 3, maxWeight: 25, strength: 0.75, value: 35, color: 0x7a6a58 },
  { id: 'pike', name: 'Northern Pike', rarity: 'rare', minWeight: 4, maxWeight: 20, strength: 0.85, value: 45, color: 0x6f8f5a },
  { id: 'golden', name: 'Golden Carp', rarity: 'legendary', minWeight: 10, maxWeight: 40, strength: 1.0, value: 150, color: 0xf2c230 },
];

export const RARITY = {
  common: { weight: 60, label: 'Common', color: '#d7e3ea' },
  uncommon: { weight: 25, label: 'Uncommon', color: '#9be08a' },
  rare: { weight: 12, label: 'Rare', color: '#7cc4ff' },
  legendary: { weight: 3, label: 'Legendary', color: '#ffd54f' },
};
