import { FileSystemStoreMemory } from "../../.../../dist/infrastructure/fs-memory.js";
import { MemoryManager } from "../../.../../dist/behaviour/memory-manager.js";
import assert from "assert";

async function runTests() {
  console.log("🚀 Starting Memory Extension Test Suite...\n");

  const store = new FileSystemStoreMemory();
  const ids = await store.listIdentifiers();
  for (const id of ids) {
    await store.delete(id);
  }
  const manager = new MemoryManager(store);

  try {
    // Test 1: Basic Store and Retrieve
    console.log("Test 1: Basic Store and Retrieve...");
    await manager.remember("test1", "Content 1", { category: "Cat1" });
    const res1 = await manager.recall("Content 1");
    assert.strictEqual(res1.entries[0].id, "test1");
    assert.strictEqual(res1.entries[0].metadata.category, "Cat1");
    console.log("✅ Passed");

    // Test 2: Deduplication
    console.log("Test 2: Deduplication...");
    const resDup = await manager.remember("test2", "Content 1");
    assert.strictEqual(resDup.status, "error");
    assert.ok(resDup.message.includes("Duplicate"));
    console.log("✅ Passed");

    // Test 3: Category Filtering
    console.log("Test 3: Category Filtering...");
    await manager.remember("test3", "Content 3", { category: "Cat2" });
    const resCat = await manager.recall("", { category: "Cat2" });
    assert.strictEqual(resCat.entries.length, 1);
    assert.strictEqual(resCat.entries[0].id, "test3");
    console.log("✅ Passed");

    // Test 4: Tag Filtering
    console.log("Test 4: Tag Filtering...");
    await manager.remember("test4", "Content 4", { tags: ["tag-a", "tag-b"] });
    const resTag = await manager.recall("", { tags: ["tag-a"] });
    assert.ok(resTag.entries.some(e => e.id === "test4"));
    
    const resTagMulti = await manager.recall("", { tags: ["tag-a", "tag-b"] });
    assert.ok(resTagMulti.entries.some(e => e.id === "test4"));
    
    const resTagFail = await manager.recall("", { tags: ["tag-c"] });
    assert.strictEqual(resTagFail.entries.some(e => e.id === "test4"), false);
    console.log("✅ Passed");

    // Test 5: Index Generation
    console.log("Test 5: Index Generation...");
    await manager.generateIndex();
    const index = await store.retrieve("index");
    assert.ok(index && index.includes("# Memory Index"));
    assert.ok(index.includes("## Categories"));
    assert.ok(index.includes("## Tags"));
    console.log("✅ Passed");

    console.log("\n✨ All tests passed successfully!");
  } catch (error) {
    console.error("\n❌ Test suite failed:");
    console.error(error);
    process.exit(1);
  }
}

runTests();
