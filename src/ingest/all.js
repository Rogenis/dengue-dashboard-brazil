import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const scripts = [
  { name: 'Setup Database', file: join(__dirname, '..', 'setup', 'clickhouse.js') },
  { name: 'Municípios', file: join(__dirname, 'municipios.js') },
  { name: 'CNES Estabelecimentos', file: join(__dirname, 'cnes.js') },
  { name: 'Dengue (2025 + 2026)', file: join(__dirname, 'dengue.js') },
];

console.log('╔══════════════════════════════════════════════╗');
console.log('║  Pipeline de Ingestão — Dengue / ClickHouse  ║');
console.log('╚══════════════════════════════════════════════╝\n');

for (const { name, file } of scripts) {
  console.log(`▶ ${name}`);
  try {
    execSync(`node ${file}`, { stdio: 'inherit' });
    console.log(`✔ ${name} — OK\n`);
  } catch {
    console.error(`✘ ${name} — FALHOU\n`);
    process.exit(1);
  }
}

console.log('Pipeline completo.');
