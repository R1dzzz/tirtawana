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

describe('Android CI configuration', () => {
  it('android workflow triggers on version tags', () => {
    const yml = readFileSync(join(ROOT, '.github/workflows/android.yml'), 'utf8');
    expect(yml).toContain("tags: ['v*']");
    expect(yml).toContain('assembleRelease');
    expect(yml).toContain('bundleRelease');
    expect(yml).toContain('actions/upload-artifact');
  });

  it('workflow uses JDK 17 and node 20 (Capacitor 6 requirements)', () => {
    const yml = readFileSync(join(ROOT, '.github/workflows/android.yml'), 'utf8');
    expect(yml).toContain('java-version: 17');
    expect(yml).toContain('node-version: 20');
  });

  it('capacitor config points at dist and has an android appId', () => {
    const cfg = readFileSync(join(ROOT, 'capacitor.config.ts'), 'utf8');
    expect(cfg).toContain("webDir: 'dist'");
    expect(cfg).toContain("appId: 'studio.dystancee.tirtawana'");
  });

  it('signing docs exist and reference the repo secret name', () => {
    const doc = readFileSync(join(ROOT, 'android-signing.md'), 'utf8');
    expect(doc).toContain('RELEASE_KEYSTORE_BASE64');
    expect(doc).toContain('keytool');
  });
});
