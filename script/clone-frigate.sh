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
#   FRIGATE_BRANCH - override the branch to clone (default: auto-detected from docs branch)
#   DOCS_BRANCH   - explicitly set the docs branch (main/beta); overrides auto-detection

set -euo pipefail

OFFICIAL_REPO="${FRIGATE_REPO:-https://github.com/blakeblackshear/frigate}"
TARGET_DIR="${1:-.frigate}"

# Determine the docs branch and map it to the official Frigate branch.
detect_docs_branch() {
  # Explicit override wins (works in any CI/local environment).
  if [[ -n "${DOCS_BRANCH:-}" ]]; then
    echo "$DOCS_BRANCH"
    return
  fi
  # Prefer the actual branch name (empty on detached HEAD).
  local branch
  branch="$(git branch --show-current 2>/dev/null || true)"
  if [[ -n "$branch" ]]; then
    echo "$branch"
    return
  fi
  # Detached HEAD: find a tracked branch that contains the current commit.
  # Look at remote-tracking refs first, then local refs, matching the names
  # we actually care about (main/beta) so we don't pick an unrelated branch.
  local ref
  for ref in $(git for-each-ref --format='%(refname:short)' \
                refs/remotes/origin refs/heads 2>/dev/null); do
    local name="${ref#origin/}"
    if [[ "$name" == "main" || "$name" == "beta" ]]; then
      if git merge-base --is-ancestor HEAD "$ref" 2>/dev/null; then
        echo "$name"
        return
      fi
    fi
  done
  # Last resort: symbolic abbreviation (may be 'HEAD').
  git rev-parse --abbrev-ref HEAD 2>/dev/null || echo ""
}

DOCS_BRANCH="$(detect_docs_branch)"

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
