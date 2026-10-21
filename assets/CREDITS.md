# Art credits

Every image in the game is compiled from the packs below by
`tools/build_art.py`. The original files are kept, unchanged, in
`assets/source/`; the game loads the compiled sheets in `assets/art/`.

| Pack | Author | License | Used for |
| --- | --- | --- | --- |
| [Fishing game assets](https://opengameart.org/content/fishing-game-assets-pixel-art) | CraftPix.net | OGA-BY 3.0 | the angler, fishing hut, posts, boat (rebuilt as a rowboat), barrel, cattails, water surface, bucket icon |
| [Mountain river landscape](https://opengameart.org/content/mountain-river-landscape-pixel-game-background) | CraftPix.net | OGA-BY 3.0 | sky, mountains, cloud, the far bank and waterfall |
| [Treasure Hunters](https://opengameart.org/content/treasure-hunters-demo) | Pixel Frog | CC-BY 4.0 | wooden boards and buttons, gold coin, splash, surface glints, bubbles, small clouds |
| [Fishing bobbles](https://opengameart.org/content/fishing-bobbles-spritesheet-24x24) | Nelson Yiap | CC-BY 3.0 | the float |
| [Underwater diving pack](https://opengameart.org/content/underwater-diving-pack) | ansimuz | CC0 | underwater light, minnows |
| [Nature props: aquatic](https://opengameart.org/content/nature-props-aquatic-underwater) | Reactorcore | CC0 | weeds, sand, clam on the lakebed |
| [Animated wild animals](https://opengameart.org/content/animated-wild-animals) | ScratchIO | CC0 | deer, fox, hare, bear |
| [Animated birds 32x32](https://opengameart.org/content/animated-birds-32x32) | MoikMellah | CC0 | gulls and sparrows |
| [A bald eagle](https://opengameart.org/content/a-bald-eagle) | Spring Spring | CC0 | the eagle |
| [16x16 duck](https://opengameart.org/content/16x16-duck) | aroachifoundonmypillow | CC0 | ducks |
| [monogram](https://datagoblin.itch.io/monogram) | datagoblin | CC0 | all lettering, baked to bitmap fonts (outlined, plain ink, and bold) |
| [Pixel art lake assets](https://opengameart.org/content/pixel-art-lake-assets) | Amberfall Studio | CC0 | drifting branch, ripples |

The seventeen species of fish are painted by the game's own build
(`tools/fish_art.py`). No outside fish art is copied into them; these free
sprites were studied for technique (see `docs/ART_DIRECTION.md`):

| Reference | Author | License | What we learned from it |
| --- | --- | --- | --- |
| [Pike fish](https://opengameart.org/content/pike-fish) | angrycheese | CC0 | banded countershading; rows of pale bean spots |
| [8 simple fishes](https://opengameart.org/content/8-simple-fishes) | dreyzn | CC0 | lateral line, gill cover, translucent ray-lined fins, ringed eye |
| [Tiny Creatures](https://opengameart.org/content/tiny-creatures) (Tiny Fishing) | Clint Bellanger | CC0 | one silhouette and one signature mark keep a tiny fish readable |

Every image is also recoloured to one master palette (`docs/palette.png`)
and every actor gets the same outline colour; see `docs/ART_DIRECTION.md`.

Changes made when compiling: the hut is mirrored, the angler is turned to
face the lake and the line he holds is erased (the game draws its own), the
water surface is shifted to lake greens, splashes and glints are whitened,
and the waterfall, river and fish are given extra animation frames.
