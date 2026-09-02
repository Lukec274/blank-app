# Replacing the unit models

The stock characters are KayKit's mannequin: a rigging dummy, deliberately
featureless. No face, no hair, no cloth. This is how to put something better
through the same sprite baker.

## Check before you bake

A candidate model that does not share the stock skeleton fails *silently* — the
animation clips bind to nothing and every frame renders a T-pose. Ask first:

```bash
node tools/bake.js --inspect kit_knight.glb
```

It reports the bone list, mesh names, model height, whatever clips the file
carries, and what percentage of the shared animation library's tracks actually
land on this skeleton. Then it tells you which of three cases you are in:

| Result | What it means |
| --- | --- |
| No missing bones, high binding | Same rig. Set `mesh:` and everything retargets. |
| Bones missing, has own clips | Different rig. Needs `clipMap:`; procedural weapons and hats will not attach. |
| Bones missing, no clips | Not usable without retargeting onto the stock skeleton first. |

For reference, the stock mannequin scores 91% and is 2.204 world units tall.
The Universal Animation Library pack scores 4% — it uses Unreal-style names
(`pelvis`, `spine_01`, `clavicle_l`) and shares nothing with KayKit.

## Where models come from

Nothing in the pipeline is tied to one vendor. `tools/bake.js` takes a `mesh:`
from any GLB.

**Other CC0 packs — the cheapest good option.** KayKit ships actual character
packs (Adventurers, Skeletons) alongside the mannequin: same artist, same style,
and — worth confirming with `--inspect` — the same skeleton the animation
library already targets. If the rig matches, a whole roster is an afternoon with
no credits spent and no style drift between units. Quaternius is the other CC0
source worth a look.

**Generators.** Meshy, Tripo, Rodin, Luma, Sloyd all do image-or-text to rigged
GLB. Going through a concept image first is worth the extra step: it gives you
something to reject before spending mesh credits, and image-to-3D holds
silhouette and palette far better than text-to-3D. Budget roughly 30 credits for
the mesh, 5 to rig, 3 per animation clip — about 47 a unit on Meshy, so ~376 for
eight foot soldiers. Bake one and look at it before committing to the rest.

If you generate, ask for **empty hands** every time. Weapons are built from
primitives in the baker and parented to the hand bones, so they stay consistent
in scale and swap when a unit upgrades. A weapon fused into the mesh cannot, and
blurs into the body at 46 px.

**Procedural detail.** The baker already builds weapons, shields, hats and
horses from primitives — see `makeHat`, `makeWeapon`, `makeShield`, `makeHorse`
in `tools/bake.html`. Hair, beards, tabards, belts, cloaks and quivers are the
same technique: free, offline, and at this size a well-placed silhouette reads
better than surface detail.

## Network

This cloud sandbox reaches GitHub and nothing else. `huggingface.co`,
`poly.pizza`, `quaternius.com`, `api.tripo3d.ai`, `sketchfab.com`,
`cdn.jsdelivr.net`, `kenney.nl`, `itch.io` and both Meshy hosts all fail the
proxy's CONNECT check. Whatever the source, the file arrives by downloading it
in a browser and uploading it here, then lands in `tools/glb/`.

The Meshy MCP server in `.mcp.json` therefore only works from Claude Code on
your own machine, with `MESHY_API_KEY` exported. The key must never be
committed; `.env` is gitignored and `.env.example` shows the shape. Meshy is
also installed as a claude.ai connector, which routes through the MCP proxy
rather than out of the container — but it has to be enabled for the chat, not
just installed on the account.

## Pipeline

```bash
node tools/bake.js --inspect model.glb   # is it compatible
node tools/bake.js villager              # bake one unit (omit the name for all)
python3 tools/quantise.py                # 5-bit posterise; halves the sheets
python3 tools/embed_assets.py            # inline into game/index.html
```

`tools/glb/` survives the container; `/tmp/bake` does not, and neither do the
source animation packs. Commit models you paid for.

## Prompts, if you generate

House style: chunky low-poly, readable at 46 px, flat lighting, strong
silhouette, plain background, T-pose so the auto-rigger has an easy time.

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

Mounts are separate: the horse is built in the baker and its legs are driven
procedurally from the walk phase either way.
