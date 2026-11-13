import { type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { PiTool } from "../abstraction/tool.js";
import { IMemoryBehavior, MemoryPriority } from "../abstraction/types.js";

class StoreMemory extends PiTool {
  name = "store-memory";
  label = "Store Memory";
  description = "Store or update information in the knowledge base. Use 'append' for new facts and 'replace' to correct existing errors.";
  parameters = {
    type: "object",
    properties: {
      key: { type: "string", description: "The unique identifier for the memory." },
      value: { type: "string", description: "The content to store." },
      priority: { 
        type: "string", 
        enum: ["TRANSIENT", "STANDARD", "CRITICAL"], 
        description: "Importance of the memory: TRANSIENT (short-term), STANDARD (default), CRITICAL (permanent/foundational)." 
      },
      ttl: { 
        type: "integer", 
        description: "Time-To-Live in hours. Only applicable for TRANSIENT memories. Defaults to 24 hours." 
      },
      mode: {
        type: "string",
        enum: ["append", "replace"],
        description: "Update mode: 'append' (default) adds information to the existing record; 'replace' corrects the existing record by replacing primary content."
      },
      related: {
        type: "array",
        items: { type: "string" },
        description: "IDs of related memories to link to. This builds a knowledge graph, enabling bi-directional navigation."
      }
    },
    required: ["key", "value"]
  };

  constructor(private manager: IMemoryBehavior) {
    super();
  }

  protected async run(id: string, { key, value, priority, ttl, mode, related }: { key: string, value: string, priority?: MemoryPriority, ttl?: number, mode?: 'append' | 'replace', related?: string[] }) {
    try {
      const result = await this.manager.remember(key, value, { priority, ttl, related }, mode);
      return { 
        status: result.status, 
        message: result.message, 
        id: result.id 
      };
    } catch (error) {
      console.error(`[StoreMemory] Error storing memory:`, error);
      throw new Error(`Failed to store memory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}


class ForgetMemory extends PiTool {
  name = "forget-memory";
  label = "Forget Memory";
  description = "Remove information from memory. WARNING: Use query or tags with caution as they can result in mass deletion of multiple memories.";
  parameters = {
    type: "object",
    properties: {
      id: { type: "string", description: "The unique identifier of the specific memory to delete." },
      query: { type: "string", description: "Search term; deletes all memories containing this keyword." },
      tags: { 
        type: "array", 
        items: { type: "string" }, 
        description: "List of tags; deletes all memories containing any of these tags." 
      }
    }
  };

  constructor(private manager: IMemoryBehavior) {
    super();
  }

  protected async run(id: string, criteria: { id?: string, query?: string, tags?: string[] }) {
    try {
      if (!criteria.id && !criteria.query && (!criteria.tags || criteria.tags.length === 0)) {
        throw new Error("No deletion criteria provided. Please specify an id, query, or tags.");
      }

      await this.manager.forget(criteria);
      
      let message = "Memory removed successfully.";
      if (criteria.id) message = `Memory with ID '${criteria.id}' has been deleted.`;
      else if (criteria.query) message = `All memories matching query '${criteria.query}' have been deleted.`;
      else if (criteria.tags) message = `All memories containing tags [${criteria.tags.join(", ")}] have been deleted.`;

      return {
        status: "success",
        message: message
      };
    } catch (error) {
      console.error(`[ForgetMemory] Error forgetting memory:`, error);
      throw new Error(`Failed to forget memory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

class PurgeMemories extends PiTool {
  name = "purge-memories";
  label = "Purge Expired Memories";
  description = "Cleanses the memory by permanently deleting all transient memories that have passed their expiration date.";
  parameters = {};

  constructor(private manager: IMemoryBehavior) {
    super();
  }

  protected async run(id: string) {
    try {
      const result = await this.manager.purgeExpired();
      return {
        status: result.status,
        message: result.message
      };
    } catch (error) {
      console.error(`[PurgeMemories] Error purging expired memories:`, error);
      throw new Error(`Purge failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export function registerMemoryTools(pi: ExtensionAPI, manager: IMemoryBehavior) {
  const storeMemory = new StoreMemory(manager);
  const forgetMemory = new ForgetMemory(manager);
  const purgeMemories = new PurgeMemories(manager);

  pi.registerTool({
    name: storeMemory.name,
    label: storeMemory.label,
    description: storeMemory.description,
    parameters: storeMemory.parameters,
    execute: (id: string, args: any) => storeMemory.execute(id, args)
  });

  pi.registerTool({
    name: forgetMemory.name,
    label: forgetMemory.label,
    description: forgetMemory.description,
    parameters: forgetMemory.parameters,
    execute: (id: string, args: any) => forgetMemory.execute(id, args)
  });

  pi.registerTool({
    name: purgeMemories.name,
    label: purgeMemories.label,
    description: purgeMemories.description,
    parameters: purgeMemories.parameters,
    execute: (id: string, args: any) => purgeMemories.execute(id, args)
  });
}
