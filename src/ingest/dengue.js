import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pipeline } from 'stream/promises';
import csvParser from 'csv-parser';

import client from '../config/clickhouse.js';
import { BatchWriter } from '../streams/batch-writer.js';
import { DengueFilter, DengueTransform } from '../streams/dengue-transforms.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATASETS_DIR = join(__dirname, '..', '..', 'datasets');

const FILES = [
  { file: 'DENGBR25.csv', separator: ',' },
  { file: 'DENGBR26.csv', separator: ',' },
];

async function ingestFile({ file, separator }) {
  const filePath = join(DATASETS_DIR, file);
  console.log(`\nProcessando ${file}...`);
  const start = Date.now();

  const readable = fs.createReadStream(filePath, { encoding: 'latin1' });
  const parser = csvParser({ separator });
  const filter = new DengueFilter();
  const transform = new DengueTransform(file);
  const writer = new BatchWriter(client, 'casos_dengue', { batchSize: 5000 });

  await pipeline(readable, parser, filter, transform, writer);

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`  ${file} concluído: ${writer.totalInserted.toLocaleString('pt-BR')} registros em ${elapsed}s`);

  return writer.totalInserted;
}

async function main() {
  console.log('=== Pipeline de Ingestão: Dengue → ClickHouse ===\n');
  let total = 0;

  for (const cfg of FILES) {
    total += await ingestFile(cfg);
  }

  console.log(`\nTotal inserido: ${total.toLocaleString('pt-BR')} registros`);
  await client.close();
}

main().catch((err) => {
  console.error('Erro:', err.message);
  process.exit(1);
});
