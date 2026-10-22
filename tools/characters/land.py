"""The land animals' sheets, animated from study 8's designs.

Olive, the doe, the buck, the fox, the hare and the bear are drawn from
shapes (tools/characters/anatomy.py, specs in tools/studio/
study_creatures.py) in study 8's chosen look: C's proportions, B's big eyes
with a catchlight. This moves them:

- **Gaits.** Each leg swings about its hip or shoulder through a stride:
  on the ground (stance) its foot slides back at the body's speed, so it
  stays put on the sand as the animal moves; in the air (swing) it comes
  forward, lifted, the knee or hock bending. Legs take turns by gait: the
  walk's four beats (hind, fore, other hind, other fore), the fox's trot
  (diagonal pairs), Olive's gallop (hinds together, then fores). The body
  rises a little as it passes over a straight leg.
- **The hare hops**, moving only in the air: crouch, push off with the
  hind legs, fly with the forelegs reaching, land on them, gather.
- **Idles** are made from the poses: an ear flick, a head lowered to
  drink or sniff, a tail swish, a nose raised to the wind.

The step each walk frame moves the animal (`step` or `steps`) comes from
the stride: a foot travels 2A on the ground over the stance's frames.

The sheets are saved drawn and outlined; the art build's last pass gives
them the selective edge and lights them as one mass.
"""
import copy
import json
import math
import sys
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parent / "studio"))
import study_creatures as sc  # noqa: E402
from anatomy import draw, ground_drop  # noqa: E402
from kit import outline, image, preview, ART  # noqa: E402

STYLE = "between"
WATERLINE = 22  # Olive swimming: the row of her frame the lake comes up to
HEAD_KEYS = ("head", "eye", "nose", "pivot")
HEAD_LISTS = ("ears", "ears_far", "head_marks")
HEAD_LIMBS = ("antlers", "antlers_far")


# ---------------------------------------------------------------- moving parts

def full(spec, pose):
    p = copy.deepcopy(spec["poses"][pose])
    if "base" in p:
        p = {**copy.deepcopy(spec["poses"][p["base"]]), **p}
        p.pop("base")
    if "head_turn" in p:
        # turn the source pose's head now, so it can be moved further
        angle, src = p.pop("head_turn")
        q = spec["poses"][src]
        p = {**p, **{k: copy.deepcopy(q[k]) for k in HEAD_KEYS + HEAD_LISTS + HEAD_LIMBS if k in q and k != "pivot"}}
        head_move(p, rot=angle, about=q["pivot"], to=p["pivot"])
    return p


def head_move(p, rot=0.0, dx=0.0, dy=0.0, about=None, to=None):
    """Turns the head and everything on it about the top of the neck (or
    `about`, then sets that point on `to`), and/or shifts it."""
    a = math.radians(rot)
    sx, sy = about or p["pivot"]
    tx, ty = to or (sx, sy)

    def f(x, y):
        x, y = x - sx, y - sy
        return (tx + x * math.cos(a) - y * math.sin(a) + dx, ty + x * math.sin(a) + y * math.cos(a) + dy)
    for k in ("head",):
        p[k] = [f(*q) for q in p[k]]
    for k in ("eye", "nose"):
        if k in p:
            p[k] = f(*p[k])
    for k in HEAD_LISTS:
        p[k] = [(ch, [f(*q) for q in pts]) for ch, pts in p.get(k, [])]
    for k in HEAD_LIMBS:
        p[k] = [(ch, [f(*q) for q in pts], w) for ch, pts, w in p.get(k, [])]
    p["pivot"] = (tx + dx, ty + dy)
    return p


def turn_parts(parts, rot, about):
    """Turns a list of (ink, points[, widths]) about a point (an ear, a tail)."""
    a = math.radians(rot)
    ax, ay = about

    def f(x, y):
        x, y = x - ax, y - ay
        return (ax + x * math.cos(a) - y * math.sin(a), ay + x * math.sin(a) + y * math.cos(a))
    return [(t[0], [f(*q) for q in t[1]], *t[2:]) for t in parts]


def body_shift(p, dx=0.0, dy=0.0):
    """Moves everything but the feet: the legs stretch from hip to foot."""
    mv = lambda pts: [(x + dx, y + dy) for x, y in pts]  # noqa: E731
    for k in ("torso", "neck", "head"):
        p[k] = mv(p[k])
    for k in ("eye", "nose", "pivot"):
        p[k] = mv([p[k]])[0]
    for k in ("ears", "ears_far", "marks", "head_marks", "behind", "front"):
        p[k] = [(ch, mv(pts)) for ch, pts in p.get(k, [])]
    for k in ("tail", "antlers", "antlers_far"):
        p[k] = [(ch, mv(pts), w) for ch, pts, w in p.get(k, [])]
    legs = []
    for side, j, w in p["legs"]:
        n = len(j) - 1
        legs.append((side, [(x + dx * (1 - i / n), y + dy * (1 - i / n)) for i, (x, y) in enumerate(j)], w))
    p["legs"] = legs
    return p


def move_leg(joints, dx, lift, knee):
    """The foot moved dx along the ground and lifted; the joints between
    follow in proportion, the middle ones pushed out by the bend (knee:
    -1 forward, +1 back)."""
    n = len(joints) - 1
    out = []
    for i, (x, y) in enumerate(joints):
        t = i / n
        out.append((x + dx * t + knee * lift * 0.7 * math.sin(math.pi * t), y - lift * t))
    return out


def legs_of(p):
    """Which legs are fore and which hind: the fore are nearer the head."""
    xs = [j[0][0] for _, j, _ in p["legs"]]
    mid = (min(xs) + max(xs)) / 2
    return [("fore" if j[0][0] < mid else "hind") for _, j, _ in p["legs"]]


GAITS = {
    # phase of each leg, by (side, fore/hind), and the share of the cycle a
    # foot is on the ground
    "walk": ({("near", "hind"): 0.0, ("near", "fore"): 0.25, ("far", "hind"): 0.5, ("far", "fore"): 0.75}, 0.75),
    "trot": ({("near", "hind"): 0.0, ("far", "fore"): 0.0, ("far", "hind"): 0.5, ("near", "fore"): 0.5}, 0.5),
    "gallop": ({("near", "hind"): 0.0, ("far", "hind"): 0.1, ("near", "fore"): 0.5, ("far", "fore"): 0.6}, 0.4),
}


def gait(spec, n, kind, stride, lift, bob=0.5, pitch=0.0):
    """n frames of a gait. stride: how far (A) each foot reaches forward or
    back of where it stands."""
    base = full(spec, "stand")
    drop = ground_drop(spec, STYLE)
    phases, duty = GAITS[kind]
    roles = legs_of(base)
    frames = []
    for f in range(n):
        p = copy.deepcopy(base)
        legs = []
        down = 0
        for (side, j, w), role in zip(p["legs"], roles):
            ph = (f / n + phases[(side, role)]) % 1
            if ph < duty:
                dx, up = stride * (1 - 2 * ph / duty), 0.0
                down += 1 - abs(1 - 2 * ph / duty)  # a straight leg under the body lifts it
            else:
                s = (ph - duty) / (1 - duty)
                dx, up = stride * (-1 + 2 * (3 * s * s - 2 * s * s * s)), lift * math.sin(math.pi * s)
            legs.append((side, move_leg(j, -dx, up, -1 if role == "fore" else 1), w))
        p["legs"] = legs
        body_shift(p, dy=-bob * down / 2)
        if pitch:
            # the gallop: the back flexes and extends, head and rump rocking
            k = math.sin(2 * math.pi * f / n)
            head_move(p, dy=pitch * k)
            p["tail"] = turn_parts(p.get("tail", []), 8 * k, p["tail"][0][1][0]) if p.get("tail") else []
        p["drop"] = drop
        frames.append(p)
    return frames


def steps_for(n, kind, stride):
    """How far the body moves on each frame for feet that don't slide."""
    duty = GAITS[kind][1]
    v = 2 * stride / (duty * n)
    out, acc = [], 0.0
    for _ in range(n):
        acc += v
        out.append(int(acc) - sum(out))
    return out


# ---------------------------------------------------------------- frames

def render(spec, p, water=None):
    s = {**spec, "poses": {"f": p}}
    g = outline(draw(s, STYLE, "f"))
    return image(g, {**sc.FACE, **spec["colours"]}, water=water)


def fixed(spec, pose):
    p = full(spec, pose)
    p.setdefault("drop", ground_drop(spec, STYLE, pose) if pose != "stand" else ground_drop(spec, STYLE))
    return p


def ear_flick(spec, deg=-14):
    p = fixed(spec, "stand")
    if p.get("ears"):
        base = p["ears"][0][1][0]
        p["ears"] = turn_parts(p["ears"], deg, base)
    return p


def tail_swish(spec, deg):
    p = fixed(spec, "stand")
    if p.get("tail"):
        p["tail"] = turn_parts(p["tail"], deg, p["tail"][0][1][0])
    elif p.get("behind"):
        root = p["behind"][0][1][0]
        p["behind"] = turn_parts(p["behind"], deg, root)
    return p


def nose_up(spec, deg):
    p = fixed(spec, "stand")
    return head_move(p, rot=deg)


def padded(spec, top):
    """Room above the animal (for a hop or a leap)."""
    s = dict(spec)
    w, h = spec["frame"]
    s["frame"], s["ground"] = (w, h + top), spec["ground"] + top
    return s


# ---------------------------------------------------------------- the animals

def deer(spec):
    walk = gait(spec, 8, "walk", 3, 2.4)
    stand, drink = fixed(spec, "stand"), fixed(spec, "drink")
    half = head_move(fixed(spec, "stand"), rot=-35, dy=6)
    idle = [stand, stand, ear_flick(spec), stand, half, drink, drink, drink, half, tail_swish(spec, -25)]
    return {"walk": (walk, 8, True, {"step": 1}), "idle": (idle, 4, True)}


def fox(spec):
    walk = gait(spec, 8, "trot", 2.5, 1.5)
    stand, sniff = fixed(spec, "stand"), fixed(spec, "sniff")
    idle = [stand, ear_flick(spec, -12), sniff, sniff, stand, tail_swish(spec, -18)]
    return {"walk": (walk, 10, True, {"steps": steps_for(8, "trot", 2.5)}), "idle": (idle, 5, True)}


def bear(spec):
    walk = gait(spec, 8, "walk", 3, 2, bob=0.8)
    stand = fixed(spec, "stand")
    up = nose_up(spec, 14)
    idle = [stand, stand, nose_up(spec, 7), up, up, stand]
    return {"walk": (walk, 7, True, {"step": 1}), "idle": (idle, 3, True)}


def hare(spec):
    """The hop: hare frames are drawn by hand from the stand, each a body
    lift (air), the hind legs' reach and the forelegs' reach."""
    spec = padded(spec, 6)
    base = full(spec, "stand")
    drop = ground_drop(spec, STYLE)
    hind_back = [(21, 22.5), (23.4, 25.2), (25.6, 26.4)]  # pushed off, straight back

    def hop(air, fore_dx, fore_lift, hind, tilt=0.0, crouch=0.0):
        p = copy.deepcopy(base)
        legs = []
        for side, j, w in p["legs"]:
            if j[0][0] > 15:  # the hind leg
                legs.append((side, hind or j, w))
            else:
                legs.append((side, move_leg(j, fore_dx, fore_lift, -1), w))
        p["legs"] = legs
        if crouch:
            body_shift(p, dy=crouch)
        if tilt:
            head_move(p, dy=tilt)
        p["drop"], p["air"] = drop, air
        return p
    gather = hop(0, 0, 0, None, crouch=1)
    frames = [gather, hop(2, -2, 1, hind_back, tilt=-1), hop(5, -3, 2, hind_back, tilt=-1), hop(4, -3, 1, [(21, 22.5), (21.6, 25), (24, 25.6)]),
              hop(2, -1, 0, [(21, 22.5), (19, 24), (16, 24)], tilt=1), hop(0, 0, 0, None, tilt=1, crouch=1)]
    stand = fixed(spec, "stand")
    alert = fixed(spec, "alert")
    nib = head_move(fixed(spec, "stand"), rot=-20, dy=2)
    walk = frames + [stand, stand, stand, stand]
    idle = [stand, nib, nib, stand, ear_flick(spec, -10), stand, alert, alert, alert, stand]
    return spec, {"walk": (walk, 12, True, {"steps": [0, 4, 6, 5, 3, 1, 0, 0, 0, 0]}), "idle": (idle, 4, True)}


def olive(spec):
    spec = padded(spec, 4)
    walk = gait(spec, 8, "walk", 3, 2.2)
    run = gait(spec, 6, "gallop", 4.8, 3.2, bob=1.0, pitch=1.0)
    stand = fixed(spec, "stand")
    idle = [stand, tail_swish(spec, -10), stand, tail_swish(spec, 8), stand, ear_flick(spec, -12)]
    drop = ground_drop(spec, STYLE)
    base = full(spec, "stand")
    roles = legs_of(base)

    def reach(fore, hind, air, dy=0.0, nose=0.0):
        p = copy.deepcopy(base)
        p["legs"] = [(side, move_leg(j, fore[0] if r == "fore" else hind[0], fore[1] if r == "fore" else hind[1], -1 if r == "fore" else 1), w)
                     for (side, j, w), r in zip(p["legs"], roles)]
        body_shift(p, dy=dy)
        if nose:
            head_move(p, rot=nose)
        p["drop"], p["air"] = drop, air
        return p
    leap = [reach((1, 1), (-1, 0), 0, dy=1.5),           # gathered, crouched to spring
            reach((-4, 3.4), (4, 1), 2, nose=6),           # pushing off, forelegs reaching
            reach((-5, 2.4), (5, 2.4), 4),                 # stretched out, flying
            reach((-3, 0.5), (3, 3.4), 3, nose=-14)]       # nose down into the water
    # swimming: low in the water, head up, legs paddling under her
    swim = []
    for f in range(4):
        k = f / 4
        p = copy.deepcopy(base)
        p["legs"] = [(side, move_leg(j, 3 * math.sin(2 * math.pi * (k + (0.5 if r == "hind" else 0) + (0.25 if side == "far" else 0))),
                                     2 + 1.5 * math.cos(2 * math.pi * (k + (0.5 if r == "hind" else 0))), -1 if r == "fore" else 1), w)
                     for (side, j, w), r in zip(p["legs"], roles)]
        head_move(p, rot=8, dy=-1)
        p["drop"], p["air"] = drop, 0
        swim.append(p)
    # the shake: head, shoulders and tail thrown side to side, ears flapping
    shake = []
    for f in range(8):
        k = math.sin(math.pi * f / 2) * (1 - f / 10)
        p = copy.deepcopy(stand)
        head_move(p, rot=10 * k, dx=-0.8 * k)
        if p.get("ears"):
            p["ears"] = turn_parts(p["ears"], 18 * k, p["ears"][0][1][0])
        p["tail"] = turn_parts(p["tail"], -12 * k, p["tail"][0][1][0])
        p["marks"] = [(ch, [(x + 0.6 * k, y) for x, y in pts]) for ch, pts in p["marks"]]
        shake.append(p)
    anims = {"idle": (idle, 4, True), "walk": (walk, 10, True, {"step": 1}),
             "run": (run, 14, True, {"steps": steps_for(6, "gallop", 4.8)}),
             "leap": (leap, 8, False), "swim": (swim, 6, True, {"water": WATERLINE}), "shake": (shake, 14, False)}
    return spec, anims


def anims(name):
    """name -> (spec as drawn, {animation: (poses, fps, loop[, extra])})"""
    spec = sc.ANIMALS[name]
    if name in ("deer", "buck"):
        return spec, deer(spec)
    if name == "fox":
        return spec, fox(spec)
    if name == "bear":
        return spec, bear(spec)
    if name == "hare":
        return hare(spec)
    if name == "olive":
        return olive(spec)
    raise KeyError(name)


def sheet(name, folder=None):
    spec, a = anims(name)
    imgs, index, n = [], {}, 0
    for an, t in a.items():
        poses, fps, loop = t[:3]
        extra = dict(t[3]) if len(t) > 3 else {}
        water = extra.pop("water", None)
        imgs += [render(spec, p, water) for p in poses]
        index[an] = {"frames": list(range(n, n + len(poses))), "fps": fps, "loop": loop, **extra}
        n += len(poses)
    fw, fh = imgs[0].size
    strip = Image.new("RGBA", (fw * len(imgs), fh))
    for k, f in enumerate(imgs):
        strip.alpha_composite(f, (k * fw, 0))
    out = ART / (folder or "")
    out.mkdir(parents=True, exist_ok=True)
    strip.save(out / f"{name}.png")
    (out / f"{name}.json").write_text(json.dumps({"frameWidth": fw, "frameHeight": fh, "animations": index}, indent=1) + "\n")
    preview(name, {an: ([imgs[i] for i in t["frames"]], t["fps"]) for an, t in index.items()}, fw, fh)
    return strip, index, fw, fh, spec


if __name__ == "__main__":
    for nm in ("deer", "buck", "fox", "hare", "bear"):
        sheet(nm)
    sheet("olive", "olive")
