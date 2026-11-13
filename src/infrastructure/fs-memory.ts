import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { IMemoryStore } from "../abstraction/types.js";

export class FileSystemStoreMemory implements IMemoryStore {
  
  private readonly memoryRoot = path.join(os.homedir(), ".pi-extensions", "memory");

  async save(id: string, data: string): Promise<void> {
    const filePath = path.join(this.memoryRoot, `${id}.md`);
    const dirPath = path.dirname(filePath);
    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(filePath, data, "utf-8");
  }

  async retrieve(id: string): Promise<string | null> {
    try {
      const filePath = path.join(this.memoryRoot, `${id}.md`);
      return await fs.readFile(filePath, "utf-8");
    } catch (error) {
      return null;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const filePath = path.join(this.memoryRoot, `${id}.md`);
      await fs.unlink(filePath);
    } catch (error) {
      // Ignore if file doesn't exist
    }
  }

  async listIdentifiers(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.memoryRoot);
      return files
        .filter(file => file.endsWith(".md"))
        .map(file => path.basename(file, ".md"));
    } catch (error) {
      return [];
    }
  }

  async searchRaw(query: string): Promise<string[]> {
    const results: string[] = [];
    const ids = await this.listIdentifiers();
    const lowerQuery = query.toLowerCase();
    
    for (const id of ids) {
      if (id.toLowerCase().includes(lowerQuery)) {
        results.push(id);
        continue;
      }
      
      const content = await this.retrieve(id);
      if (content && content.toLowerCase().includes(lowerQuery)) {
        results.push(id);
      }
    }
    
    return results;
  }
}
