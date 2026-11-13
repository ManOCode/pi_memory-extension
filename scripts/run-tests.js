import { execSync } from "child_process";
import fs from "fs";
import path from "path";

async function runTests() {
  console.log("🧪 Starting Unified Test Suite...\n");

  const testDirs = ["tests/unit", "tests/integration"];
  let passed = 0;
  let failed = 0;
  const results = [];

  for (const dir of testDirs) {
    if (!fs.existsSync(dir)) continue;
    
    const files = fs.readdirSync(dir).filter(f => f.endsWith(".ts") || f.endsWith(".js"));
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      console.log(`Running ${filePath}...`);
      try {
        // Using npx ts-node --esm to handle ESM modules
        execSync(`npx ts-node --esm ${filePath}`, { stdio: "inherit" });
        results.push({ file: filePath, status: "✅ PASSED" });
        passed++;
      } catch (e) {
        results.push({ file: filePath, status: "❌ FAILED" });
        failed++;
      }
    }
  }

  console.log("\n" + "=".repeat(40));
  console.log("TEST SUMMARY");
  console.log("=".repeat(40));
  results.forEach(res => console.log(`${res.status} : ${res.file}`));
  console.log("=".repeat(40));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log("=".repeat(40));

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test runner encountered an error:", err);
  process.exit(1);
});
