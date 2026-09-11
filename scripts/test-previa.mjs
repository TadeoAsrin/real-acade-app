import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const output = mkdtempSync(join(tmpdir(), 'real-acade-previa-'));
try {
  const compile = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', '--target', 'ES2022', '--module', 'commonjs', '--moduleResolution', 'node', '--strict', '--esModuleInterop', '--skipLibCheck', '--outDir', output, 'tests/previa.test.ts'], { stdio: 'inherit' });
  if (compile.status !== 0) process.exitCode = compile.status ?? 1;
  else {
    const test = spawnSync(process.execPath, ['--test', join(output, 'tests/previa.test.js')], { stdio: 'inherit', env: { ...process.env, NODE_PATH: resolve('node_modules') } });
    process.exitCode = test.status ?? 1;
  }
} finally { rmSync(output, { recursive: true, force: true }); }
