import { app } from 'electron';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const DDRAGON_BASE = 'https://ddragon.leagueoflegends.com';

export type DataDragonStatus = {
  version: string;
  source: 'network' | 'cache' | 'bundled';
};

/**
 * Resolves and caches the active Data Dragon patch version plus its item
 * and champion JSON (section 7.2). The recommendation engine itself scores
 * from the curated catalog in shared/config/items.ts -- this service exists
 * to surface a real, current patch version and real item/champion metadata
 * to the UI, and to keep that data available offline.
 */
export class DataDragonService {
  private cacheDir: string;
  private status: DataDragonStatus = { version: 'unknown', source: 'bundled' };

  constructor() {
    this.cacheDir = join(app.getPath('userData'), 'ddragon-cache');
  }

  getStatus(): DataDragonStatus {
    return this.status;
  }

  async initialize(): Promise<DataDragonStatus> {
    try {
      const version = await this.resolveLatestVersion();
      const [items, champions] = await Promise.all([
        this.fetchJson(`${DDRAGON_BASE}/cdn/${version}/data/en_US/item.json`),
        this.fetchJson(`${DDRAGON_BASE}/cdn/${version}/data/en_US/champion.json`),
      ]);
      await this.writeCache(version, items, champions);
      this.status = { version, source: 'network' };
      return this.status;
    } catch {
      const cached = await this.readNewestCache();
      this.status = cached ?? { version: 'bundled-fallback', source: 'bundled' };
      return this.status;
    }
  }

  private async resolveLatestVersion(): Promise<string> {
    const response = await fetch(`${DDRAGON_BASE}/api/versions.json`);
    if (!response.ok) throw new Error(`versions.json request failed: ${response.status}`);
    const versions = (await response.json()) as unknown;
    if (!Array.isArray(versions) || typeof versions[0] !== 'string') {
      throw new Error('versions.json had an unexpected shape');
    }
    return versions[0];
  }

  private async fetchJson(url: string): Promise<unknown> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${url} request failed: ${response.status}`);
    return response.json();
  }

  private async writeCache(version: string, items: unknown, champions: unknown): Promise<void> {
    const versionDir = join(this.cacheDir, version);
    await mkdir(versionDir, { recursive: true });
    await Promise.all([
      writeFile(join(versionDir, 'item.json'), JSON.stringify(items)),
      writeFile(join(versionDir, 'champion.json'), JSON.stringify(champions)),
      writeFile(join(this.cacheDir, 'latest-version.txt'), version),
    ]);
  }

  private async readNewestCache(): Promise<DataDragonStatus | undefined> {
    try {
      const version = (await readFile(join(this.cacheDir, 'latest-version.txt'), 'utf-8')).trim();
      if (!version) return undefined;
      // Confirm the cached files actually exist before trusting them.
      await readFile(join(this.cacheDir, version, 'item.json'), 'utf-8');
      return { version, source: 'cache' };
    } catch {
      return undefined;
    }
  }
}
