import { MemoryManager } from '../../dist/behaviour/memory-manager.js';
import { FileSystemStoreMemory } from '../../dist/infrastructure/fs-memory.js';
import assert from 'assert';

async function runTest() {
  console.log("🚀 Starting Knowledge Refinement Test Suite...");
  const store = new FileSystemStoreMemory();
  const manager = new MemoryManager(store);

  try {
    // 0. Clear storage
    const ids = await store.listIdentifiers();
    for (const id of ids) await store.delete(id);
    console.log("🧹 Storage cleared.");

    // Test 1: Append Mode
    console.log("Test 1: Verifying Append mode...");
    await manager.remember("refine-test", "Initial content", {}, 'append');
    await manager.remember("refine-test", "Updated content", {}, 'append');
    
    const resAppend = await store.retrieve("refine-test");
    assert.ok(resAppend && resAppend.includes("Initial content") && resAppend.includes("Updated content"), "Append should keep both contents");
    console.log("✅ Append mode works.");

    // Test 2: Replace Mode
    console.log("Test 2: Verifying Replace mode...");
    await manager.remember("refine-test", "New primary content", {}, 'replace');
    
    const resReplace = await store.retrieve("refine-test");
    assert.ok(resReplace && resReplace.includes("New primary content"), "Replace should have new content as primary");
    assert.ok(resReplace && resReplace.includes("History"), "Replace should move old content to History");
    assert.ok(resReplace && resReplace.includes("Initial content"), "History should contain old content");
    console.log("✅ Replace mode works.");

    // Test 3: Autonomous Indexing
    console.log("Test 3: Verifying Autonomous Indexing...");
    // Clear index first
    await store.delete("index");
    
    await manager.remember("auto-index-test", "Some content", {});
    const index = await store.retrieve("index");
    assert.ok(index && index.includes("auto-index-test"), "Index should be automatically generated after remember");
    console.log("✅ Automatic indexing after remember works.");

    await manager.forget({ id: "auto-index-test" });
    const indexAfterForget = await store.retrieve("index");
    assert.ok(!indexAfterForget || !indexAfterForget.includes("auto-index-test"), "Index should be automatically updated after forget");
    console.log("✅ Automatic indexing after forget works.");

    console.log("\n✨ All Knowledge Refinement tests passed successfully!");
  } catch (e) {
    console.error("\n❌ Test failed:", e);
    process.exit(1);
  }
}

runTest();
