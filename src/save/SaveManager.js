const KEY = 'reel-it-in-save-v1';

const fresh = () => ({ coins: 0, totalCatches: 0, species: {}, bag: {} });

// Progress lives in the phone's browser storage. If storage is blocked
// (private browsing), the game still works; it just won't remember.
export class SaveManager {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        const d = { ...fresh(), ...saved };
        // saves from before the backpack: everything caught so far is in it
        if (!saved.bag) d.bag = Object.fromEntries(Object.entries(d.species).map(([id, e]) => [id, e.count]));
        return d;
      }
    } catch (e) {
      // fall through to a fresh save
    }
    return fresh();
  }

  persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch (e) {
      // storage unavailable; keep playing without saving
    }
  }

  recordCatch(fish, weight, value) {
    const d = this.data;
    d.coins += value;
    d.totalCatches += 1;
    const entry = d.species[fish.id] || { count: 0, best: 0 };
    const isNew = entry.count === 0;
    const isRecord = !isNew && weight > entry.best;
    entry.count += 1;
    entry.best = Math.max(entry.best, weight);
    d.species[fish.id] = entry;
    d.bag[fish.id] = (d.bag[fish.id] || 0) + 1;
    this.persist();
    return { isNew, isRecord };
  }
}
