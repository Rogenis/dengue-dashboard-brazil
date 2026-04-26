/**
 * SQL de criação do schema e tabelas geográficas no PostgreSQL + PostGIS.
 * Padrão baseado na tabela municipality da equipe (schema geo, SRID 4326).
 * Rodar via: node src/setup/postgres.js
 */

export const CREATE_SCHEMA = `CREATE SCHEMA IF NOT EXISTS geo`;

export const CREATE_MUNICIPIOS = `
CREATE TABLE IF NOT EXISTS geo.municipality (
  id                SERIAL PRIMARY KEY,
  name              VARCHAR(255) NOT NULL,
  ibge_code         INT NOT NULL UNIQUE,
  ibge_code_full    INT NOT NULL,
  state_code        SMALLINT NOT NULL,
  state_abbr        VARCHAR(2) NOT NULL,
  region_code       SMALLINT NOT NULL,
  region_name       VARCHAR(20) NOT NULL,
  area_km2          DOUBLE PRECISION,
  shape             geometry(MultiPolygon, 4326) NOT NULL,
  geojson           JSONB NOT NULL,
  center_point      geometry(Point, 4326) NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

export const CREATE_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_municipality_shape
  ON geo.municipality USING GIST (shape);
CREATE INDEX IF NOT EXISTS idx_municipality_center_point
  ON geo.municipality USING GIST (center_point);
CREATE INDEX IF NOT EXISTS idx_municipality_ibge_code
  ON geo.municipality (ibge_code);
CREATE INDEX IF NOT EXISTS idx_municipality_state_code
  ON geo.municipality (state_code);
`;
