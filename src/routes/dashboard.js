import { Router } from 'express';
import client from '../config/clickhouse.js';

const router = Router();

// UFs por região (códigos IBGE de 2 dígitos)
const REGIAO_UFS = {
  norte: ['11', '12', '13', '14', '15', '16', '17'],
  nordeste: ['21', '22', '23', '24', '25', '26', '27', '28', '29'],
  sudeste: ['31', '32', '33', '35'],
  sul: ['41', '42', '43'],
  centro_oeste: ['50', '51', '52', '53'],
};

// Sigla UF → código IBGE de 2 dígitos
const UF_SIGLA_TO_CODE = {
  AC:'12',AL:'27',AM:'13',AP:'16',BA:'29',CE:'23',DF:'53',ES:'32',
  GO:'52',MA:'21',MG:'31',MS:'50',MT:'51',PA:'15',PB:'25',PE:'26',
  PI:'22',PR:'41',RJ:'33',RN:'24',RO:'11',RR:'14',RS:'43',SC:'42',
  SE:'28',SP:'35',TO:'17',
};

// Parse periodo: "2025", "2025-Q1", "2026-Q2" etc.
function parsePeriodo(periodo) {
  if (!periodo) return null;
  const match = periodo.match(/^(\d{4})(?:-Q(\d))?$/);
  if (!match) return null;
  const year = Number(match[1]);
  if (match[2]) {
    const q = Number(match[2]);
    const startMonth = (q - 1) * 3 + 1;
    const endMonth = startMonth + 2;
    return { year, startMonth, endMonth };
  }
  return { year, startMonth: null, endMonth: null };
}

function buildWhere(req) {
  const { regiao, uf, periodo } = req.query;
  const conds = [];
  if (uf) {
    const code = UF_SIGLA_TO_CODE[uf.toUpperCase()];
    if (code) conds.push(`sg_uf_not = '${code}'`);
  } else if (regiao) {
    const key = regiao.toLowerCase().replace('-', '_');
    const ufs = REGIAO_UFS[key];
    if (ufs) {
      const joined = ufs.map(u => `'${u}'`).join(',');
      conds.push(`substring(toString(id_municip), 1, 2) IN (${joined})`);
    }
  }
  if (periodo) {
    const p = parsePeriodo(periodo);
    if (p) {
      conds.push(`toYear(dt_notific) = ${p.year}`);
      if (p.startMonth) conds.push(`toMonth(dt_notific) >= ${p.startMonth}`);
      if (p.endMonth) conds.push(`toMonth(dt_notific) <= ${p.endMonth}`);
    }
  }
  return conds.length ? ' WHERE ' + conds.join(' AND ') : '';
}

function buildWhereEstab(req) {
  const { regiao, uf } = req.query;
  if (uf) {
    const code = UF_SIGLA_TO_CODE[uf.toUpperCase()];
    if (code) return ` AND co_uf = '${code}'`;
  }
  if (regiao) {
    const key = regiao.toLowerCase().replace('-', '_');
    const ufs = REGIAO_UFS[key];
    if (ufs) {
      const joined = ufs.map(u => `'${u}'`).join(',');
      return ` AND co_uf IN (${joined})`;
    }
  }
  return '';
}

// ─── Métricas gerais ───
router.get('/resumo', async (req, res) => {
  try {
    const where = buildWhere(req);
    const result = await client.query({
      query: `
        SELECT
          count() AS total_casos,
          countIf(classi_fin = 'dengue_grave') AS graves,
          countIf(classi_fin = 'dengue_com_alarme') AS com_alarme,
          countIf(hospitaliz = 'sim') AS hospitalizacoes,
          countIf(evolucao = 'obito_por_dengue') AS obitos,
          uniqExact(id_municip) AS municipios_afetados,
          uniqExact(sg_uf_not) AS ufs_afetadas,
          min(dt_notific) AS primeira_notif,
          max(dt_notific) AS ultima_notif
        FROM casos_dengue${where}
      `,
      format: 'JSONEachRow',
    });
    const data = await result.json();
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Casos por mês ───
router.get('/mensal', async (req, res) => {
  try {
    const where = buildWhere(req);
    const result = await client.query({
      query: `
        SELECT
          toStartOfMonth(dt_notific) AS mes,
          count() AS casos,
          countIf(classi_fin = 'dengue_grave') AS graves,
          countIf(hospitaliz = 'sim') AS hospitalizacoes,
          countIf(evolucao = 'obito_por_dengue') AS obitos
        FROM casos_dengue${where}
        GROUP BY mes
        ORDER BY mes
      `,
      format: 'JSONEachRow',
    });
    const data = await result.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Top 10 estados ───
router.get('/top-estados', async (req, res) => {
  try {
    const where = buildWhere(req);
    // When filtering, add WHERE via join condition
    const whereJoin = where ? where.replace(' WHERE ', ' AND ') : '';
    const result = await client.query({
      query: `
        SELECT
          m.sigla_uf AS uf,
          count() AS casos,
          countIf(classi_fin = 'dengue_grave') AS graves,
          countIf(hospitaliz = 'sim') AS hospitalizacoes,
          countIf(evolucao = 'obito_por_dengue') AS obitos
        FROM casos_dengue c
        JOIN municipios m ON c.id_municip = m.cd_mun_6
        WHERE 1=1${whereJoin}
        GROUP BY m.sigla_uf
        ORDER BY casos DESC
        LIMIT 10
      `,
      format: 'JSONEachRow',
    });
    const data = await result.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Distribuição por classificação final ───
router.get('/classificacao', async (req, res) => {
  try {
    const where = buildWhere(req);
    const result = await client.query({
      query: `
        SELECT
          if(classi_fin IS NULL, 'sem_classificacao', CAST(classi_fin AS String)) AS classificacao,
          count() AS total
        FROM casos_dengue${where}
        GROUP BY classificacao
        ORDER BY total DESC
      `,
      format: 'JSONEachRow',
    });
    const data = await result.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Distribuição por faixa etária ───
router.get('/faixa-etaria', async (req, res) => {
  try {
    const where = buildWhere(req);
    const result = await client.query({
      query: `
        SELECT
          multiIf(
            idade_anos IS NULL, 'Não informado',
            idade_anos < 10, '0-9',
            idade_anos < 20, '10-19',
            idade_anos < 30, '20-29',
            idade_anos < 40, '30-39',
            idade_anos < 50, '40-49',
            idade_anos < 60, '50-59',
            idade_anos < 70, '60-69',
            '70+'
          ) AS faixa,
          count() AS total
        FROM casos_dengue${where}
        GROUP BY faixa
        ORDER BY faixa
      `,
      format: 'JSONEachRow',
    });
    const data = await result.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Tipos de estabelecimento (top 10) ───
router.get('/tipos-estabelecimento', async (req, res) => {
  try {
    const extra = buildWhereEstab(req);
    const result = await client.query({
      query: `
        SELECT
          tp_unidade AS tipo,
          count() AS total
        FROM estabelecimentos_saude
        WHERE ativo = true${extra}
        GROUP BY tp_unidade
        ORDER BY total DESC
        LIMIT 10
      `,
      format: 'JSONEachRow',
    });
    const data = await result.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Casos por tipo de unidade notificadora ───
router.get('/casos-por-unidade', async (req, res) => {
  try {
    const where = buildWhere(req);
    const and = where ? where.replace(' WHERE ', ' AND ') : '';
    const result = await client.query({
      query: `
        SELECT
          e.tp_unidade AS tipo,
          count() AS casos
        FROM casos_dengue c
        JOIN estabelecimentos_saude e ON c.id_unidade = e.co_cnes
        WHERE 1=1${and}
        GROUP BY e.tp_unidade
        ORDER BY casos DESC
        LIMIT 10
      `,
      format: 'JSONEachRow',
    });
    const data = await result.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Comparativo anual (mês a mês) ───
router.get('/comparativo-anual', async (req, res) => {
  try {
    const where = buildWhere(req);
    const and = where ? where.replace(' WHERE ', ' AND ') : '';
    const result = await client.query({
      query: `
        SELECT
          toMonth(dt_notific) AS mes,
          toYear(dt_notific) AS ano,
          count() AS casos,
          countIf(classi_fin = 'dengue_grave') AS graves,
          countIf(hospitaliz = 'sim') AS hospitalizacoes,
          countIf(evolucao = 'obito_por_dengue') AS obitos
        FROM casos_dengue
        WHERE toYear(dt_notific) IN (2025, 2026)${and}
        GROUP BY ano, mes
        ORDER BY ano, mes
      `,
      format: 'JSONEachRow',
    });
    const data = await result.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Casos por estado (todos, para choropleth) ───
router.get('/mapa-estados', async (req, res) => {
  try {
    const where = buildWhere(req);
    const and = where ? where.replace(' WHERE ', ' AND ') : '';
    const result = await client.query({
      query: `
        SELECT
          m.sigla_uf AS uf,
          count() AS casos,
          countIf(classi_fin = 'dengue_grave') AS graves,
          countIf(hospitaliz = 'sim') AS hospitalizacoes,
          countIf(evolucao = 'obito_por_dengue') AS obitos
        FROM casos_dengue c
        JOIN municipios m ON c.id_municip = m.cd_mun_6
        WHERE 1=1${and}
        GROUP BY m.sigla_uf
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

export default router;
