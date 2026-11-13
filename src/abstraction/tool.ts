export interface IPiTool {
  name: string;
  label: string;
  description: string;
  parameters: any;
  execute(id: string, args: any): Promise<any>;
}

/**
 * Base class for pi tools to provide common functionality
 * and standardized error handling.
 */
export abstract class PiTool implements IPiTool {
  abstract name: string;
  abstract label: string;
  abstract description: string;
  abstract parameters: any;

  async execute(id: string, args: any): Promise<any> {
    try {
      return await this.run(id, args);
    } catch (error) {
      console.error(`[${this.name}] Error:`, error);
      throw error;
    }
  }

  protected abstract run(id: string, args: any): Promise<any>;
}