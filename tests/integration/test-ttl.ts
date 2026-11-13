import { MemoryManager } from '../../dist/behaviour/memory-manager.js';
import { FileSystemStoreMemory } from '../../dist/infrastructure/fs-memory.js';
import { MemoryPriority } from '../../dist/abstraction/types.js';
import assert from 'assert';

async function runTest() {
  console.log("🚀 Starting Temporal Decay Test Suite...");
  const store = new FileSystemStoreMemory();
  const manager = new MemoryManager(store);

  try {
    // 0. Clear storage
    const ids = await store.listIdentifiers();
    for (const id of ids) await store.delete(id);
    console.log("🧹 Storage cleared.");

    // Test 1: Transient memory expires correctly
    console.log("Test 1: Verifying TTL expiration...");
    
    // Store a transient memory with 2 second TTL (using metadata.ttl as a hint for manager)
    // We can't pass ttl to remember directly via the interface without a hack or by using the custom field.
    // In remember(), I implemented: const ttlHours = (metadata as any).ttl || 24;
    // To test 2 seconds, I need to bypass the hours logic or use a very small fraction.
    // Let's just manually set expiresAt for the test to be precise.
    
    const expiry = new Date(Date.now() + 2000).toISOString();
    await manager.remember("ttl-test", "This should disappear", { 
        priority: MemoryPriority.TRANSIENT, 
        expiresAt: expiry 
    });

    // Should be visible immediately
    const res1 = await manager.recall("disappear");
    assert.strictEqual(res1.entries.length, 1, "Memory should be visible immediately");
    console.log("✅ Visible immediately.");

    // Wait for expiration
    console.log("Waiting 3 seconds for expiration...");
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Should be invisible now
    const res2 = await manager.recall("disappear");
    assert.strictEqual(res2.entries.length, 0, "Memory should be invisible after expiration");
    console.log("✅ Invisible after expiration.");

    // Test 2: Purge Expired
    console.log("Test 2: Verifying PurgeExpired...");
    // The file should still exist on disk
    const raw = await store.retrieve("ttl-test");
    assert.ok(raw, "File should still exist on disk before purge");
    
    await manager.purgeExpired();
    const rawAfter = await store.retrieve("ttl-test");
    assert.strictEqual(rawAfter, null, "File should be deleted after purge");
    console.log("✅ File deleted after purge.");

    console.log("\n✨ All Temporal Decay tests passed successfully!");
  } catch (e) {
    console.error("\n❌ Test failed:", e);
    process.exit(1);
  }
}

runTest();
