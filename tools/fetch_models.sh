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

# Buildings. gltf here rather than glb, so each file needs its .bin and the
# shared atlas beside it under the exact name the .gltf refers to.
HEX=https://github.com/KayKit-Game-Assets/KayKit-Medieval-Hexagon-Pack-1.0
echo "cloning $HEX"
GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 --quiet "$HEX" "$TMP/hex"
HSRC="$TMP/hex/addons/kaykit_medieval_hexagon_pack/Assets/gltf/buildings/blue"
for b in market home_A windmill lumbermill mine barracks archeryrange \
         blacksmith tower_A church castle tower_catapult; do
  cp "$HSRC/building_${b}_blue.gltf" "$DEST/"
  cp "$HSRC/building_${b}_blue.bin"  "$DEST/"
done
cp "$HSRC/hexagons_medieval.png" "$DEST/"
cp "$TMP/hex/LICENSE.txt" "$DEST/KayKit-Hexagon-LICENSE.txt"
echo "  12 buildings + atlas"

echo "done. licences copied to glb/"
