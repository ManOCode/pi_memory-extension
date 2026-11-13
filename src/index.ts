import { type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerMemoryTools } from "./tools/tool-memory.js";
import { registerIndexTools } from "./tools/tool-index.js";
import { registerGraphTools } from "./tools/tool-graph.js";
import { MemoryManager } from "./behaviour/memory-manager.js";
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

