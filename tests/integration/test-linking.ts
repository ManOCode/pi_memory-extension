import { MemoryManager } from '../../dist/behaviour/memory-manager.js';
import { FileSystemStoreMemory } from '../../dist/infrastructure/fs-memory.js';
import assert from 'assert';

async function runTest() {
  console.log("🚀 Starting Knowledge Linking Test Suite...");
  const store = new FileSystemStoreMemory();
  const manager = new MemoryManager(store);

  try {
    // 0. Clear storage
    const ids = await store.listIdentifiers();
    for (const id of ids) await store.delete(id);
    console.log("🧹 Storage cleared.");

    // Test 1: Linking A -> B
    console.log("Test 1: Verifying Linking A -> B...");
    await manager.remember("memory-B", "Content of B", {});
    await manager.remember("memory-A", "Content of A", { related: ["memory-B"] });
    
    const rawA = await store.retrieve("memory-A");
    assert.ok(rawA && rawA.includes("[[memory-B]]"), "Memory A should link to B");
    console.log("✅ Memory A links to B.");

    // Test 2: Bi-directional Linking (B -> A)
    console.log("Test 2: Verifying Bi-directional Linking (B -> A)...");
    const rawB = await store.retrieve("memory-B");
    assert.ok(rawB && rawB.includes("[[memory-A]]"), "Memory B should automatically link back to A");
    console.log("✅ Memory B links back to A.");

    // Test 3: Recall includes related IDs
    console.log("Test 3: Verifying Recall related IDs...");
    const res = await manager.recall("Content of A");
    const entryA = res.entries.find(e => e.id === "memory-A");
    assert.ok(entryA && entryA.metadata.related && entryA.metadata.related.includes("memory-B"), "Recall should return related ID B");
    console.log("✅ Recall returns related links.");

    // Test 4: No duplicate links
    console.log("Test 4: Verifying no duplicate links...");
    await manager.remember("memory-A", "Updated content of A", { related: ["memory-B"] }, 'append');
    const rawB2 = await store.retrieve("memory-B");
    const matches = rawB2.match(/\[\[memory-A\]\]/g);
    assert.strictEqual(matches.length, 1, "Memory B should only have one link to A");
    console.log("✅ No duplicate links created.");

    console.log("\n✨ All Knowledge Linking tests passed successfully!");
  } catch (e) {
    console.error("\n❌ Test failed:", e);
    process.exit(1);
  }
}

runTest();
