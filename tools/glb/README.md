# Generated models

Drop `.glb` files here. `tools/bake.js` copies everything in this folder into
`/tmp/bake/glb/` before it launches the renderer, so a model landing here is one
command away from being baked:

```bash
node tools/bake.js --inspect m.glb  # check the rig first
node tools/bake.js villager         # bake a single unit
```

The name in the folder must match the `mesh:` field of that unit's entry in the
`UNITS` table at the top of `tools/bake.js`.

`/tmp` does not survive the container being reclaimed, and neither do the source
animation packs. This folder does. Generated models cost credits, so commit them
once they are good rather than regenerating.

## Restoring the models

The KayKit Adventurers models are gitignored — 18MB of CC0 binaries that
`tools/fetch_models.sh` pulls back from upstream in one command. Anything you
generated yourself and paid credits for should be committed instead: add it to
`.gitignore`'s exceptions rather than relying on being able to re-download it.
