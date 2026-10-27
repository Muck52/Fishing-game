import { FISH, RARITY } from '../../data/fish/fish.js';
import { liking } from './Habits.js';

// Longer casts reach farther out, where rarer fish live; and the fish that
// suit the hour, the weather, the bait and its depth (Habits.js) come more
// often.
export function pickFish(castPower, c) {
  const pool = FISH.map((fish) => {
    let chance = RARITY[fish.rarity].weight * liking(fish.id, c);
    if (fish.rarity !== 'common') chance *= 1 + castPower * 1.5;
    return { fish, chance };
  });
  let roll = Math.random() * pool.reduce((sum, p) => sum + p.chance, 0);
  for (const p of pool) {
    roll -= p.chance;
    if (roll <= 0) return p.fish;
  }
  return pool[0].fish;
}

// Small fish are common; trophy sizes are rare.
export function rollWeight(fish) {
  const w = fish.minWeight + (fish.maxWeight - fish.minWeight) * Math.random() ** 2;
  return Math.round(w * 10) / 10;
}

export function catchValue(fish, weight) {
  return Math.round(fish.value * (0.6 + weight / fish.maxWeight));
}
