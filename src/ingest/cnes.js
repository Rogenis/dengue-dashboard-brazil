import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pipeline } from 'stream/promises';
import csvParser from 'csv-parser';

import client from '../config/clickhouse.js';
import { BatchWriter } from '../streams/batch-writer.js';
import { CnesTransform } from '../streams/cnes-transforms.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = join(__dirname, '..', '..', 'datasets', 'cnes_estabelecimentos.csv');

async function main() {
  console.log('=== Pipeline de Ingestão: CNES Estabelecimentos → ClickHouse ===\n');
  const start = Date.now();

  const readable = fs.createReadStream(FILE, { encoding: 'latin1' });
  const parser = csvParser({ separator: ';' });
  const transform = new CnesTransform();
  const writer = new BatchWriter(client, 'estabelecimentos_saude', { batchSize: 5000 });

  await pipeline(readable, parser, transform, writer);

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\nConcluído: ${writer.totalInserted.toLocaleString('pt-BR')} registros em ${elapsed}s`);
  await client.close();
}

main().catch((err) => {
  console.error('Erro:', err.message);
  process.exit(1);
});
