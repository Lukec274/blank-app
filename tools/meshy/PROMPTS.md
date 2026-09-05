# Meshy prompts for the Age of Ashlands roster

Two ways in. Use whichever the unit suits — they are not equivalent.

**Image-to-3D** (`tools/meshy/refs/<unit>_{front,left,back,right}.png`, produced by
`node tools/bake.js --refs`). Meshy builds on our silhouette: same height, same
kit, same stance. Use it for anything whose proportions already work — the
villager, archer, skirmisher, monk, militia, pavise. What comes back drops into
the existing bake with no refitting.

**Text-to-3D** (the prompts below). Use it where our model is the problem rather
than the starting point — every mounted unit, because the horse is a box
construction and feeding it back only gets a better-rendered box.

## What every prompt needs

These four clauses matter more than the description. Without them the model
comes back at a scale and pitch that has to be fought back into the game.

- `low-poly stylised game character, flat untextured colour, no PBR detail`
  — matches the KayKit look the rest of the roster is in.
- `A-pose, arms slightly out from the body, feet together, facing forward`
  — a T-pose rigs badly and an action pose bakes the action into the mesh.
- `chunky proportions, head about one fifth of total height, thick limbs`
  — the pack is stylised; a realistic 7-head figure reads as a different game
  standing next to it.
- `single character, plain background, no base, no plinth, no scenery`
  — a plinth becomes geometry, and geometry under the feet breaks the anchor.

Ask for **rigged** output where Meshy offers it. Our animation library is
KayKit's and retargets onto any humanoid rig; an unrigged mesh needs one built
before it can walk.

## Foot units

**villager** — peasant labourer, brown wool tunic to mid-thigh, leather belt
with tool loops, cloth leg wraps, short hood down around the shoulders, wood
axe held low in the right hand.

**militia** — town levy, padded gambeson, open-faced kettle helm, plain round
shield on the left arm, short arming sword. Poor kit, worn with confidence.

**spearman** — pike infantry, quilted jack, fur-trimmed cap, long spear held
upright in the right hand, tall kite shield on the left. The spear reads before
anything else and must be at least as tall as the figure.

**archer** — crossbowman, hooded green cloak over a leather jerkin, bracer on
the left forearm, crossbow held across the body at waist height, quarrel case
on the belt.

**skirmisher** — light javelin thrower, no armour, sleeveless tunic, bundle of
javelins in the left hand, one javelin cocked in the right.

**pavise** — heavy crossbow infantry, mail over a gambeson, tall rectangular
pavise shield standing beside the left leg, sword at the hip. The shield is the
silhouette.

**monk** — hooded monastic robe to the ankles, rope belt, wooden staff in the
right hand, illuminated book under the left arm, hands and face the only skin.

## Mounted units

Ask for horse and rider as one mesh — a separate horse has to be seated by hand
and the seam shows at this sprite size.

**scout** — light rider on an unarmoured chestnut horse, leather riding coat,
short cape, knife at the belt, no helmet, sitting deep with heels down.

**knight** — heavy cavalry on a barded bay warhorse, full plate, closed helm
with a raised visor, round shield on the left arm, sword raised in the right,
cloak over the shoulders, caparison over the horse's hindquarters.

**windrider** — mounted crossbowman on a lean dun horse, hooded cloak, crossbow
held across the saddle bow, light leather armour, no shield.

**cataphract** — armoured lance cavalry on a dapple-grey horse in scale barding,
scale armour on the rider, spiked shield, couched lance held along the horse's
right side, full-face helm.

## Buildings

Buildings are not in the reference bake — the props path renders one flat
sprite, not four facings. Text-to-3D with the same four clauses works; swap the
character clause for:

`low-poly stylised medieval building, flat untextured colour, single structure,
plain background, no ground plane, no surrounding terrain, viewed as a complete
model`

The footprint has to match `BLD[kind].size` in tiles or the sprite will not sit
on its plot, so state it: "roughly square footprint" for a 2x2, "long rectangle
twice as deep as it is wide" for a 2x4.
