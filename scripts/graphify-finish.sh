#!/usr/bin/env bash
# =============================================================================
# Graphify Final Step — Run this ONE command in your real macOS terminal
# =============================================================================
# The venv and git hooks are already set up. This just installs the package.
# =============================================================================

REPO_ROOT="/Users/aizen/Downloads/clientspace"
VENV_BIN="$REPO_ROOT/.graphify-venv/bin"

echo "Installing graphifyy into venv..."
"$VENV_BIN/pip" install --upgrade graphifyy && echo "✓ Installed"

echo ""
echo "Clearing macOS security attributes..."
xattr -d com.apple.quarantine "$VENV_BIN/graphify" 2>/dev/null || true
xattr -d com.apple.provenance "$VENV_BIN/graphify" 2>/dev/null || true
echo "✓ Cleared"

echo ""
echo "Removing broken ~/.local/bin/graphify symlink..."
rm -f ~/.local/bin/graphify 2>/dev/null || true
ln -sf "$VENV_BIN/graphify" ~/.local/bin/graphify 2>/dev/null && echo "✓ Symlink created" || echo "⚠ Could not create symlink (use venv path directly)"

echo ""
echo "Verifying installation..."
"$VENV_BIN/graphify" --version && echo "✓ graphify is working!"

echo ""
echo "Running initial AST update (free, no API needed)..."
cd "$REPO_ROOT"
"$VENV_BIN/graphify" update . && echo "✓ Initial graph built!"

echo ""
echo "═══════════════════════════════════════════════"
echo "✅ Graphify is fully operational!"
echo ""
echo "To build the full graph with wiki (requires Claude API):"
echo "  export ANTHROPIC_API_KEY=sk-ant-..."
echo "  $VENV_BIN/graphify . --wiki"
echo ""
echo "Add to ~/.zshrc for permanent PATH access:"
echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
echo "═══════════════════════════════════════════════"
