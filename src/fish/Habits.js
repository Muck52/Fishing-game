// When and where each fish feeds, as on a northern Midwest lake: the time
// of day it's on the bite, the weather it likes, and how deep it keeps.
// With the bait it goes for (Lures.js BEST) these decide which fish comes
// to the hook: none of them is ever ruled out, a fish just bites more
// often when things suit it.
//
//   when     dawn (5 to 8), day (8 to 17), dusk (17 to 21), night (21 to 5)
//   weather  clear, cloudy, rain, fog (Weather.js)
//   depth    shallow, mid, deep: the top, middle and bottom third of the
//            water, wherever the bait is when the fish finds it
import { SURFACE_Y, VIEW_BED } from '../core/constants.js';
import { hourNow } from '../environment/Daylight.js';
import { BEST } from './Lures.js';

export const HABITS = {
  // sunfish feed by day in the warm shallows, best in sunshine
  bluegill: { when: ['day'], weather: ['clear', 'cloudy'], depth: 'shallow' },
  pumpkinseed: { when: ['day'], weather: ['clear'], depth: 'shallow' },
  // perch school by day, a little deeper, and bite in any light
  perch: { when: ['dawn', 'day'], weather: ['cloudy', 'clear'], depth: 'mid' },
  // crappie feed at low light, under cloud or in the dark
  crappie: { when: ['dawn', 'dusk', 'night'], weather: ['cloudy', 'fog'], depth: 'mid' },
  // white bass boil the surface at dawn and dusk, on dull days
  whitebass: { when: ['dawn', 'dusk'], weather: ['cloudy', 'rain'], depth: 'shallow' },
  // carp bask and root in the warm shallows on bright days
  carp: { when: ['day', 'dusk'], weather: ['clear'], depth: 'shallow' },
  // smallmouth on the rocky drop-offs, more willing under cloud
  bass: { when: ['dawn', 'day'], weather: ['cloudy'], depth: 'mid' },
  // largemouth in the weeds, best at dawn and dusk and in the rain
  largemouth: { when: ['dawn', 'dusk'], weather: ['rain', 'cloudy'], depth: 'shallow' },
  // trout rise at dawn and dusk, and when rain or mist dims the water
  trout: { when: ['dawn', 'dusk'], weather: ['rain', 'fog'], depth: 'mid' },
  rainbow: { when: ['dawn', 'day'], weather: ['rain', 'cloudy'], depth: 'mid' },
  // catfish hunt by smell at night, more so when rain muddies the water
  channelcat: { when: ['dusk', 'night'], weather: ['rain'], depth: 'deep' },
  drum: { when: ['day', 'dusk'], weather: ['cloudy'], depth: 'deep' },
  // walleye's eyes are made for dim light: dusk, night, cloud and fog
  walleye: { when: ['dusk', 'night', 'dawn'], weather: ['cloudy', 'fog'], depth: 'deep' },
  // the burbot comes out after dark, on the bottom
  catfish: { when: ['night'], weather: ['fog', 'cloudy'], depth: 'deep' },
  // pike hunt by sight from the weeds, in daylight
  pike: { when: ['day'], weather: ['cloudy', 'clear'], depth: 'shallow' },
  // muskie are said to bite best before a storm, at the turn of the light
  muskie: { when: ['dusk', 'dawn'], weather: ['cloudy', 'rain'], depth: 'mid' },
  // sturgeon cruise the bottom at night and in the dark of a rainy day
  golden: { when: ['night', 'dawn'], weather: ['rain', 'fog'], depth: 'deep' },
};

export const DEPTHS = ['shallow', 'mid', 'deep'];
export const DEPTH_NAME = { shallow: 'Shallow', mid: 'Mid', deep: 'Deep' };

export function timeOfDay(h = hourNow()) {
  return h >= 5 && h < 8 ? 'dawn' : h >= 8 && h < 17 ? 'day' : h >= 17 && h < 21 ? 'dusk' : 'night';
}

// The third of the water a point is in.
export function bandOf(y) {
  const k = (y - SURFACE_Y) / (VIEW_BED - SURFACE_Y);
  return k < 1 / 3 ? 'shallow' : k < 2 / 3 ? 'mid' : 'deep';
}

// Where a float or jig comes to rest at each depth.
export function restDepth(band) {
  const top = SURFACE_Y + 30;
  const bottom = VIEW_BED - 22;
  return Math.round(top + (bottom - top) * { shallow: 0, mid: 0.5, deep: 1 }[band]);
}

// Is the fish on the feed at this hour and in this weather?
export function onTheFeed(id, c) {
  const h = HABITS[id];
  return h.when.includes(c.time) && h.weather.includes(c.weather);
}

// How much likelier than usual this fish is to come to the bait now:
// c = { time, weather, band, lure } (band and lure may be left out).
export function liking(id, c) {
  const h = HABITS[id];
  let m = h.when.includes(c.time) ? 2.5 : 0.5;
  if (h.weather.includes(c.weather)) m *= 2;
  if (c.band) {
    const apart = Math.abs(DEPTHS.indexOf(h.depth) - DEPTHS.indexOf(c.band));
    m *= [2, 1, 0.4][apart];
  }
  if (c.lure && BEST[id] === c.lure) m *= 2.5;
  return m;
}

// For the journal: "Dusk and night, in rainy weather, down deep."
const SKY_WORD = { clear: 'sunny', cloudy: 'cloudy', rain: 'rainy', fog: 'foggy' };
const DEEP_WORD = { shallow: 'in the shallows', mid: 'in mid water', deep: 'down deep' };
const and = (a) => (a.length > 1 ? `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}` : a[0]);
export function habitText(id) {
  const h = HABITS[id];
  const when = and(h.when.map((w) => (w === 'day' ? 'by day' : w === 'night' ? 'at night' : `at ${w}`)));
  return `${when[0].toUpperCase()}${when.slice(1)}, in ${h.weather.map((w) => SKY_WORD[w]).join(' or ')} weather, ${DEEP_WORD[h.depth]}.`;
}
