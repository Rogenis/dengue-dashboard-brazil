import { Router } from 'express';
import pool from '../config/postgres.js';

const router = Router();

// ─── Cache ───
const regiaoCache = {};
let estadosCache = null;

const REGIOES = {
  norte: [11, 12, 13, 14, 15, 16, 17],
  nordeste: [21, 22, 23, 24, 25, 26, 27, 28, 29],
  sudeste: [31, 32, 33, 35],
  sul: [41, 42, 43],
  centro_oeste: [50, 51, 52, 53],
};

// ─── GeoJSON dos municípios de uma UF ───
router.get('/municipios/:uf', async (req, res) => {
  try {
    const { uf } = req.params;
    const result = await pool.query(
      `SELECT jsonb_build_object(
          'type', 'FeatureCollection',
          'features', jsonb_agg(
            jsonb_build_object(
              'type', 'Feature',
              'properties', jsonb_build_object(
                'name', name,
                'ibge_code', ibge_code,
                'state', state_abbr,
                'area_km2', round(area_km2::numeric, 2)
              ),
              'geometry', geojson
            )
          )
        ) AS geojson
       FROM geo.municipality
       WHERE UPPER(state_abbr) = UPPER($1)`,
      [uf],
    );
    res.json(result.rows[0]?.geojson || { type: 'FeatureCollection', features: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Centro de todos municípios (pontos) ───
router.get('/municipios', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT jsonb_build_object(
          'type', 'FeatureCollection',
          'features', jsonb_agg(
            jsonb_build_object(
              'type', 'Feature',
              'properties', jsonb_build_object(
                'name', name,
                'ibge_code', ibge_code,
                'state', state_abbr
              ),
              'geometry', jsonb_build_object(
                'type', 'Point',
                'coordinates', ARRAY[ST_X(center_point), ST_Y(center_point)]
              )
            )
          )
        ) AS geojson
       FROM geo.municipality`,
    );
    res.json(result.rows[0]?.geojson || { type: 'FeatureCollection', features: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Outline de uma região (para Turf.js) ───
router.get('/regiao/:regiao', async (req, res) => {
  try {
    const regiao = req.params.regiao.toLowerCase().replace('-', '_');
    const ufs = REGIOES[regiao];
    if (!ufs) return res.status(400).json({ error: 'Região inválida' });

    if (regiaoCache[regiao]) return res.json(regiaoCache[regiao]);

    const result = await pool.query(
      `SELECT jsonb_build_object(
          'type', 'FeatureCollection',
          'features', jsonb_agg(feat)
        ) AS geojson
       FROM (
         SELECT jsonb_build_object(
           'type', 'Feature',
           'properties', jsonb_build_object(
             'state', state_abbr,
             'region', region_name
           ),
           'geometry', ST_AsGeoJSON(ST_Simplify(ST_Union(shape), 0.01))::jsonb
         ) AS feat
         FROM geo.municipality
         WHERE state_code = ANY($1)
         GROUP BY state_abbr, region_name
       ) sub`,
      [ufs],
    );
    regiaoCache[regiao] = result.rows[0]?.geojson || { type: 'FeatureCollection', features: [] };
    res.json(regiaoCache[regiao]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Limites dos estados (simplificados, com cache) ───
router.get('/estados', async (req, res) => {
  try {
    if (estadosCache) return res.json(estadosCache);

    const result = await pool.query(
      `SELECT jsonb_build_object(
          'type', 'FeatureCollection',
          'features', jsonb_agg(feat)
        ) AS geojson
       FROM (
         SELECT jsonb_build_object(
           'type', 'Feature',
           'properties', jsonb_build_object(
             'state', state_abbr,
             'municipios', count(*)
           ),
           'geometry', ST_AsGeoJSON(ST_Simplify(ST_Union(shape), 0.05))::jsonb
         ) AS feat
         FROM geo.municipality
         GROUP BY state_abbr
       ) sub`,
    );
    estadosCache = result.rows[0]?.geojson || { type: 'FeatureCollection', features: [] };
    res.json(estadosCache);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
