import { FileSystemStoreMemory } from "../../dist/infrastructure/fs-memory.js";
import { MemoryManager } from "../../dist/behaviour/memory-manager.js";
import assert from "assert";

async function runStressTest() {
  console.log("🚀 Starting Memory Extension Stress Test...\n");

  const store = new FileSystemStoreMemory();
  
  // Cleanup previous runs
  const ids = await store.listIdentifiers();
  for (const id of ids) {
    await store.delete(id);
  }
  
  const manager = new MemoryManager(store);
  const count = 100;
  
  console.log(`Generating ${count} interrelated memories...`);
  const start = Date.now();

  for (let i = 0; i < count; i++) {
    const id = `stress-node-${i}`;
    const related = [];
    
    // Link to previous node to create a chain
    if (i > 0) related.push(`stress-node-${i - 1}`);
    // Link to a "hub" node
    if (i !== 0) related.push(`stress-node-0`);
    // Random link to create a mesh
    if (i > 5) {
      const randomId = `stress-node-${Math.floor(Math.random() * i)}`;
      related.push(randomId);
    }

    await manager.remember(id, `Content for node ${i}. This is a stress test entry.`, {
      category: i % 5 === 0 ? "Hub" : "Leaf",
      priority: i === 0 ? 'CRITICAL' : 'STANDARD',
      related: related
    });
  }

  const end = Date.now();
  console.log(`Generation took ${end - start}ms\n`);

  // Test 1: High-load Recall
  console.log("Testing high-load recall...");
  const recallStart = Date.now();
  const results = await manager.recall("stress test");
  const recallEnd = Date.now();
  
  console.log(`Recall returned ${results.total} entries in ${recallEnd - recallStart}ms`);
  assert.ok(results.total >= count, "Should have found all stress nodes");
  assert.strictEqual(results.entries[0].id, "stress-node-0", "CRITICAL hub node should be first");
  console.log("✅ Recall performance and ranking passed");

  // Test 2: Graph Visualization Load
  console.log("Testing visualization load...");
  const visStart = Date.now();
  const mermaid = await manager.visualize();
  const visEnd = Date.now();
  
  console.log(`Visualization took ${visEnd - visStart}ms`);
  assert.ok(mermaid.includes("graph TD"), "Should produce valid Mermaid header");
  assert.ok(mermaid.length > 1000, "Should produce a substantial graph");
  console.log("✅ Visualization performance passed");

  // Test 3: Deep Traversal
  console.log("Testing deep traversal...");
  const travStart = Date.now();
  const traversal = await manager.traverse("stress-node-0", 3);
  const travEnd = Date.now();
  
  console.log(`Traversal took ${travEnd - travStart}ms`);
  assert.ok(traversal.layers.length > 0, "Should have found related layers");
  console.log("✅ Traversal performance passed");

  console.log("\n✨ All stress tests passed successfully!");
}

runStressTest().catch(err => {
  console.error(err);
  process.exit(1);
});
