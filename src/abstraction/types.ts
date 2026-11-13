export enum MemoryPriority {
  TRANSIENT = 'TRANSIENT',
  STANDARD = 'STANDARD',
  CRITICAL = 'CRITICAL'
}

export interface MemoryMetadata {
  tags?: string[];
  timestamp?: string;
  category?: string;
  priority?: MemoryPriority;
  expiresAt?: string;
  related?: string[];
  [key: string]: any;
}

export interface MemoryResult {
  status: 'success' | 'updated' | 'error';
  id: string;
  message: string;
}

export interface ForgetCriteria {
  id?: string;
  tags?: string[];
  query?: string;
}

export interface RecallOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'date' | 'relevance';
  order?: 'asc' | 'desc';
  tags?: string[];
  category?: string;
  contextHints?: string[];
}

export interface MemoryEntry {
  id: string;
  content: string;
  metadata: MemoryMetadata;
  relevanceScore?: number;
}

export interface MemoryCollection {
  entries: MemoryEntry[];
  total: number;
}

export interface TraversedKnowledge {
  rootId: string;
  layers: {
    depth: number;
    entries: MemoryEntry[];
  }[];
}

export interface IMemoryStore {
  save(id: string, data: string): Promise<void>;
  retrieve(id: string): Promise<string | null>;
  delete(id: string): Promise<void>;
  listIdentifiers(): Promise<string[]>;
  searchRaw(query: string): Promise<string[]>;
}

export interface IMemoryBehavior {
  remember(id: string, content: string, metadata?: MemoryMetadata, mode?: 'append' | 'replace'): Promise<MemoryResult>;
  forget(criteria: ForgetCriteria): Promise<void>;
  recall(query: string, options?: RecallOptions): Promise<MemoryCollection>;
  generateIndex(): Promise<MemoryResult>;
  purgeExpired(): Promise<MemoryResult>;
  traverse(startId: string, depth: number): Promise<TraversedKnowledge>;
  visualize(): Promise<string>;
}
