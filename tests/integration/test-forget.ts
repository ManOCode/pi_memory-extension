import { MemoryManager } from '../../dist/behaviour/memory-manager.js';
import { FileSystemStoreMemory } from '../../dist/infrastructure/fs-memory.js';

async function runTest() {
  console.log("🚀 Starting Forget Memory Test Suite...");
  const store = new FileSystemStoreMemory();
  const manager = new MemoryManager(store);

  try {
    // 1. Setup: Store some memories
    await manager.remember("test-id-1", "This is memory 1", { tags: ["tag1"], category: "Test" });
    await manager.remember("test-id-2", "This is memory 2", { tags: ["tag2"], category: "Test" });
    await manager.remember("test-id-3", "This is memory 3", { tags: ["tag1", "tag2"], category: "Test" });
    await manager.remember("test-query-1", "Common Keyword Content", { tags: ["tag3"], category: "Test" });
    await manager.remember("test-query-2", "Another Common Keyword Content", { tags: ["tag4"], category: "Test" });

    console.log("✅ Setup memories created.");

    // Test 1: Forget by ID
    console.log("Test 1: Forget by ID (test-id-1)...");
    await manager.forget({ id: "test-id-1" });
    const check1 = await store.retrieve("test-id-1");
    if (!check1) console.log("✅ Passed: ID deletion works.");
    else throw new Error("ID deletion failed.");

    // Test 2: Forget by Query
    console.log("Test 2: Forget by Query ('Common Keyword')...");
    await manager.forget({ query: "Common Keyword" });
    const checkQ1 = await store.retrieve("test-query-1");
    const checkQ2 = await store.retrieve("test-query-2");
    if (!checkQ1 && !checkQ2) console.log("✅ Passed: Query deletion works.");
    else throw new Error("Query deletion failed.");

    // Test 3: Forget by Tags
    console.log("Test 3: Forget by Tags (['tag2'])...");
    await manager.forget({ tags: ["tag2"] });
    const checkT2 = await store.retrieve("test-id-2");
    const checkT3 = await store.retrieve("test-id-3");
    if (!checkT2 && !checkT3) console.log("✅ Passed: Tag deletion works.");
    else throw new Error("Tag deletion failed.");

    console.log("\n✨ All Forget tests passed successfully!");
  } catch (e) {
    console.error("\n❌ Test failed:", e);
    process.exit(1);
  }
}

runTest();
