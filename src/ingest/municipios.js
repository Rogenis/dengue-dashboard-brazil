import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { DBFFile } from 'dbffile';

import client from '../config/clickhouse.js';
import { BatchWriter } from '../streams/batch-writer.js';
import { MunicipiosTransform } from '../streams/municipios-transforms.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = join(__dirname, '..', '..', 'datasets', 'BR_Municipios_2025.dbf');

async function main() {
  console.log('=== Pipeline de Ingestão: BR_Municípios → ClickHouse ===\n');
  const start = Date.now();

  const dbf = await DBFFile.open(FILE, { encoding: 'latin1' });
  console.log(`  Registros no DBF: ${dbf.recordCount}`);
  console.log(`  Campos: ${dbf.fields.map((f) => f.name).join(', ')}\n`);

  const transform = new MunicipiosTransform();
  const writer = new BatchWriter(client, 'municipios', { batchSize: 2000 });

  const BLOCK_SIZE = 500;
  let offset = 0;

  while (offset < dbf.recordCount) {
    const records = await dbf.readRecords(BLOCK_SIZE);
    for (const rec of records) {
      const row = {};
      for (const field of dbf.fields) {
        row[field.name] = rec[field.name] != null ? String(rec[field.name]) : '';
      }
      transform.write(row);
    }
    offset += records.length;
    if (records.length < BLOCK_SIZE) break;
  }

  await new Promise((resolve, reject) => {
    transform.pipe(writer);
    transform.end();
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\nConcluído: ${writer.totalInserted.toLocaleString('pt-BR')} registros em ${elapsed}s`);
  await client.close();
}

main().catch((err) => {
  console.error('Erro:', err.message);
  process.exit(1);
});
