import { Router } from 'express';
import client from '../config/clickhouse.js';

const router = Router();

// ─── Estabelecimentos de saúde com coordenadas ───
router.get('/', async (req, res) => {
  try {
    const { uf } = req.query;
    let whereClause = 'WHERE nu_latitude IS NOT NULL AND nu_longitude IS NOT NULL AND ativo = true';
    if (uf) whereClause += ` AND co_uf = '${uf.replace(/[^0-9]/g, '')}'`;

    // Com UF: retorna todos os estabelecimentos do estado
    // Sem UF: amostra distribuida por UF (cityHash64 para aleatoriedade deterministica)
    const query = uf
      ? `SELECT co_cnes, no_fantasia AS nome, co_ibge AS ibge_code,
           nu_latitude AS lat, nu_longitude AS lon, tp_unidade
         FROM estabelecimentos_saude ${whereClause}`
      : `SELECT co_cnes, no_fantasia AS nome, co_ibge AS ibge_code,
           nu_latitude AS lat, nu_longitude AS lon, tp_unidade
         FROM estabelecimentos_saude ${whereClause}
         ORDER BY cityHash64(co_cnes)
         LIMIT 30000`;

    const result = await client.query({
      query,
      format: 'JSONEachRow',
    });
    const data = await result.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
