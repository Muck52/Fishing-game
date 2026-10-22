"""Study 13's pick (A): every animal at true scale beside the angler.

The angler is 39 pixels for a man of 178 cm (0.219 px/cm). Each factor
redraws an animal's study-8 or study-9b design at its real adult size
(worked out by tools/studio/study_scale.py from its length and height in
the pose shown); fish are their typical adult length in pixels.
"""
PX_PER_CM = 39 / 178

LAND = {"olive": 0.597, "deer": 0.921, "buck": 0.937, "fox": 0.544, "hare": 0.358, "bear": 0.921}
BIRDS = {"gull": 0.338, "eagle": 0.584, "sparrow": 0.268, "mallard": 0.553, "hen": 0.553, "loon": 0.531}
FISH_CM = {"bluegill": 20, "pumpkinseed": 18, "perch": 25, "crappie": 25, "whitebass": 30, "carp": 60, "bass": 40,
           "largemouth": 45, "trout": 30, "rainbow": 50, "channelcat": 60, "drum": 50, "walleye": 50, "catfish": 50,
           "pike": 75, "muskie": 110, "golden": 150, "minnow": 7}
SMALLEST_FISH = 4  # the painter's least: a fish of 4 pixels still has a head, a body and a tail


def fish_length(sid):
    return max(SMALLEST_FISH, round(FISH_CM[sid] * PX_PER_CM))
