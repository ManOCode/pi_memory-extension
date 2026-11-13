import { FileSystemStoreMemory } from "../../dist/infrastructure/fs-memory.js";
import { MemoryManager } from "../../dist/behaviour/memory-manager.js";
import assert from "assert";

async function runTests() {
  console.log("🚀 Starting Knowledge Graph Test Suite...\n");

  const store = new FileSystemStoreMemory();
  const manager = new MemoryManager(store);

  try {
    // Setup: Create a chain of related memories A -> B -> C
    console.log("Setting up graph memories...");
    await manager.remember("node-a", "Root node A", { related: ["node-b"] });
    await manager.remember("node-b", "Middle node B", { related: ["node-c"] });
    await manager.remember("node-c", "Leaf node C", {});
    
    // Add a side link B -> D
    await manager.remember("node-d", "Side node D", {});
    // Since we can't easily update just the 'related' array without a dedicated tool, 
    // we just remember B again with updated related
    await manager.remember("node-b", "Middle node B updated", { related: ["node-c", "node-d"] }, 'replace');

    // Test 1: Traversal Depth 1
    console.log("Test 1: Traversal Depth 1 (A -> B)...");
    const depth1 = await manager.traverse("node-a", 1);
    assert.strictEqual(depth1.layers[0].depth, 0); // Root
    assert.strictEqual(depth1.layers[0].entries[0].id, "node-a");
    assert.strictEqual(depth1.layers[1].depth, 1); // Hops
    assert.ok(depth1.layers[1].entries.some(e => e.id === "node-b"));
    assert.strictEqual(depth1.layers[1].entries.length, 1);
    console.log("✅ Passed");

    // Test 2: Traversal Depth 2 (A -> B -> [C, D])
    console.log("Test 2: Traversal Depth 2 (A -> B -> C/D)...");
    const depth2 = await manager.traverse("node-a", 2);
    assert.strictEqual(depth2.layers[2].depth, 2);
    const depth2Ids = depth2.layers[2].entries.map(e => e.id);
    assert.ok(depth2Ids.includes("node-c"));
    assert.ok(depth2Ids.includes("node-d"));
    console.log("✅ Passed");

    // Test 3: Visualization
    console.log("Test 3: Visualization Mermaid string...");
    const mermaid = await manager.visualize();
    console.log("DEBUG Mermaid Output:\n", mermaid);
    assert.ok(mermaid.startsWith("```mermaid"));
    assert.ok(mermaid.includes("node-a --> node-b"));
    assert.ok(mermaid.includes("node-b --> node-c"));
    assert.ok(mermaid.includes("node-b --> node-d"));
    assert.ok(mermaid.includes('node-a["'), "Mermaid should contain node-a label");
    assert.ok(mermaid.includes('node-b["'), "Mermaid should contain node-b label");
    console.log("✅ Passed");

    console.log("\n✨ All Knowledge Graph tests passed successfully!");
  } catch (error) {
    console.error("\n❌ Graph test suite failed:");
    console.error(error);
    process.exit(1);
  }
}

runTests();
