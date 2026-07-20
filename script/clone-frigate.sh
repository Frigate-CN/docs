#!/bin/bash
# Clone or update the official Frigate repository for manifest generation.
#
# Branch mapping:
#   docs main  -> frigate master
#   docs beta  -> frigate dev
#
# Usage:
#   ./script/clone-frigate.sh [target_dir]
#
# Environment:
#   FRIGATE_REPO  - override the official repo URL (default: https://github.com/blakeblackshear/frigate)
#   FRIGATE_BRANCH - override the branch (default: auto-detected from docs branch)

set -euo pipefail

OFFICIAL_REPO="${FRIGATE_REPO:-https://github.com/blakeblackshear/frigate}"
TARGET_DIR="${1:-.frigate}"

# Determine the docs branch and map it to the official Frigate branch.
DOCS_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")"

if [[ -n "${FRIGATE_BRANCH:-}" ]]; then
  FRIGATE_BRANCH_VALUE="${FRIGATE_BRANCH}"
elif [[ "$DOCS_BRANCH" == "main" ]]; then
  FRIGATE_BRANCH_VALUE="master"
elif [[ "$DOCS_BRANCH" == "beta" ]]; then
  FRIGATE_BRANCH_VALUE="dev"
else
  echo "Warning: docs branch '$DOCS_BRANCH' is not 'main' or 'beta'. Defaulting to 'master'."
  FRIGATE_BRANCH_VALUE="master"
fi

echo "Docs branch: $DOCS_BRANCH"
echo "Official Frigate branch: $FRIGATE_BRANCH_VALUE"
echo "Target directory: $TARGET_DIR"

# Clone (shallow) if the directory does not exist yet.
if [[ ! -d "$TARGET_DIR/.git" ]]; then
  echo "Cloning $OFFICIAL_REPO (branch $FRIGATE_BRANCH_VALUE) into $TARGET_DIR ..."
  git clone --depth 1 --branch "$FRIGATE_BRANCH_VALUE" "$OFFICIAL_REPO" "$TARGET_DIR"
else
  echo "Repository already exists. Fetching latest $FRIGATE_BRANCH_VALUE ..."
  # Fetch the target branch and check it out.
  cd "$TARGET_DIR"
  git fetch --depth 1 origin "$FRIGATE_BRANCH_VALUE"
  git checkout "$FRIGATE_BRANCH_VALUE"
  git reset --hard "origin/$FRIGATE_BRANCH_VALUE"
fi

echo "Done. Frigate source is ready at $TARGET_DIR"
