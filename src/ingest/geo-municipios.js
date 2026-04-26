import { open } from 'shapefile';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import pool from '../config/postgres.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHP_FILE = join(__dirname, '..', '..', 'datasets', 'BR_Municipios_2025.shp');
const DBF_FILE = join(__dirname, '..', '..', 'datasets', 'BR_Municipios_2025.dbf');

const BATCH_SIZE = 200;

const INSERT_SQL = `
  INSERT INTO geo.municipality
    (name, ibge_code, ibge_code_full, state_code, state_abbr,
     region_code, region_name, area_km2, shape, geojson, center_point)
  VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8,
     ST_SetSRID(ST_GeomFromGeoJSON($9), 4326),
     $10::jsonb,
     ST_Centroid(ST_SetSRID(ST_GeomFromGeoJSON($9), 4326)))
  ON CONFLICT (ibge_code) DO UPDATE SET
    shape = EXCLUDED.shape,
    geojson = EXCLUDED.geojson,
    center_point = EXCLUDED.center_point,
    updated_at = CURRENT_TIMESTAMP
`;

function fixEncoding(str) {
  try {
    return Buffer.from(str, 'latin1').toString('utf8');
  } catch {
    return str;
  }
}

function ensureMultiPolygon(geometry) {
  if (geometry.type === 'Polygon') {
    return { type: 'MultiPolygon', coordinates: [geometry.coordinates] };
  }
  return geometry;
}

async function main() {
  console.log('=== Pipeline de Ingestão: Shapefile Municípios → PostgreSQL/PostGIS ===\n');
  const start = Date.now();

  const source = await open(SHP_FILE, DBF_FILE, { encoding: 'latin1' });

  const client = await pool.connect();
  let total = 0;
  let batch = [];

  async function flushBatch() {
    if (batch.length === 0) return;
    await client.query('BEGIN');
    for (const params of batch) {
      await client.query(INSERT_SQL, params);
    }
    await client.query('COMMIT');
    total += batch.length;
    if (total % 1000 === 0 || batch.length < BATCH_SIZE) {
      console.log(`  [geo.municipality] ${total.toLocaleString('pt-BR')} registros inseridos`);
    }
    batch = [];
  }

  try {
    let result = await source.read();

    while (!result.done) {
      const { properties, geometry } = result.value;

      const cdMun = properties.CD_MUN;
      const multiGeom = ensureMultiPolygon(geometry);
      const geojsonStr = JSON.stringify(multiGeom);

      const params = [
        fixEncoding(properties.NM_MUN),
        parseInt(cdMun.substring(0, 6), 10),
        parseInt(cdMun, 10),
        parseInt(properties.CD_UF, 10),
        properties.SIGLA_UF,
        parseInt(properties.CD_REGIAO, 10),
        fixEncoding(properties.NM_REGIAO),
        properties.AREA_KM2 || null,
        geojsonStr,
        geojsonStr,
      ];

      batch.push(params);
      if (batch.length >= BATCH_SIZE) {
        await flushBatch();
      }

      result = await source.read();
    }

    await flushBatch();
    console.log(`  [geo.municipality] ${total.toLocaleString('pt-BR')} registros inseridos`);
  } finally {
    client.release();
    await pool.end();
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\nConcluído: ${total.toLocaleString('pt-BR')} registros em ${elapsed}s`);
}

main().catch((err) => {
  console.error('Erro:', err.message);
  process.exit(1);
});
