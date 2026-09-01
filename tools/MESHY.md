# Generating unit models with Meshy

The stock characters are KayKit's mannequin: deliberately featureless, no face, no
cloth detail. This is the recipe for replacing them with generated, textured models
that still drop into the existing sprite baker.

## Setup

`.mcp.json` already declares the server. Supply a real key and Claude Code picks it up:

```bash
export MESHY_API_KEY=msy_...        # https://www.meshy.ai/settings/api — Pro plan or above
```

The key must never be committed. `.env` is gitignored; `.env.example` shows the shape.

**This cloud sandbox cannot reach Meshy.** `api.meshy.ai` and `assets.meshy.ai` both
fail the proxy's CONNECT check (403 / no route), so the server starts but cannot
validate a key or fetch a model. Run it from Claude Code on your own machine, or have
the environment's network policy widened to those two hosts.

## Pipeline

Two routes. Route A is the one to try first.

### Route A — Meshy end to end

1. `meshy_text_to_image` with the concept prompt below → pick the best of four.
2. `meshy_image_to_3d` on that image, `ai_model: "meshy-7"`, `texture_resolution: "2k"`.
   2k is plenty: a unit is about 46 px tall on screen.
3. `meshy_rig` on the result — humanoid auto-rig.
4. `meshy_animate` for each clip the game needs: idle, walk, attack, death.
   Villagers also need a work loop (chop / mine / hammer read the same at this size).
5. `meshy_download_model` as GLB into `tools/glb/`, named `unit_<kind>.glb`.

Going through an image first is worth the extra step — it gives you something to art
direct and reject before spending mesh credits, and image-to-3D holds silhouette and
palette far better than text-to-3D.

### Route B — generated mesh, existing animation

Skip rigging and animation: keep the mesh, retarget it onto the KayKit skeleton so
every unit shares one animation library. Movement then reads identically across the
army, which matters more than per-unit flourish. This needs a bone-name mapping and is
the fallback if Route A's animations drift in style between units.

## Baking

`tools/bake_units.js` takes a `mesh` and, when the model carries its own clips, a
`clipMap` from the game's state names to whatever Meshy called them:

```js
militia:{ mesh:'unit_militia.glb', keepMaterials:true,
          clipMap:{ Idle_A:'idle', Walking_B:'walk',
                    Melee_1H_Attack_Slice_Diagonal:'attack', Death_A:'death' },
          states:[S.idle,S.walk,{name:'attack',clip:'Melee_1H_Attack_Slice_Diagonal',n:5},S.die] },
```

`keepMaterials:true` keeps the generated textures instead of the flat per-part
materials. Team colour then needs handling one of two ways: either ask for a plain
tabard in the prompt and key it in the baker, or drop the magenta key and let the
pennant on the building plus the selection ring carry ownership. The first reads
better in a fight.

Then, as before:

```bash
node tools/bake_units.js            # renders 5 facings x every state
python3 tools/embed_assets.py       # inlines the sheets into game/index.html
```

## Prompts

House style: chunky low-poly, readable at 46 px, flat lighting, strong silhouette,
plain background. Ask for a T-pose so the auto-rigger has an easy time.

| Unit | Prompt |
| --- | --- |
| villager | medieval peasant labourer, brown tunic, leather apron, rolled sleeves, holding nothing, chunky low-poly game character, T-pose, flat colours, plain background |
| militia | medieval town militia footsoldier, plain steel cap, padded gambeson with a blank tabard, empty hands, chunky low-poly game character, T-pose, flat colours |
| spearman | medieval levy spearman, leather jerkin, wide-brim kettle helm, blank tabard, empty hands, chunky low-poly game character, T-pose |
| archer | medieval longbow archer, green hood, quiver on hip, leather bracers, empty hands, chunky low-poly game character, T-pose |
| skirmisher | medieval light skirmisher, sleeveless leather, javelin quiver, bare arms, empty hands, chunky low-poly game character, T-pose |
| pavise | medieval crossbow pavisier, heavy padded coat, kettle helm, blank tabard, empty hands, chunky low-poly game character, T-pose |
| monk | medieval monk, pale hooded habit, rope belt, empty hands, chunky low-poly game character, T-pose |
| knight | medieval knight in plate harness, closed helm, blank surcoat, empty hands, chunky low-poly game character, T-pose |

Ask for **empty hands** on every one. Weapons are built from primitives in the baker
and parented to the hand bones, so they stay consistent in scale and read cleanly at
game size — a generated weapon fused into the mesh cannot be swapped when the unit
upgrades, and tends to blur into the body at 46 px.

Mounts are separate: the horse is built in the baker. If you want a generated horse,
produce it unrigged and replace `makeHorse()` with a loaded mesh; the leg animation is
driven procedurally from the walk phase either way.

## Cost

Image-to-3D on `meshy-7` with a 2k texture is 30 credits, rig 5, animate 3 per clip.
Four clips per unit is 30 + 5 + 12 = 47 credits, so eight foot units is roughly 376
credits plus whatever the concept images cost. Generate one unit first and bake it
before committing to the rest — a full run is cheap to redo but not free.
