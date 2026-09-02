# 🏰 Age of Ashlands

A real-time strategy game in the spirit of the original *Age of Empires*, built to be played
with one thumb on a phone. One HTML file, no downloads, no external assets — every texture,
sprite and sound is generated in code when the page loads.

**Play it:** open `game/index.html` in any browser, or run the Streamlit wrapper below.

## What's in it

- **Four ages** — Dark, Feudal, Castle and Imperial, each unlocking buildings, units and upgrades.
- **Four resources** — food, wood, gold and stone, with drop-off buildings, berry patches,
  forests, ore seams and farms.
- **Four realms** — Free Cities (the balance control), Ordu Clans, Aureate Empire and Iron
  Marches. Each is a data template over the same engine: different economic dials, one unique
  unit and one landmark, and its own temperament when played by the computer.
- **17 buildings and 13 unit types** with rock-paper-scissors counters: spearmen gut cavalry,
  archers shred infantry, skirmishers answer archers, rams break buildings, mangonels scatter crowds.
- **Fog of war**, minimap, save/resume, victory by conquest or by holding a Wonder for five minutes.

| Realm | Strengths | Costs | Unique unit | Landmark |
| --- | --- | --- | --- | --- |
| Free Cities | none — the yardstick | none | — | — |
| Ordu Clans | foraging, mounted speed, scouting | slower farms, dearer stone | Windrider (mounted archer) | Relay Post (speeds and heals riders) |
| Aureate Empire | cheap counters, tough towers, rich seams | dearer heavy cavalry | Cataphract Guard | Theme Hall (trains counters faster) |
| Iron Marches | stone, infantry armour, cheap forts | slower foot and siege, dearer farms | Pavise Bearer (shields nearby archers) | March Keep (shoots and repairs) |

## Controls

| Touch | Action |
| --- | --- |
| Tap a unit or building | Select it |
| Tap the ground / a tree / an enemy | Move, gather or attack |
| Drag | Pan the camera |
| Pinch | Zoom |
| Press and hold, then drag | Sweep-select an army |
| Double-tap a unit | Select every unit of that type on screen |

Mouse and keyboard work too: left-click selects, right-click orders, wheel zooms,
<kbd>Space</kbd> jumps to an idle villager, <kbd>H</kbd> to the town centre, <kbd>A</kbd>
attack-move, <kbd>S</kbd> stop, <kbd>I</kbd> shows the opponent's planner, <kbd>1</kbd>–<kbd>9</kbd>
fire the command buttons.

## How it works

**Deterministic fixed-tick simulation.** The world advances in whole 30 Hz ticks driven by an
accumulator, never by frame time, and the simulation draws from a different random stream than
the renderer. A given seed therefore replays exactly; `stateHash()` folds the world into one
number, which is both the regression check the test suite uses and the value lockstep peers
would exchange to detect a desync.

**Rendering.** A 2D isometric tile grid with depth-sorted sprites. Terrain is value noise sampled
through diamond tiles with feathered transitions between biomes. Units are assembled from limbs
and weapons into a cached atlas: five canonical poses (side, three-quarter front, front,
three-quarter back, back) mirrored at draw time to cover eight facings, as the original's
pre-rendered sprites did. Fog of war is a map-sized bitmap composited through the isometric
matrix so it blurs smoothly instead of stepping tile to tile.

**Pathfinding.** A* with a binary heap for a single unit with its own goal. A group order instead
sweeps one Dijkstra integration field out from the shared destination and bakes a direction per
tile, so any number of units read a local arrow rather than each searching the map — ordering
sixty soldiers across a large map went from 52 ms in one frame to 4.4 ms. Fields are cached
against an occupancy counter, and a unit that wedges falls back to its own search.

**The opponent** is a small strategic planner rather than a pile of rules firing independently.
Two plans run concurrently, one owning the villagers and the treasury, one owning the army.
Resources can be reserved: an age-up ring-fences its cost and every other purchase simply cannot
see that money, though a garrison of a few soldiers always outranks the reserve. Construction has
a pending lock and a cooldown per building; resource nodes have worker capacity so villagers stop
dogpiling one bush. An attack is a durable plan — MUSTER, TRAVEL, ENGAGE, REGROUP, RETREAT — that
owns its units, holds a target for a lock period, musters reinforcements in groups rather than
feeding them in one at a time, and commits everything when it is clearly ahead. Press <kbd>I</kbd>
to watch all of it live.

**Testing.** Headless Chromium drives the real UI: taps, long-press box select, pinch, build
flow, save/reload/resume, both victory conditions, and layout at 360 px. A soak harness plays
twenty seeded matches to conclusion and asserts that both sides age up, switch to farms once
their berries run out, take the offensive, and resolve.

## About the artwork

No Age of Empires art is used — that material is Microsoft's. Units are **pre-rendered
3D**, which is how the original game was built: a rigged model is rendered offline through
a fixed isometric camera and baked into 2D frames. `tools/bake.js` drives three.js in
headless Chromium to do exactly that, rendering five canonical facings (S, SE, E, NE, N)
across idle, walk, attack, work, mine, build and death; the other three facings are those
mirrored at draw time. Weapons, shields and a low-poly horse are built from primitives and
parented to the rig's hand and root bones. Tunics render in keyed magenta and are recoloured
per player as each frame is first needed, so one sheet serves every colour.

The models themselves are not vendored -- 18MB of binaries that `tools/fetch_models.sh`
restores from the CC0 upstream in one command. Run it before baking on a fresh checkout.

Building the page is four steps: `tools/bake.js` renders the sheets,
`tools/quantise.py` posterises them to 5 bits per channel (the renderer's antialiasing
noise is invisible at 46 px but roughly doubles the PNGs), `tools/embed_fonts.py` inlines
the two webfonts, and `tools/embed_assets.py` inlines the sheets. `tools/bake.js --inspect`
reports whether a replacement model shares the rig before you spend a bake on it.

Terrain, ore, trees, most buildings, interface icons and all sound are generated in code at
load. With the fonts embedded the page fetches nothing at all, so the game is one file and
works offline.

### Asset credits

| Asset | Author | Licence | Used for |
| --- | --- | --- | --- |
| KayKit Medieval Hexagon Pack 1.0 | Kay Lousberg (kaylousberg.com) | CC0 | Every building |
| KayKit Adventurers Character Pack 1.0 | Kay Lousberg (kaylousberg.com) | CC0 | Every unit model, and their weapons, shields, helmets and capes |
| KayKit Character Animations 1.1 | Kay Lousberg (kaylousberg.com) | CC0 | Every unit animation |
| Universal Animation Library | Quaternius | CC0 | Evaluated and not used: Unreal-style rig, incompatible with the KayKit clips |
| Isometric Miniature Farm | Kenney (kenney.nl) | CC0 | Reference for prop scale |

Everything shipped in the page is CC0. The timbered house renders that previously
stood in for the House arrived without a licence file and have been removed now that
the Hexagon pack covers buildings.

## Running the Streamlit wrapper

```
pip install -r requirements.txt
streamlit run streamlit_app.py
```
