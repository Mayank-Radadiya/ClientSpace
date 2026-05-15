# AI Agent Protocol

This file defines mandatory protocols for all AI agents (Antigravity, Claude, etc.) working in this workspace.

## 1. Graph-First Architecture

**MANDATORY:** Before executing ANY task that involves structural changes or architectural analysis, you MUST consult the Graphify knowledge graph.

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
