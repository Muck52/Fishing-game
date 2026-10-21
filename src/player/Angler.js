import { DECK_Y, ANGLER_X, DEPTH, lerp } from '../core/constants.js';
import { ART } from '../core/Assets.js';
import { pixelLine } from '../fishing/Tackle.js';

const R = (a, b) => Phaser.Math.Between(a, b);
const ROD = 0x895a45; // the pack's rod colours
const ROD_DARK = 0x25131a;
const REST = { x: -17, y: -4 }; // rod tip from the grip, at rest, in pixels

// The angler standing at the end of the walkway, facing out over the lake.
//
// His moods: idle (rod on his shoulder, fidgeting now and then), cast,
// wait (rod out, bait in the water, jigging it and peering in), bite (the
// tip yanked down), fight (leaning back against a tugging fish, the rod
// bent toward it) and land. While the rod is out it is drawn live from his
// hands, one pixel at a time, so it can bend; his body comes from the
// sheet with the drawn rod cut away (see angler() in tools/build_art.py).
export class Angler {
  constructor(scene) {
    this.scene = scene;
    this.sprite = scene.add.sprite(ANGLER_X, DECK_Y + 1, 'angler', 0).setOrigin(0.5, 1).setDepth(DEPTH.ANGLER);
    this.rod = scene.add.graphics().setDepth(DEPTH.ANGLER + 0.1);
    this.mode = 'idle';
    this.bend = 0; // 0 straight .. 1 bent double toward the fish
    this.shudder = 0; // how much the tip quivers
    this.lift = 0; // pumping the rod up, in pixels
    this.crank = 0; // reel handle turns
    this.toward = null; // where the line goes, while a fish is on
    this.nextFidget = scene.time.now + R(4000, 8000);
    this.idle();
  }

  get rodOut() {
    return this.mode === 'wait' || this.mode === 'bite' || this.mode === 'fight';
  }

  // Where his hands hold the rod, on screen.
  get grip() {
    const a = ART.anchors.angler;
    const s = this.sprite;
    const g = a.grips[0];
    return { x: s.x - 24 + g.x, y: s.y - 48 + g.y };
  }

  // The tip of the rod: the live rod's while it is out, otherwise the one
  // drawn in the frame showing now.
  get tip() {
    if (this.rodOut) return this.liveTip(this.scene.time.now);
    const a = ART.anchors.angler;
    const i = Phaser.Math.Clamp(Number(this.sprite.frame.name) - a.fish[0], 0, a.tips.length - 1);
    const t = a.tips[i];
    const s = this.sprite;
    return { x: s.x + t.x - 24, y: s.y - 48 + t.y };
  }

  liveTip(time) {
    const g = this.grip;
    let tx = g.x + REST.x;
    let ty = g.y + REST.y - this.lift;
    if (this.mode === 'wait') ty += Math.round(Math.sin(time / 900)); // breathing with the swell
    if (this.toward && this.bend) {
      // bend toward the fish: the tip swings down along the line
      const dx = this.toward.x - g.x;
      const dy = this.toward.y - g.y;
      const d = Math.hypot(dx, dy) || 1;
      tx = lerp(tx, g.x + (dx / d) * 15, this.bend);
      ty = lerp(ty, g.y + (dy / d) * 15, this.bend * 0.8);
    }
    if (this.shudder) {
      tx += R(-1, 1) * this.shudder;
      ty += R(-1, 1) * this.shudder;
    }
    return { x: Math.round(tx), y: Math.round(ty) };
  }

  setMode(mode) {
    this.mode = mode;
    const s = this.sprite;
    s.setX(ANGLER_X).setFlipX(false);
    s.anims.timeScale = 1;
    if (mode === 'idle') s.play('angler-idle');
    if (this.rodOut) s.play('angler-body', true);
    if (mode === 'fight') s.anims.timeScale = 2.5;
    if (!this.rodOut) {
      this.rod.clear();
      this.bend = this.shudder = this.lift = 0;
      this.toward = null;
    }
    this.nextFidget = this.scene.time.now + R(3000, 7000);
  }

  idle() {
    this.setMode('idle');
  }

  // Rod back over the shoulder for a beat, then forward; onRelease fires as
  // the line flies.
  cast(onRelease) {
    this.setMode('cast');
    this.sprite.stop().setFrame(1);
    this.scene.time.delayedCall(170, () => {
      this.sprite.setFrame(ART.anchors.angler.fish[0]);
      onRelease();
      this.scene.time.delayedCall(120, () => this.setMode('wait'));
    });
  }

  // The fish takes it: the tip is yanked down.
  bite() {
    this.setMode('bite');
    this.bend = 0.35;
    this.shudder = 1;
  }

  fight() {
    this.setMode('fight');
    // braced, leaning back against the fish
    this.sprite.setX(ANGLER_X + 1);
  }

  // A good turn of the reel: the rod pumps up and the handle spins.
  reel() {
    this.scene.tweens.add({ targets: this, crank: this.crank + 4, duration: 240 }); // one full turn of the handle
    this.scene.tweens.add({ targets: this, lift: 3, duration: 90, yoyo: true, ease: 'Quad.easeOut' });
  }

  land(onDone) {
    this.setMode('land');
    this.sprite.play('angler-land');
    this.sprite.once('animationcomplete', () => {
      this.scene.time.delayedCall(400, () => {
        this.idle();
        onDone?.();
      });
    });
  }

  hurt() {
    this.setMode('hurt');
    this.sprite.stop().setFrame(ART.anchors.angler.hurt);
    this.scene.tweens.add({ targets: this.sprite, x: ANGLER_X + 2, duration: 50, yoyo: true, repeat: 3, onComplete: () => this.sprite.setX(ANGLER_X) });
  }

  // Little things he does on his own, so he never stands frozen.
  fidget(time) {
    const s = this.sprite;
    const sc = this.scene;
    if (this.mode === 'idle') {
      const pick = R(0, 2);
      if (pick === 0) {
        // glances back over his shoulder at the hut
        s.setFlipX(true);
        sc.time.delayedCall(R(900, 1600), () => this.mode === 'idle' && s.setFlipX(false));
      } else if (pick === 1) {
        // shifts his feet: a step in place and back
        s.play('angler-step');
        s.once('animationcomplete', () => this.mode === 'idle' && s.play('angler-idle'));
      } else {
        // a long breath, shoulders rising
        sc.tweens.add({ targets: s, y: s.y - 1, duration: 500, yoyo: true, hold: 300 });
      }
    } else if (this.mode === 'wait') {
      if (Math.random() < 0.6) {
        // jigs the bait: a quick lift of the rod tip
        sc.tweens.add({ targets: this, lift: 4, duration: 110, yoyo: true, repeat: R(0, 1), ease: 'Quad.easeOut' });
      } else {
        // leans in to peer at the water
        s.setX(ANGLER_X - 1);
        sc.time.delayedCall(R(1200, 2200), () => this.mode === 'wait' && s.setX(ANGLER_X));
      }
    }
    this.nextFidget = time + (this.mode === 'idle' ? R(6000, 12000) : R(3500, 7000));
  }

  update(time) {
    if (time > this.nextFidget) this.fidget(time);
    if (!this.rodOut) return;
    const g = this.grip;
    const t = this.liveTip(time);
    const mid = { x: (g.x + t.x) / 2, y: (g.y + t.y) / 2 - 2 + this.bend * 4 };
    const pts = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(g.x, g.y), new Phaser.Math.Vector2(mid.x, mid.y), new Phaser.Math.Vector2(t.x, t.y)).getPoints(20);
    const r = this.rod.clear();
    // a dark underside, then the wood, thinning toward the tip
    pixelLine(r, pts.map((p) => ({ x: p.x, y: p.y + 1 })), ROD_DARK, 1);
    pixelLine(r, pts, ROD, 1);
    pixelLine(r, pts.slice(0, 7).map((p) => ({ x: p.x, y: p.y - 1 })), ROD, 1);
    // the reel under his hands, its handle going round as he winds
    const rx = g.x + 3;
    const ry = g.y + 2;
    r.fillStyle(ROD_DARK, 1).fillRect(rx - 1, ry - 1, 3, 3);
    r.fillStyle(0xc8ccd4, 1).fillRect(rx, ry, 1, 1);
    const h = [[2, 0], [1, 2], [-1, 1], [0, -2]][Math.floor(this.crank) % 4];
    r.fillStyle(0xe0b070, 1).fillRect(rx + h[0], ry + h[1], 1, 1);
  }
}
