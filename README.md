# Pi Memory Extension

A high-performance, structured knowledge base for AI Agents. This extension allows agents to store, categorize, and retrieve long-term memories using a local Markdown-based filesystem, evolving from a simple ledger into an active knowledge graph.

## 🏗️ Architecture

This project follows a strict **Onion Architecture** to ensure scalability and implementational flexibility.

### Layers
1. **Abstraction Layer (`src/abstraction`)**: Defines the contracts (`IMemoryStore`, `IMemoryBehavior`) and types.
2. **Behaviour Layer (`src/behaviour`)**: The "Brain" of the system. Implements `MemoryManager` which handles:
    - **Deduplication**: Prevents storing redundant information.
    - **Knowledge Refinement**: Supports `append` (supplemental) and `replace` (correction) update modes.
    - **Memory Intelligence**: Implements priority-weighted recall and temporal decay (TTL).
    - **Knowledge Linking**: Manages bi-directional Wiki-links between related memories.
    - **Autonomous Indexing**: Automatically keeps `index.md` in sync.
3. **Infrastructure Layer (`src/client`)**: Handles raw I/O via `FileSystemStoreMemory`.

## 🛠️ Tools

### `store-memory`
Stores or updates a piece of information.
- **Parameters**: 
    - `key` (String): Unique identifier.
    - `value` (String): The content to store.
    - `priority` (Enum): `CRITICAL` (permanent), `STANDARD` (default), `TRANSIENT` (short-term).
    - `ttl` (Integer): Time-to-live in hours (only for `TRANSIENT` memories).
    - `mode` (Enum): `append` (add to existing) or `replace` (correct existing).
    - `related` (Array): IDs of related memories to link to.
- **Behavior**: Stores data with YAML metadata and automatically updates the global index.

### `search-index`
Retrieves knowledge based on a query.
- **Parameters**: `query` (String).
- **Behavior**: Returns memories sorted by priority (`CRITICAL` > `STANDARD` > `TRANSIENT`) and filters out expired transient memories.

### `forget-memory`
Removes specific knowledge.
- **Parameters**: `id` (Specific ID), `query` (Keyword match), or `tags` (Tag match).
- **Behavior**: Deletes matching files and updates the index.

### `purge-memories`
Maintenance tool for memory hygiene.
- **Behavior**: Permanently deletes all transient memories that have passed their expiration date.

### `generate-index`
Manual trigger to rebuild the global table of contents.
- **Behavior**: Scans all memories and groups them by categories and tags.

## 📂 Storage Format

Memories are stored as Markdown files with YAML front-matter:

```markdown
---
tags: [project-pi, architecture]
category: Development
priority: CRITICAL
timestamp: 2026-11-12T...
expiresAt: 2026-11-13T...
related: [other-memory-id]
---
# Knowledge: project-structure
## Summary
The project uses an Onion Architecture...

## Related
- [[index]]
- [[other-memory-id]]
```

## 🚀 Setup & Development

### Build
```bash
npm run build
```

### Test
Run the comprehensive test suite:
```bash
npx ts-node --esm test/test-memory.ts     # Basic Lifecycle
npx ts-node --esm test-forget.ts        # Deletion
npx ts-node --esm test-priority.ts      # Priority Ranking
npx ts-node --esm test-ttl.ts           # Temporal Decay
npx ts-node --esm test-refinement.ts   # Update Modes & Auto-Index
npx ts-node --esm test-linking.ts       # Knowledge Graph
```

### Deploy
```bash
npm run deploy
```
