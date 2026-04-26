import { createClient } from '@clickhouse/client';
import client from '../config/clickhouse.js';
import {
  CREATE_DATABASE,
  CREATE_CASOS_DENGUE,
  CREATE_ESTABELECIMENTOS,
  CREATE_MUNICIPIOS,
} from '../schemas/clickhouse.js';

async function setup() {
  // Client sem database para poder criar o database
  const rootClient = createClient({
    url: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
    username: process.env.CLICKHOUSE_USER || 'default',
    password: process.env.CLICKHOUSE_PASSWORD || '',
  });

  console.log('Criando database prix_onboarding_db...');
  await rootClient.command({ query: CREATE_DATABASE });
  await rootClient.close();

  console.log('Criando tabela casos_dengue...');
  await client.command({ query: CREATE_CASOS_DENGUE });

  console.log('Criando tabela estabelecimentos_saude...');
  await client.command({ query: CREATE_ESTABELECIMENTOS });

  console.log('Criando tabela municipios...');
  await client.command({ query: CREATE_MUNICIPIOS });

  console.log('Setup concluído.');
  await client.close();
}

setup().catch((err) => {
  console.error('Erro no setup:', err.message);
  process.exit(1);
});
