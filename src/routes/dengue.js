import { Router } from 'express';
import client from '../config/clickhouse.js';

const router = Router();

// ─── Casos de dengue agregados por município ───
router.get('/municipios', async (req, res) => {
  try {
    const result = await client.query({
      query: `
        SELECT
          c.id_municip AS ibge_code,
          m.nm_mun AS nome,
          m.sigla_uf AS uf,
          count() AS casos,
          countIf(classi_fin = 'dengue_grave') AS casos_graves,
          countIf(hospitaliz = 'sim') AS hospitalizacoes,
          countIf(evolucao = 'obito_por_dengue') AS obitos
        FROM casos_dengue c
        JOIN municipios m ON c.id_municip = m.cd_mun_6
        GROUP BY c.id_municip, m.nm_mun, m.sigla_uf
        ORDER BY casos DESC
      `,
      format: 'JSONEachRow',
    });
    const data = await result.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Casos de dengue como pontos (via estabelecimento) ───
router.get('/pontos', async (req, res) => {
  try {
    const { uf } = req.query;
    let whereClause = 'WHERE e.nu_latitude IS NOT NULL AND e.nu_longitude IS NOT NULL';
    if (uf) whereClause += ` AND c.sg_uf_not = '${uf.replace(/[^0-9]/g, '')}'`;

    const result = await client.query({
      query: `
        SELECT
          e.nu_latitude AS lat,
          e.nu_longitude AS lon,
          count() AS casos
        FROM casos_dengue c
        JOIN estabelecimentos_saude e ON c.id_unidade = e.co_cnes
        ${whereClause}
        GROUP BY e.nu_latitude, e.nu_longitude
        LIMIT 10000
      `,
      format: 'JSONEachRow',
    });
    const data = await result.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
