import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve(import.meta.dirname, '../../.env.local');
let apiBaseUrl = 'http://localhost:5261/api';

try {
  const entry = readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .find((line) => line.startsWith('VITE_API_BASE_URL='));
  if (entry) apiBaseUrl = entry.slice('VITE_API_BASE_URL='.length).trim();
} catch {
  console.warn('No root .env.local found; using the local API default.');
}

if (!/^https?:\/\//.test(apiBaseUrl)) {
  throw new Error('VITE_API_BASE_URL must be an absolute http(s) URL.');
}

const target = resolve(import.meta.dirname, '../src/app/core/api.local.ts');
writeFileSync(target, `// Generated from the repository root .env.local. Do not commit.\nexport const apiBaseUrl = ${JSON.stringify(apiBaseUrl)};\n`, 'utf8');
