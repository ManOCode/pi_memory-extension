import { 
  IMemoryBehavior, 
  IMemoryStore, 
  MemoryMetadata, 
  MemoryResult, 
  ForgetCriteria, 
  RecallOptions, 
  MemoryCollection, 
  MemoryEntry,
  MemoryPriority,
  TraversedKnowledge
} from "../abstraction/types.js";

export class MemoryManager implements IMemoryBehavior {

  constructor(private store: IMemoryStore) {}

  private serializeMetadata(metadata: MemoryMetadata): string {
    const lines = ["---"];
    for (const [key, value] of Object.entries(metadata)) {
      if (Array.isArray(value)) {
        lines.push(`${key}: [${value.join(", ")}]`);
      } else {
        lines.push(`${key}: ${value}`);
      }
    }
    lines.push("---");
    return lines.join("\n") + "\n";
  }

  private normalize(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
      .trim();
  }

  private deserializeMetadata(content: string): { metadata: MemoryMetadata, body: string } {
    try {
      const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
      if (!match) {
        return { metadata: {}, body: content };
      }

      const metadataLines = match[1].split("\n");
      const metadata: MemoryMetadata = {};
      const body = match[2];

      for (const line of metadataLines) {
        const [key, ...valueParts] = line.split(": ");
        if (!key || key.trim() === "") continue;
        
        let value: string | string[] = valueParts.join(": ").trim();
        if (typeof value === 'string' && value.startsWith("[") && value.endsWith("]")) {
          value = value.slice(1, -1).split(",").map(v => v.trim()).filter(v => v !== "");
        }
        
        (metadata as Record<string, any>)[key.trim()] = value;
      }

      return { metadata, body };
    } catch (e) {
      console.error(`[MemoryManager] Metadata parsing failed. Returning empty metadata. Error: ${e}`);
      return { metadata: {}, body: content };
    }
  }

  async remember(id: string, content: string, metadata: MemoryMetadata = {}, mode: 'append' | 'replace' = 'append'): Promise<MemoryResult> {
    const now = new Date();
    const nowIso = now.toISOString();
    
    if (content.trim().length > 5) {
      const normalizedContent = this.normalize(content);
      const ids = await this.store.listIdentifiers();
      for (const existingId of ids) {
        const raw = await this.store.retrieve(existingId);
        if (raw) {
          const { body } = this.deserializeMetadata(raw);
          if (this.normalize(body).includes(normalizedContent)) {
            return {
              status: 'error',
              id: existingId,
              message: `Duplicate information already exists in memory: ${existingId}`
            };
          }
        }
      }
    }

    const rawExisting = await this.store.retrieve(id);
    let status: 'success' | 'updated' = 'success';
    let finalMetadata = { ...metadata };
    let body = "";

    if (rawExisting) {
      const { metadata: existingMeta, body: existingBody } = this.deserializeMetadata(rawExisting);
      finalMetadata = { ...existingMeta, ...metadata };
      const dateStr = nowIso.split("T")[0];
      
      if (mode === 'replace') {
        body = `# Knowledge: ${id}\n- Last Updated: ${dateStr}\n\n## Summary\n${content}\n\n## History\n${existingBody}\n\n---\n`;
      } else {
        body = `${existingBody}\n\n## Update (${dateStr})\n${content}\n`;
      }
      status = 'updated';
    } else {
      finalMetadata.timestamp = nowIso;
      const dateStr = nowIso.split("T")[0];
      body = `# Knowledge: ${id}\n- Date Added: ${dateStr}\n\n## Summary\n${content}\n`;
    }

    if (finalMetadata.priority === MemoryPriority.TRANSIENT) {
      if (!finalMetadata.expiresAt) {
        const ttlHours = (metadata as Record<string, any>).ttl || 24;
        const expiryDate = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);
        finalMetadata.expiresAt = expiryDate.toISOString();
      }
    }

    const related = finalMetadata.related || [];
    let relatedSection = "\n\n## Related\n- [[index]]\n";
    for (const rId of related) {
      relatedSection += `- [[${rId}]]\n`;
    }
    body += relatedSection;

    const finalContent = this.serializeMetadata(finalMetadata) + body;
    await this.store.save(id, finalContent);
    
    for (const rId of related) {
      await this.linkBack(rId, id);
    }

    await this.generateIndex();
    
    return {
      status,
      id,
      message: `Memory ${status === 'updated' ? 'updated' : 'stored'} successfully.`
    };
  }

  private async linkBack(targetId: string, sourceId: string): Promise<void> {
    const raw = await this.store.retrieve(targetId);
    if (!raw) return;

    const { metadata, body } = this.deserializeMetadata(raw);
    const related = metadata.related || [];

    if (related.includes(sourceId)) return;

    const newRelated = [...related, sourceId];
    const newMetadata = { ...metadata, related: newRelated };
    
    let newBody = body;
    const relatedMarker = "## Related";
    const markerIndex = body.indexOf(relatedMarker);
    
    if (markerIndex !== -1) {
        const before = body.substring(0, markerIndex);
        const after = body.substring(body.indexOf("\n", markerIndex + relatedMarker.length)).trim();
        let relatedLinks = "- [[index]]\n";
        for (const rId of newRelated) {
            relatedLinks += `- [[${rId}]]\n`;
        }
        newBody = `${before}${relatedMarker}\n${relatedLinks}\n\n${after}`;
    } else {
        let relatedLinks = "- [[index]]\n";
        for (const rId of newRelated) {
            relatedLinks += `- [[${rId}]]\n`;
        }
        newBody = `${body}\n\n## Related\n${relatedLinks}`;
    }

    await this.store.save(targetId, this.serializeMetadata(newMetadata) + newBody);
  }

  async forget(criteria: ForgetCriteria): Promise<void> {
    if (criteria.id) {
      await this.store.delete(criteria.id);
    } else if (criteria.query) {
      const matches = await this.store.searchRaw(criteria.query);
      for (const id of matches) {
        await this.store.delete(id);
      }
    } else if (criteria.tags && criteria.tags.length > 0) {
      const ids = await this.store.listIdentifiers();
      for (const id of ids) {
        const content = await this.store.retrieve(id);
        if (content) {
          const { metadata } = this.deserializeMetadata(content);
          const tags = Array.isArray(metadata.tags) ? metadata.tags : [];
          const hasTag = criteria.tags.some(tag => tags.includes(tag));
          if (hasTag) {
            await this.store.delete(id);
          }
        }
      }
    }
    await this.generateIndex();
  }

  async purgeExpired(): Promise<MemoryResult> {
    const ids = await this.store.listIdentifiers();
    const now = new Date();
    let purgeCount = 0;

    for (const id of ids) {
      const raw = await this.store.retrieve(id);
      if (raw) {
        const { metadata } = this.deserializeMetadata(raw);
        if (metadata.expiresAt && new Date(metadata.expiresAt) < now) {
          await this.store.delete(id);
          purgeCount++;
        }
      }
    }

    return {
      status: 'success',
      id: 'system',
      message: `Purged ${purgeCount} expired memories.`
    };
  }

  async generateIndex(): Promise<MemoryResult> {
    const ids = await this.store.listIdentifiers();
    const categories: Record<string, string[]> = {};
    const tags: Record<string, string[]> = {};
    
    for (const id of ids) {
      if (id === 'index') continue;
      const raw = await this.store.retrieve(id);
      if (!raw) continue;
      const { metadata } = this.deserializeMetadata(raw);
      const category = metadata.category || 'Uncategorized';
      if (!categories[category]) categories[category] = [];
      categories[category].push(id);
      const memTags = Array.isArray(metadata.tags) ? metadata.tags : [];
      for (const tag of memTags) {
        if (!tags[tag]) tags[tag] = [];
        tags[tag].push(id);
      }
    }

    let indexContent = '# Memory Index\n\n';
    indexContent += `*Last Updated: ${new Date().toISOString()}\n\n`;

    if (Object.keys(categories).length > 0) {
      indexContent += '## Categories\n\n';
      for (const [category, members] of Object.entries(categories)) {
        indexContent += `### ${category}\n`;
        members.forEach(id => {
          indexContent += `- [[${id}]]\n`;
        });
        indexContent += '\n';
      }
    }

    if (Object.keys(tags).length > 0) {
      indexContent += '## Tags\n\n';
      for (const [tag, members] of Object.entries(tags)) {
        indexContent += `### #${tag}\n`;
        members.forEach(id => {
          indexContent += `- [[${id}]]\n`;
        });
        indexContent += '\n';
      }
    }

    if (Object.keys(categories).length === 0 && Object.keys(tags).length === 0) {
      indexContent += 'No structured memories found to index.\n';
    }

    const metadata = {
      category: 'System',
      tags: ['index', 'system'],
      type: 'index'
    };

    const finalContent = this.serializeMetadata(metadata) + indexContent;
    await this.store.save('index', finalContent);

    return {
      status: 'success',
      id: 'index',
      message: 'Global memory index generated successfully.'
    };
  }

  private calculateRelevance(entry: MemoryEntry, query: string, contextHints: string[] = []): number {
    let score = 0;
    const normalizedQuery = this.normalize(query);
    const normalizedBody = this.normalize(entry.content);
    const normalizedId = this.normalize(entry.id);

    if (entry.id === query) {
      score += 100;
    }
    if (normalizedId.includes(normalizedQuery)) {
      score += 50;
    }
    const tags = Array.isArray(entry.metadata.tags) ? entry.metadata.tags : [];
    const category = entry.metadata.category || "";
    if (tags.some(t => this.normalize(t).includes(normalizedQuery)) || this.normalize(category).includes(normalizedQuery)) {
      score += 20;
    }
    if (normalizedBody.includes(normalizedQuery)) {
      score += 10;
    }
    for (const hint of contextHints) {
      const normalizedHint = this.normalize(hint);
      if (normalizedId.includes(normalizedHint)) score += 15; 
      if (normalizedBody.includes(normalizedHint)) score += 5;
      if (tags.some(t => this.normalize(t).includes(normalizedHint))) score += 10;
    }
    return score;
  }

  async recall(query: string, options: RecallOptions = {}): Promise<MemoryCollection> {
    const queryIds = await this.store.searchRaw(query);
    const allMatchingIds = new Set(queryIds);

    if (options.contextHints && options.contextHints.length > 0) {
      for (const hint of options.contextHints) {
        const hintIds = await this.store.searchRaw(hint);
        hintIds.forEach(id => allMatchingIds.add(id));
      }
    }

    const entries: MemoryEntry[] = [];
    const now = new Date();

    for (const id of allMatchingIds) {
      const rawContent = await this.store.retrieve(id);
      if (rawContent) {
        const { metadata, body } = this.deserializeMetadata(rawContent);
        if (metadata.expiresAt && new Date(metadata.expiresAt) < now) continue;
        if (options.category && metadata.category !== options.category) continue;
        if (options.tags && options.tags.length > 0) {
          const memTags = Array.isArray(metadata.tags) ? metadata.tags : [];
          if (!options.tags.every(tag => memTags.includes(tag))) continue;
        }
        const entry: MemoryEntry = { id, content: body, metadata };
        entry.relevanceScore = this.calculateRelevance(entry, query, options.contextHints);
        entries.push(entry);
      }
    }

    const priorityWeight = {
      [MemoryPriority.CRITICAL]: 3,
      [MemoryPriority.STANDARD]: 2,
      [MemoryPriority.TRANSIENT]: 1,
    };

    entries.sort((a, b) => {
      const scoreA = a.relevanceScore || 0;
      const scoreB = b.relevanceScore || 0;
      if (scoreA !== scoreB) return scoreB - scoreA;
      const weightA = priorityWeight[a.metadata.priority || MemoryPriority.STANDARD] || 2;
      const weightB = priorityWeight[b.metadata.priority || MemoryPriority.STANDARD] || 2;
      if (weightA !== weightB) return weightB - weightA;
      if (options.sortBy === 'date') {
        const dateA = new Date(a.metadata.timestamp || 0).getTime();
        const dateB = new Date(b.metadata.timestamp || 0).getTime();
        return options.order === 'desc' ? dateB - dateA : dateA - dateB;
      }
      return 0;
    });

    const offset = options.offset || 0;
    const limit = options.limit || entries.length;
    const slicedEntries = entries.slice(offset, offset + limit);

    return { entries: slicedEntries, total: entries.length };
  }

  async traverse(startId: string, depth: number): Promise<TraversedKnowledge> {
    const layers: { depth: number; entries: MemoryEntry[] }[] = [];
    const visited = new Set<string>();
    let currentQueue: string[] = [startId];
    for (let d = 0; d <= depth; d++) {
      const layerEntries: MemoryEntry[] = [];
      const nextQueue: string[] = [];
      for (const id of currentQueue) {
        if (visited.has(id)) continue;
        visited.add(id);
        const raw = await this.store.retrieve(id);
        if (raw) {
          const { metadata, body } = this.deserializeMetadata(raw);
          layerEntries.push({ id, content: body, metadata });
          const related = metadata.related || [];
          for (const rId of related) {
            if (!visited.has(rId)) nextQueue.push(rId);
          }
        }
      }
      if (layerEntries.length > 0) layers.push({ depth: d, entries: layerEntries });
      currentQueue = nextQueue;
      if (currentQueue.length === 0) break;
    }
    return { rootId: startId, layers };
  }

  async visualize(): Promise<string> {
    const ids = await this.store.listIdentifiers();
    let mermaid = "graph TD\\n";
    const nodeLabels: Record<string, string> = {};
    for (const id of ids) {
      if (id === "index") continue;
      const raw = await this.store.retrieve(id);
      if (!raw) continue;
      const { metadata, body } = this.deserializeMetadata(raw);
      
      let label = id;
      const summaryMarker = "## Summary";
      const markerIndex = body.indexOf(summaryMarker);
      if (markerIndex !== -1) {
        const afterSummary = body.substring(markerIndex + summaryMarker.length).trim();
        const firstLineOfSummary = afterSummary.split(/[\\r\\n]+/)[0].replace(/[\[\]\\(\\)\\\"\\']|#/g, "").trim();
        if (firstLineOfSummary) label = firstLineOfSummary;
      } else {
        const firstLine = body.split(/[\\r\\n]+/)[0].replace(/[\[\]\\(\\)\\\"\\']|#/g, "").trim();
        if (firstLine) label = firstLine;
      }
      
      nodeLabels[id] = label;
      const related = metadata.related || [];
      for (const rId of related) {
        if (rId === "index") continue;
        mermaid += `  ${id} --> ${rId}\\n`;
      }
    }
    for (const [id, label] of Object.entries(nodeLabels)) {
      mermaid += `  ${id}[\"${label}\"]\\n`;
    }
    return "```mermaid\\n" + mermaid + "```";
  }
}
