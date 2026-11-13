import { type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { PiTool } from "../abstraction/tool.js";
import { IMemoryBehavior, TraversedKnowledge } from "../abstraction/types.js";

class TraverseKnowledge extends PiTool {
  name = "traverse-knowledge";
  label = "Traverse Knowledge Graph";
  description = "Explore the web of memories by following related links from a starting point. Useful for discovering how concepts are connected.";
  parameters = {
    type: "object",
    properties: {
      startId: { type: "string", description: "The ID of the memory to start the exploration from." },
      depth: { 
        type: "integer", 
        description: "How many levels of links to follow. Default is 1, maximum is 3.",
        default: 1 
      }
    },
    required: ["startId"]
  };

  constructor(private manager: IMemoryBehavior) {
    super();
  }

  protected async run(id: string, { startId, depth = 1 }: { startId: string, depth?: number }) {
    try {
      const clampedDepth = Math.min(Math.max(depth, 1), 3);
      const results = await this.manager.traverse(startId, clampedDepth);
      
      let response = `Knowledge Traversal starting from [${startId}] (Depth: ${clampedDepth}):\n\n`;
      
      results.layers.forEach(layer => {
        response += `**Depth ${layer.depth}:**\n`;
        layer.entries.forEach(e => {
          response += `- [${e.id}] ${e.content.split("\n")[0]}\n`;
        });
        response += "\n";
      });

      return {
        status: "success",
        message: response
      };
    } catch (error) {
      console.error(`[TraverseKnowledge] Error:`, error);
      throw new Error(`Traversal failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

class VisualizeKnowledge extends PiTool {
  name = "visualize-knowledge";
  label = "Visualize Knowledge Map";
  description = "Generate a visual Mermaid.js graph of all memories and their interconnections. Helps identify knowledge gaps and clusters.";
  parameters = {};

  constructor(private manager: IMemoryBehavior) {
    super();
  }

  protected async run(id: string) {
    try {
      const mermaidGraph = await this.manager.visualize();
      return {
        status: "success",
        message: "Here is the visual map of your current knowledge base:\n\n" + mermaidGraph
      };
    } catch (error) {
      console.error(`[VisualizeKnowledge] Error:`, error);
      throw new Error(`Visualization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export function registerGraphTools(pi: ExtensionAPI, manager: IMemoryBehavior) {
  const traverse = new TraverseKnowledge(manager);
  const visualize = new VisualizeKnowledge(manager);

  pi.registerTool({
    name: traverse.name,
    label: traverse.label,
    description: traverse.description,
    parameters: traverse.parameters,
    execute: (id: string, args: any) => traverse.execute(id, args)
  });

  pi.registerTool({
    name: visualize.name,
    label: visualize.label,
    description: visualize.description,
    parameters: visualize.parameters,
    execute: (id: string, args: any) => visualize.execute(id, args)
  });
}
