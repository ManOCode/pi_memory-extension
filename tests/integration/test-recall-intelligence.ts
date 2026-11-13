import { FileSystemStoreMemory } from "../../dist/infrastructure/fs-memory.js";
import { MemoryManager } from "../../dist/behaviour/memory-manager.js";
import assert from "assert";

async function runTests() {
  console.log("🚀 Starting Recall Intelligence Test Suite...\n");

  const store = new FileSystemStoreMemory();
  // Clear existing test memories to avoid deduplication interference
  const ids = await store.listIdentifiers();
  for (const id of ids) {
    await store.delete(id);
  }
  
  const manager = new MemoryManager(store);

  try {
    // Setup: Create memories with varying relevance to "Architecture"
    console.log("Setting up test memories...");
    
    // 1. Exact ID match (Highest)
    await manager.remember("Architecture", "This is the core architecture document.", { category: "Design" });
    
    // 2. Title match (High) - Now using ID as title
    await manager.remember("architecture-details", "This memory has the keyword in the ID.", { category: "Design" });
    
    // 3. Metadata match (Medium)
    await manager.remember("infra-spec", "Infrastructure details.", { category: "Architecture", tags: ["design"] });
    
    // 4. Body match (Low)
    await manager.remember("general-notes", "Some general notes.\nSomewhere in the body it mentions Architecture.", { category: "Misc" });

    // Test 1: Weighted Ranking
    console.log("Test 1: Verifying Weighted Ranking (ID > Title > Meta > Body)...");
    const results = await manager.recall("Architecture");
    console.log("Debug Scores:");
    results.entries.forEach(e => console.log(`${e.id}: ${e.relevanceScore}`));
    console.log("Full Result IDs:", results.entries.map(e => e.id));
    
    assert.strictEqual(results.entries[0].id, "Architecture", "Exact ID match should be first");
    assert.strictEqual(results.entries[1].id, "architecture-details", "Title match should be second");
    assert.strictEqual(results.entries[2].id, "infra-spec", "Metadata match should be third");
    assert.strictEqual(results.entries[3].id, "general-notes", "Body match should be last");
    console.log("✅ Passed");

    // Test 2: Context Hints Boosting
    console.log("Test 2: Verifying Context Hints Boosting...");
    // Create a memory that doesn't match "Architecture" but matches "SQL"
    await manager.remember("db-sql", "SQL Server Setup\nDetailed guide on SQL.", { category: "Database" });
    
    // Search for "Architecture" with hint "SQL"
    const hintResults = await manager.recall("Architecture", { contextHints: ["SQL"] });
    
    const sqlEntry = hintResults.entries.find(e => e.id === "db-sql");
    assert.ok(sqlEntry, "Memory matching context hint should be returned");
    
    // Compare score of a body match vs a hint match
    const bodyMatch = hintResults.entries.find(e => e.id === "general-notes");
    assert.ok(sqlEntry.relevanceScore! > (bodyMatch?.relevanceScore || 0), "Context hint match should boost score above basic body match");
    console.log("✅ Passed");

    // Test 3: ID Match Supremacy
    console.log("Test 3: Verifying ID match supremacy...");
    const idResults = await manager.recall("general-notes");
    assert.strictEqual(idResults.entries[0].id, "general-notes");
    assert.ok(idResults.entries[0].relevanceScore! >= 100);
    console.log("✅ Passed");

    console.log("\n✨ All Recall Intelligence tests passed successfully!");
  } catch (error) {
    console.error("\n❌ Recall Intelligence test suite failed:");
    console.error(error);
    process.exit(1);
  }
}

runTests();
