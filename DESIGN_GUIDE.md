# 🧠 Pi Memory Extension: Agent Design Guide

This guide defines the operational strategy for using the Memory Extension. To maximize the utility of this knowledge base, follow these structural and strategic principles.

## 🛠️ Operational Strategy

### 1. Storing Knowledge (`store-memory`)
Do not treat memory as a simple log. Treat it as a structured knowledge graph.

#### **When to use `mode`**
- **`append` (Default):** Use when adding new evidence, details, or supplemental facts to an existing concept.
- **`replace`:** Use when correcting a factual error or updating a "Single Source of Truth." Use this to prevent knowledge entropy.

#### **Assigning `priority`**
- **`CRITICAL`:** Foundational truths, project architectural standards, core user preferences, and "never-forget" constraints.
- **`STANDARD`:** General knowledge, project details, and recurring patterns.
- **`TRANSIENT`:** Short-term context, session-specific data, and temporary goals. Always provide a `ttl` for transient memories.

#### **Building the Graph (`related`)**
Avoid orphan memories. Every new memory should link to at least one existing concept.
- **Bi-directional Linking:** The system handles back-links automatically, but you should explicitly link "Up" (to a category/concept) and "Across" (to related siblings).

---

## 🔍 Retrieval Strategy (`search-index`)

### 1. The "Surgical" Search
If you know the ID of a memory, search for the ID directly. This triggers an **Exact ID Match** (100 pts) and ensures immediate retrieval.

### 2. The "Associative" Search (`contextHints`)
When searching for complex topics, do not rely on a single keyword. Use `contextHints` to bias the results.
- **Scenario:** You are looking for "Database apecifications" but remember it's related to "Infrastructure" and "PostgreSQL".
- **Action:** Query: `"Database"`, Hints: `["Infrastructure", "PostgreSQL"]`.
- **Result:** Memories containing "PostgreSQL" will be boosted above memories that just mention "database" generically.

---

## 🌐 Graph Exploration

### 1. Organic Discovery (`traverse-knowledge`)
When you encounter a new concept, don't just read it—explore its neighborhood.
- **Depth 1:** See immediate relations.
- **Depth 2:** Discover second-order connections.
- **Strategy:** Use traversal to find "hidden" dependencies before making architectural changes.

### 2. Topology Mapping (`visualize-knowledge`)
Periodically generate a knowledge map.
- **Audit:** Look for "Islands" (unlinked memories) and "Hubs" (overloaded memories).
- **Refactor:** If a memory becomes too large, split it into two and link them.

---

## ⚖️ Memory Hygiene

- **Purging:** Periodically call `purge-memories` to clear expired transient data.
- **Refining:** Use the `visualize` tool to identify redundant memories and merge them using the `replace` mode.
