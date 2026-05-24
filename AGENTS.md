# AI Agent Protocol

This file defines mandatory protocols for all AI agents (Antigravity, Claude, etc.) working in this workspace.

## 1. Graph-First Architecture

**MANDATORY:** Before executing ANY task, coding work, analysis, or bug fix, you MUST consult the Graphify knowledge graph FIRST. Do NOT perform independent file search, grep, or code edits without first querying the graphify CLI or MCP server.

### Rules:
- **Pre-Analysis**: Read `graphify-out/GRAPH_REPORT.md` to identify "god nodes" (critical files) and community structures before suggesting changes.
- **Navigation**: If `graphify-out/wiki/index.md` exists, you MUST use it for navigation instead of reading raw directory listings or unknown files.
- **Querying**: Use the following commands for all architectural discovery:
  - Query: `/Users/aizen/Downloads/clientspace/.graphify-venv/bin/graphify query "<question>"`
  - Path: `/Users/aizen/Downloads/clientspace/.graphify-venv/bin/graphify path "<A>" "<B>"`
  - Explain: `/Users/aizen/Downloads/clientspace/.graphify-venv/bin/graphify explain "<concept>"`
- **Grepless Discovery**: Prefer graph queries over `grep` for cross-module relationships. The graph contains inferred edges that `grep` cannot see.

## 2. Graph Synchronization

- **Post-Mutation**: Immediately after modifying any code files, you MUST run:
  ```bash
  /Users/aizen/Downloads/clientspace/.graphify-venv/bin/graphify update .
  ```
- **Context Integrity**: Ensure the graph is current before concluding a session to prevent context drift for the next agent.

## 3. Token Optimization

- **Constraint**: Do NOT read more than 3 files for "discovery" purposes if the graph can answer the question. 
- **Validation**: Use `graphify query` results to justify why specific files are being read into context.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- ALWAYS read graphify-out/GRAPH_REPORT.md before reading any source files, running grep/glob searches, or answering codebase questions. The graph is your primary map of the codebase.
- IF graphify-out/wiki/index.md EXISTS, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
