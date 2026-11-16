import { type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { StoreMemory, ForgetMemory, PurgeMemories } from "./tool/tool-memory.js";
import { GenerateIndex, SearchIndex } from "./tool/tool-index.js";
import { TraverseKnowledge, VisualizeKnowledge } from "./tool/tool-graph.js";
import { MemoryManager } from "./application/memory-manager.js";
import { FileSystemMemory } from "./infrastructure/fs-memory.js";
import { IPiTool } from "./domain/tool.js";

//Infrastructure
const store = new FileSystemMemory();

//Application
const manager = new MemoryManager(store);

//Tool
const generateIndex = new GenerateIndex(manager);
const searchIndex = new SearchIndex(manager);

const storeMemory = new StoreMemory(manager);
const forgetMemory = new ForgetMemory(manager);
const purgeMemories = new PurgeMemories(manager);

const traverse = new TraverseKnowledge(manager);
const visualize = new VisualizeKnowledge(manager);


export default function (pi: ExtensionAPI) {
  console.log("Pi Memory Extension loaded");
  //Index
  registerTool(pi, generateIndex);
  registerTool(pi, searchIndex);
  
  //Memory
  registerTool(pi, storeMemory);
  registerTool(pi, forgetMemory);
  registerTool(pi, purgeMemories);

  //Graph
  registerTool(pi, traverse);
  registerTool(pi, visualize);
}

function registerTool(pi: ExtensionAPI, tool: IPiTool) {
  pi.registerTool({
    name: tool.name,
    label: tool.label,
    description: tool.description,
    parameters: tool.parameters,
    execute: (id: string, args: any) => tool.execute(id, args)
  });
}