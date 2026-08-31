# 🏰 Age of Ashlands

A full real-time strategy game in the spirit of the original *Age of Empires*, built to be
played with one thumb on a phone. One HTML file, no downloads, no external assets — every
texture, sprite and sound is generated in code when the page loads.

**Play it:** open `game/index.html` in any browser, or run the Streamlit wrapper below.

## What's in it

- **Four ages** — Dark, Feudal, Castle and Imperial, each unlocking buildings, units and upgrades.
- **Four resources** — food, wood, gold and stone, with drop-off buildings, berry patches,
  forests, ore seams and farms.
- **14 buildings** — town centre, house, mill, farm, lumber camp, mining camp, barracks,
  archery range, stable, blacksmith, watch tower, siege workshop, monastery, castle and wonder.
- **10 unit types** with rock-paper-scissors counters: spearmen gut cavalry, archers shred
  infantry, skirmishers answer archers, rams break buildings, mangonels scatter crowds.
- **Upgrade chains** — militia → man-at-arms → long swordsman → champion, plus blacksmith
  armour/attack lines and economy techs.
- **A computer opponent** that gathers, expands, farms when the berries run out, banks food
  for the next age, defends its town and sends escalating attack waves. Three difficulties,
  up to three rivals.
- **Fog of war**, minimap, save/resume, victory by conquest or by holding a Wonder for five minutes.

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
attack-move, <kbd>S</kbd> stop, <kbd>1</kbd>–<kbd>9</kbd> fire the command buttons.

## About the artwork

The original Age of Empires art is copyrighted, so none of it is used here. Terrain is
value-noise sampled through diamond tiles with feathered transitions between biomes; trees,
ore and buildings are drawn from layered primitives; unit sprites are assembled from limbs
and weapons into a cached atlas per type, player colour, facing and animation frame. Sound
is a small WebAudio synth. Nothing is fetched over the network, so the game works offline.

## Running the Streamlit wrapper

```
pip install -r requirements.txt
streamlit run streamlit_app.py
```
