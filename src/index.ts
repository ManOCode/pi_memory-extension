import { type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerMemoryTools } from "./tool/tool-memory.js";
import { registerIndexTools } from "./tool/tool-index.js";
import { registerGraphTools } from "./tool/tool-graph.js";
import { MemoryManager } from "./application/memory-manager.js";
import { FileSystemStoreMemory } from "./infrastructure/fs-memory.js";

export default function (pi: ExtensionAPI) {
  console.log("Pi Memory Extension loaded");
  
  // Composition Root
  const store = new FileSystemStoreMemory();
  const manager = new MemoryManager(store);

  registerMemoryTools(pi, manager);
  registerIndexTools(pi, manager);
  registerGraphTools(pi, manager);
}

