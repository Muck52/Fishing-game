# Art credits

Every image in the game is compiled from the packs below by
`tools/build_art.py`. The original files are kept, unchanged, in
`assets/source/`; the game loads the compiled sheets in `assets/art/`.

| Pack | Author | License | Used for |
| --- | --- | --- | --- |
| [Fishing game assets](https://opengameart.org/content/fishing-game-assets-pixel-art) | CraftPix.net | OGA-BY 3.0 | the angler, fishing hut, posts, boat, barrel, cattails, water surface, bucket icon |
| [Mountain river landscape](https://opengameart.org/content/mountain-river-landscape-pixel-game-background) | CraftPix.net | OGA-BY 3.0 | sky, mountains, cloud, the far bank and waterfall |
| [Treasure Hunters](https://opengameart.org/content/treasure-hunters-demo) | Pixel Frog | CC-BY 4.0 | wooden boards and buttons, gold coin, splash, surface glints, bubbles, small clouds |
| [Fishing bobbles](https://opengameart.org/content/fishing-bobbles-spritesheet-24x24) | Nelson Yiap | CC-BY 3.0 | the float |
| [Underwater diving pack](https://opengameart.org/content/underwater-diving-pack) | ansimuz | CC0 | underwater light, minnows |
| [Nature props: aquatic](https://opengameart.org/content/nature-props-aquatic-underwater) | Reactorcore | CC0 | weeds, sand, clam on the lakebed |
| [Animated wild animals](https://opengameart.org/content/animated-wild-animals) | ScratchIO | CC0 | deer, fox, hare, bear |
| [Animated birds 32x32](https://opengameart.org/content/animated-birds-32x32) | MoikMellah | CC0 | gulls and sparrows |
| [A bald eagle](https://opengameart.org/content/a-bald-eagle) | Spring Spring | CC0 | the eagle |
| [16x16 duck](https://opengameart.org/content/16x16-duck) | aroachifoundonmypillow | CC0 | ducks |
| [Kenney Fonts](https://kenney.nl/assets/kenney-fonts) | Kenney | CC0 | all lettering (Kenney Pixel, Kenney Mini), baked to bitmap fonts |
| [Pixel art lake assets](https://opengameart.org/content/pixel-art-lake-assets) | Amberfall Studio | CC0 | drifting branch, ripples |

The seven species of fish (`assets/source/baked-fish/`) are the game's own
field-guide paintings, drawn by the game's earlier pixel painter and saved
as images.

Every image is also recoloured to one master palette (`docs/palette.png`)
and every actor gets the same outline colour; see `docs/ART_DIRECTION.md`.

Changes made when compiling: the hut is mirrored, the angler is turned to
face the lake and the line he holds is erased (the game draws its own), the
water surface is shifted to lake greens, splashes and glints are whitened,
and the waterfall, river and fish are given extra animation frames.
