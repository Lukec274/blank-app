#!/usr/bin/env bash
# Fetch the character models the UNITS table in tools/bake.js refers to.
#
# KayKit's Adventurers pack is CC0 and lives on GitHub, so it is not vendored
# here -- 18MB of binaries that one command can restore. Run this before baking
# on a fresh checkout.
set -euo pipefail

REPO=https://github.com/KayKit-Game-Assets/kaykit-character-pack-adventures-1.0
DEST="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/glb"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "cloning $REPO"
GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 --quiet "$REPO" "$TMP/pack"

SRC="$TMP/pack/addons/kaykit_character_pack_adventures/Characters/gltf"
for f in Knight Rogue Rogue_Hooded Mage Barbarian; do
  out="$DEST/kit_$(echo "$f" | tr '[:upper:]' '[:lower:]').glb"
  cp "$SRC/$f.glb" "$out"
  echo "  $(basename "$out")  $(( $(stat -c%s "$out") / 1024 ))KB"
done

cp "$TMP/pack/LICENSE.txt" "$DEST/KayKit-Adventurers-LICENSE.txt"
echo "done. licence copied to glb/KayKit-Adventurers-LICENSE.txt"
