import { PX, HORIZON, DEPTH } from '../core/constants.js';

// The grassy point on the west shore that the reed bed grows along, with a
// little raft landing jutting out beside it where the rowboat ties up. It is
// a Tiled map (assets/art/environments/shore.json) on a tileset built from
// the Zelda-like overworld pack, one tile layer for the shore and one for
// the landing. Positions are art pixels.
export const SHORE = { x: 0, y: HORIZON + 40 };
export const MOORING = { x: SHORE.x + 92, y: SHORE.y + 44 }; // the rowboat's keel

export function addShore(scene) {
  const map = scene.make.tilemap({ key: 'shore-map' });
  const tiles = map.addTilesetImage('shore', 'pack-shore');
  map.createLayer('shore', tiles, SHORE.x * PX, SHORE.y * PX).setScale(PX).setDepth(DEPTH.BANKS - 0.1);
  map.createLayer('dock', tiles, SHORE.x * PX, SHORE.y * PX).setScale(PX).setDepth(DEPTH.BANKS - 0.05);
  return map;
}
