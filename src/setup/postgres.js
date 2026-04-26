import pool from '../config/postgres.js';
import {
  CREATE_SCHEMA,
  CREATE_MUNICIPIOS,
  CREATE_INDEXES,
} from '../schemas/postgres.js';

async function setup() {
  const client = await pool.connect();
  try {
    console.log('Criando schema geo...');
    await client.query(CREATE_SCHEMA);

    console.log('Criando tabela geo.municipality...');
    await client.query(CREATE_MUNICIPIOS);

    console.log('Criando índices espaciais...');
    const statements = CREATE_INDEXES.split(';').filter((s) => s.trim());
    for (const stmt of statements) {
      await client.query(stmt);
    }

    console.log('Setup PostgreSQL concluído.');
  } finally {
    client.release();
    await pool.end();
  }
}

setup().catch((err) => {
  console.error('Erro no setup PostgreSQL:', err.message);
  process.exit(1);
});
