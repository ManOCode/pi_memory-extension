import { MemoryManager } from '../../dist/behaviour/memory-manager.js';
import { FileSystemStoreMemory } from '../../dist/infrastructure/fs-memory.js';
import { MemoryPriority } from '../../dist/abstraction/types.js';
import assert from 'assert';

async function runTest() {
  console.log("🚀 Starting Memory Priority Test Suite...");
  const store = new FileSystemStoreMemory();
  const manager = new MemoryManager(store);

  try {
    // 0. Clear previous tests
    const ids = await store.listIdentifiers();
    for (const id of ids) {
      await store.delete(id);
    }
    console.log("🧹 Storage cleared.");

    // 1. Setup: Store memories with different priorities
    await manager.remember("prio-transient", "Transient content", { priority: MemoryPriority.TRANSIENT });
    await manager.remember("prio-standard", "Standard content", { priority: MemoryPriority.STANDARD });
    await manager.remember("prio-critical", "Critical content", { priority: MemoryPriority.CRITICAL });
    await manager.remember("prio-none", "No priority content", {}); 

    console.log("✅ Setup memories created.");

    // 2. Recall all memories
    const results = await manager.recall("");
    
    console.log("Recall order:");
    results.entries.forEach(e => console.log(`- ${e.id}: ${e.metadata.priority || 'NONE'}`));

    // 3. Verify Order: Critical > Standard > Transient
    assert.strictEqual(results.entries[0].id, "prio-critical", "First memory should be critical");
    
    const lastEntry = results.entries[results.entries.length - 1];
    assert.strictEqual(lastEntry.id, "prio-transient", "Last memory should be transient");

    console.log("\n✨ All Priority tests passed successfully!");
  } catch (e) {
    console.error("\n❌ Test failed:", e);
    process.exit(1);
  }
}

runTest();
