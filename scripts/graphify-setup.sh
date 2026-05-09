#!/usr/bin/env bash
# =============================================================================
# Graphify Complete Clean Reinstall Script
# Project: ClientSpace (Obsidian Luxury)
# =============================================================================
# Usage: bash scripts/graphify-setup.sh
# Requirements: Python 3.10+ (Homebrew recommended), internet access
# =============================================================================

set -o pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="$REPO_ROOT/.graphify-venv"
GRAPHIFY_BIN="$VENV_DIR/bin/graphify"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║         Graphify Clean Reinstall - ClientSpace       ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── Step 1: Remove old broken installation ────────────────────────────────────
echo "▶ Step 1: Removing old Graphify artifacts..."

# Remove stale graphify-out (keeps graph fresh on next run)
if [ -d "$REPO_ROOT/graphify-out" ]; then
  rm -rf "$REPO_ROOT/graphify-out"
  echo "  ✓ Removed graphify-out/"
fi

# Remove old broken venv if it exists
if [ -d "$VENV_DIR" ]; then
  rm -rf "$VENV_DIR"
  echo "  ✓ Removed old .graphify-venv/"
fi

# Remove broken symlink/binary from ~/.local/bin if it points to inaccessible target
if [ -L "$HOME/.local/bin/graphify" ]; then
  # Only remove if it's a broken symlink
  if ! [ -e "$HOME/.local/bin/graphify" ]; then
    rm "$HOME/.local/bin/graphify" 2>/dev/null && echo "  ✓ Removed broken ~/.local/bin/graphify symlink" \
      || echo "  ⚠ Could not remove ~/.local/bin/graphify (locked by macOS) — will use venv path directly"
  else
    echo "  ⚠ ~/.local/bin/graphify exists — will override with new shim after venv install"
  fi
fi


# Remove old uv-managed graphify (if accessible)
if command -v uv &>/dev/null; then
  uv tool uninstall graphifyy 2>/dev/null && echo "  ✓ Removed uv-managed graphifyy" || true
  uv tool uninstall graphify  2>/dev/null && echo "  ✓ Removed uv-managed graphify"  || true
fi

# Remove old git hooks
for hook in post-commit post-checkout; do
  HOOK_FILE="$REPO_ROOT/.git/hooks/$hook"
  if [ -f "$HOOK_FILE" ]; then
    # Check if it contains graphify
    if grep -q "graphify" "$HOOK_FILE" 2>/dev/null; then
      rm "$HOOK_FILE"
      echo "  ✓ Removed old git hook: $hook"
    fi
  fi
done

echo ""

# ── Step 2: Find Python 3.10+ ─────────────────────────────────────────────────
echo "▶ Step 2: Finding Python 3.10+..."

PYTHON=""
for candidate in \
  /opt/homebrew/bin/python3.14 \
  /opt/homebrew/bin/python3.13 \
  /opt/homebrew/bin/python3.12 \
  /opt/homebrew/bin/python3.11 \
  /opt/homebrew/bin/python3.10 \
  /usr/local/bin/python3.12 \
  /usr/local/bin/python3.11 \
  /usr/local/bin/python3.10 \
  python3.14 python3.13 python3.12 python3.11 python3.10; do
  if command -v "$candidate" &>/dev/null 2>&1; then
    VER=$("$candidate" --version 2>&1 | awk '{print $2}')
    MAJOR=$(echo "$VER" | cut -d. -f1)
    MINOR=$(echo "$VER" | cut -d. -f2)
    if [ "$MAJOR" -ge 3 ] && [ "$MINOR" -ge 10 ]; then
      PYTHON="$candidate"
      echo "  ✓ Found: $PYTHON ($VER)"
      break
    fi
  fi
done

if [ -z "$PYTHON" ]; then
  echo "  ✗ ERROR: Python 3.10+ not found."
  echo "    Install with: brew install python@3.12"
  exit 1
fi

echo ""

# ── Step 3: Create isolated venv ──────────────────────────────────────────────
echo "▶ Step 3: Creating isolated Python venv..."
"$PYTHON" -m venv "$VENV_DIR"
echo "  ✓ Created: $VENV_DIR"
echo ""

# ── Step 4: Install graphifyy ─────────────────────────────────────────────────
echo "▶ Step 4: Installing graphifyy (PyPI package)..."
"$VENV_DIR/bin/pip" install --upgrade pip --quiet
"$VENV_DIR/bin/pip" install graphifyy
echo "  ✓ graphifyy installed"
echo ""

# ── Step 5: Create global shim ────────────────────────────────────────────────
echo "▶ Step 5: Installing graphify shim to ~/.local/bin/..."
mkdir -p "$HOME/.local/bin"

# Create a wrapper script instead of a symlink (avoids macOS quarantine issues)
cat > "$HOME/.local/bin/graphify" << SHIM
#!/usr/bin/env bash
exec "$GRAPHIFY_BIN" "\$@"
SHIM
chmod +x "$HOME/.local/bin/graphify"
echo "  ✓ Shim created at ~/.local/bin/graphify"

# Clear any quarantine attributes on the venv binary
xattr -d com.apple.quarantine "$GRAPHIFY_BIN" 2>/dev/null || true
xattr -d com.apple.provenance "$GRAPHIFY_BIN" 2>/dev/null || true
echo "  ✓ Cleared security attributes from binary"
echo ""

# ── Step 6: Run graphify install (installs AGENTS.md skill) ───────────────────
echo "▶ Step 6: Running graphify install (registers skill)..."
cd "$REPO_ROOT"
"$GRAPHIFY_BIN" install 2>&1 || echo "  ⚠ graphify install returned non-zero (may be normal if CLAUDE.md not found)"
echo ""

# ── Step 7: Ensure AGENTS.md is correct ───────────────────────────────────────
echo "▶ Step 7: Verifying AGENTS.md..."
AGENTS_MD="$REPO_ROOT/AGENTS.md"
if ! grep -q "graphify" "$AGENTS_MD" 2>/dev/null; then
  cat >> "$AGENTS_MD" << 'AGENTS'

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
AGENTS
  echo "  ✓ Added graphify rules to AGENTS.md"
else
  echo "  ✓ AGENTS.md already contains graphify rules"
fi
echo ""

# ── Step 8: Install Git hooks ─────────────────────────────────────────────────
echo "▶ Step 8: Installing Git hooks..."
HOOKS_DIR="$REPO_ROOT/.git/hooks"

# post-commit hook: update graph on every commit
cat > "$HOOKS_DIR/post-commit" << HOOK
#!/usr/bin/env bash
# Auto-update Graphify knowledge graph on commit
# Installed by: scripts/graphify-setup.sh

GRAPHIFY_BIN="$GRAPHIFY_BIN"
REPO_ROOT="$REPO_ROOT"

# Only run if graphify binary exists and is executable
if [ ! -x "\$GRAPHIFY_BIN" ]; then
  echo "[graphify] Binary not found at \$GRAPHIFY_BIN - skipping graph update"
  exit 0
fi

echo "[graphify] Updating knowledge graph (AST-only, no API cost)..."
cd "\$REPO_ROOT"
"\$GRAPHIFY_BIN" update . 2>&1 | tail -3 &

# Run in background to not block git commit
exit 0
HOOK
chmod +x "$HOOKS_DIR/post-commit"
echo "  ✓ post-commit hook installed"

# post-checkout hook: notify about graph state
cat > "$HOOKS_DIR/post-checkout" << HOOK
#!/usr/bin/env bash
# Graphify post-checkout: remind to update graph when switching branches
# Installed by: scripts/graphify-setup.sh

PREV_HEAD=\$1
NEW_HEAD=\$2
BRANCH_SWITCH=\$3
GRAPHIFY_BIN="$GRAPHIFY_BIN"
REPO_ROOT="$REPO_ROOT"

# Only act on branch switches (not file checkouts)
if [ "\$BRANCH_SWITCH" = "1" ] && [ -x "\$GRAPHIFY_BIN" ]; then
  # Check if any source files changed between branches
  CHANGED=\$(git diff --name-only "\$PREV_HEAD" "\$NEW_HEAD" -- "*.ts" "*.tsx" "*.js" "*.jsx" "*.py" 2>/dev/null | wc -l | tr -d ' ')
  if [ "\$CHANGED" -gt "5" ]; then
    echo "[graphify] \$CHANGED source files changed — consider running: graphify update ."
  fi
fi
exit 0
HOOK
chmod +x "$HOOKS_DIR/post-checkout"
echo "  ✓ post-checkout hook installed"
echo ""

# ── Step 9: Build initial graph ───────────────────────────────────────────────
echo "▶ Step 9: Building initial knowledge graph..."
echo "  (This uses Claude API — ensure ANTHROPIC_API_KEY is set)"
echo ""

if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "  ⚠ ANTHROPIC_API_KEY not set."
  echo "  Running AST-only update (no API cost)..."
  cd "$REPO_ROOT"
  "$GRAPHIFY_BIN" update . 2>&1
else
  echo "  Running full graph build..."
  cd "$REPO_ROOT"
  "$GRAPHIFY_BIN" . --wiki 2>&1
fi

echo ""

# ── Done ──────────────────────────────────────────────────────────────────────
echo "╔══════════════════════════════════════════════════════╗"
echo "║              ✅ Graphify Setup Complete!              ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "Graphify binary:  $GRAPHIFY_BIN"
echo "Global shim:      ~/.local/bin/graphify"
echo "Git hooks:        post-commit, post-checkout"
echo "Graph output:     graphify-out/"
echo ""
echo "Quick commands:"
echo "  graphify update .              # Update graph (AST-only, free)"
echo "  graphify query \"<question>\"    # Query the graph"
echo "  graphify path \"<A>\" \"<B>\"      # Find connection between files"
echo "  graphify explain \"<concept>\"   # Explain a concept"
echo "  open graphify-out/graph.html   # Open interactive graph"
echo ""
echo "To rebuild the full graph:"
echo "  export ANTHROPIC_API_KEY=sk-...  # Set your key"
echo "  graphify . --wiki               # Full rebuild with wiki"
echo ""
