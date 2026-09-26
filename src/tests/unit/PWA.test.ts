import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';

function findRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, 'public', 'manifest.webmanifest'))) return dir;
    dir = dirname(dir);
  }
  throw new Error('project root not found');
}
const ROOT = findRoot(process.cwd());

describe('PWA configuration', () => {
  it('manifest is valid JSON with required fields', () => {
    const m = JSON.parse(readFileSync(join(ROOT, 'public/manifest.webmanifest'), 'utf8'));
    expect(m.name).toContain('TIRTAWANA');
    expect(m.orientation).toBe('landscape'); // landscape-first, non-negotiable
    expect(m.display).toBeDefined();
    expect(m.icons.length).toBeGreaterThanOrEqual(2);
    expect(m.icons.some((i: any) => i.purpose === 'maskable')).toBe(true);
    for (const icon of m.icons) expect(icon.sizes).toMatch(/^\d+x\d+$/);
  });

  it('service worker declares a version and precache list', () => {
    const sw = readFileSync(join(ROOT, 'public/sw.js'), 'utf8');
    expect(sw).toContain('CACHE_VERSION');
    expect(sw).toContain('offline.html');
    expect(sw).toContain('install');
    expect(sw).toContain('activate');
    expect(sw).toContain('fetch');
    // Safe invalidation: old caches deleted on activate
    expect(sw).toContain('caches.delete');
  });

  it('offline fallback page exists and mentions the game', () => {
    const html = readFileSync(join(ROOT, 'public/offline.html'), 'utf8');
    expect(html).toContain('TIRTAWANA');
    expect(html).toContain('offline');
  });

  it('index.html links the manifest', () => {
    const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
    expect(html).toContain('manifest.webmanifest');
  });
});
