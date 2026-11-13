import { type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { PiTool } from "../abstraction/tool.js";
import { IMemoryBehavior } from "../abstraction/types.js";

class GenerateIndex extends PiTool {
  name = "generate-index";
  label = "Generate Index";
  description = "Generate a high-level index of existing memory files.";
  parameters = {};

  constructor(private manager: IMemoryBehavior) {
    super();
  }

  protected async run(id: string) {
    try {
      const result = await this.manager.generateIndex();
      return { status: result.status, message: result.message };
    } catch (error) {
      console.error(`[GenerateIndex] Error generating index:`, error);
      throw new Error(`Index generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

class SearchIndex extends PiTool {
  name = "search-index";
  label = "Search Index";
  description = "Search through the memory index to find a specific target or topic.";
  parameters = {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The keyword or phrase to search for in the memory indexes."
      },
      contextHints: {
        type: "array",
        items: { type: "string" },
        description: "Optional keywords to boost relevant memories that might not directly match the query."
      }
    },
    required: ["query"]
  };

  constructor(private manager: IMemoryBehavior) {
    super();
  }

  protected async run(id: string, { query, contextHints }: { query: string, contextHints?: string[] }) {
    try {
      const result = await this.manager.recall(query, { contextHints });
      
      return result.entries.map(entry => ({
        id: entry.id,
        content: entry.content.split('\\n').filter(line => line.toLowerCase().includes(query.toLowerCase())).join('\\n'),
        relevance: entry.relevanceScore
      }));
    } catch (error) {
      console.error(`[SearchIndex] Error searching index:`, error);
      throw new Error(`Search failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export function registerIndexTools(pi: ExtensionAPI, manager: IMemoryBehavior) {
  const generateIndex = new GenerateIndex(manager);
  const searchIndex = new SearchIndex(manager);

  pi.registerTool({
    name: generateIndex.name,
    label: generateIndex.label,
    description: generateIndex.description,
    parameters: generateIndex.parameters,
    execute: (id: string, args: any) => generateIndex.execute(id, args)
  });

  pi.registerTool({
    name: searchIndex.name,
    label: searchIndex.label,
    description: searchIndex.description,
    parameters: searchIndex.parameters,
    execute: (id: string, args: any) => searchIndex.execute(id, args)
  });
}
