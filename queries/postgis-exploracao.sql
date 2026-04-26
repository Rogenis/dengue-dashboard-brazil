-- ============================================================
-- Etapa 5 — Exploração e consultas no PostgreSQL + PostGIS
-- Banco: prix_onboarding_db | Schema: geo
-- ============================================================


-- ──────────────────────────────────────────────────────────────
-- 1. RESULTADO DA CARGA — Verificação
-- ──────────────────────────────────────────────────────────────

-- 1.1 Contagem total e verificação de integridade
SELECT
    count(*) AS total_municipios,
    count(DISTINCT state_abbr) AS total_ufs,
    count(DISTINCT region_name) AS total_regioes
FROM geo.municipality;

-- 1.2 Municípios por UF
SELECT
    state_abbr,
    count(*) AS municipios
FROM geo.municipality
GROUP BY state_abbr
ORDER BY municipios DESC;

-- 1.3 Verificar tipos de geometria carregados
SELECT
    GeometryType(shape) AS tipo_geometria,
    ST_SRID(shape) AS srid,
    count(*) AS total
FROM geo.municipality
GROUP BY tipo_geometria, srid;


-- ──────────────────────────────────────────────────────────────
-- 2. LEITURA DE GEOMETRIAS
-- ──────────────────────────────────────────────────────────────

-- 2.1 Visualizar geometria como WKT (texto legível)
SELECT
    name,
    state_abbr,
    ST_AsText(center_point) AS centro_wkt,
    ST_NPoints(shape) AS vertices_poligono
FROM geo.municipality
ORDER BY vertices_poligono DESC
LIMIT 5;

-- 2.2 Bounding box de cada município (extensão geográfica)
SELECT
    name,
    state_abbr,
    ST_XMin(shape) AS lon_min,
    ST_YMin(shape) AS lat_min,
    ST_XMax(shape) AS lon_max,
    ST_YMax(shape) AS lat_max
FROM geo.municipality
WHERE state_abbr = 'SP'
LIMIT 10;

-- 2.3 Área calculada via PostGIS (geography para resultado em m²)
SELECT
    name,
    state_abbr,
    area_km2 AS area_ibge,
    round(ST_Area(shape::geography) / 1e6, 2) AS area_postgis_km2,
    round(abs(area_km2 - ST_Area(shape::geography) / 1e6), 2) AS diferenca
FROM geo.municipality
ORDER BY area_ibge DESC
LIMIT 10;

-- 2.4 Perímetro dos maiores municípios
SELECT
    name,
    state_abbr,
    area_km2,
    round(ST_Perimeter(shape::geography) / 1000, 2) AS perimetro_km
FROM geo.municipality
ORDER BY area_km2 DESC
LIMIT 10;


-- ──────────────────────────────────────────────────────────────
-- 3. LEITURA DA REPRESENTAÇÃO GEOJSON
-- ──────────────────────────────────────────────────────────────

-- 3.1 GeoJSON armazenado vs gerado sob demanda
-- A coluna geojson já contém a geometria em formato JSON pronta para o frontend
SELECT
    name,
    ibge_code,
    geojson->>'type' AS tipo_geojson,
    jsonb_array_length(geojson->'coordinates') AS num_poligonos
FROM geo.municipality
WHERE state_abbr = 'RJ'
LIMIT 5;

-- 3.2 Gerar Feature GeoJSON completa (com propriedades) para consumo em mapas
-- Esse formato é o que libs como Leaflet/MapboxGL esperam
SELECT jsonb_build_object(
    'type', 'Feature',
    'properties', jsonb_build_object(
        'name', name,
        'ibge_code', ibge_code,
        'state', state_abbr,
        'area_km2', area_km2
    ),
    'geometry', geojson
) AS feature_geojson
FROM geo.municipality
WHERE name = 'São Paulo' AND state_abbr = 'SP';

-- 3.3 Gerar FeatureCollection GeoJSON para uma UF inteira
-- Útil para renderizar todos os municípios de um estado no mapa
SELECT jsonb_build_object(
    'type', 'FeatureCollection',
    'features', jsonb_agg(
        jsonb_build_object(
            'type', 'Feature',
            'properties', jsonb_build_object(
                'name', name,
                'ibge_code', ibge_code
            ),
            'geometry', geojson
        )
    )
) AS feature_collection
FROM geo.municipality
WHERE state_abbr = 'AC';

-- 3.4 Quando usar geometry vs GeoJSON:
-- - geometry (coluna shape): consultas espaciais, índices GIST, cálculos de área/distância
-- - GeoJSON (coluna geojson): resposta direta para APIs REST, renderização no frontend
-- - ST_AsGeoJSON(shape): conversão sob demanda quando a geometria original precisa ser simplificada


-- ──────────────────────────────────────────────────────────────
-- 4. FUNÇÕES ESPACIAIS
-- ──────────────────────────────────────────────────────────────

-- 4.1 ST_Contains — Dado um ponto, encontrar em qual município está
-- Exemplo: coordenadas do Maracanã (Rio de Janeiro)
SELECT name, state_abbr, ibge_code
FROM geo.municipality
WHERE ST_Contains(shape, ST_SetSRID(ST_MakePoint(-43.2302, -22.9122), 4326));

-- 4.2 ST_Distance — Distância entre centros de dois municípios (em km)
SELECT
    a.name AS municipio_a,
    b.name AS municipio_b,
    round(ST_Distance(a.center_point::geography, b.center_point::geography) / 1000, 2) AS distancia_km
FROM geo.municipality a, geo.municipality b
WHERE a.name = 'São Paulo' AND a.state_abbr = 'SP'
  AND b.name = 'Rio de Janeiro' AND b.state_abbr = 'RJ';

-- 4.3 ST_DWithin — Municípios num raio de 100km de Brasília
SELECT
    name,
    state_abbr,
    round(ST_Distance(
        center_point::geography,
        (SELECT center_point::geography FROM geo.municipality WHERE name = 'Brasília')
    ) / 1000, 2) AS distancia_km
FROM geo.municipality
WHERE ST_DWithin(
    center_point::geography,
    (SELECT center_point::geography FROM geo.municipality WHERE name = 'Brasília'),
    100000  -- 100km em metros
)
AND name != 'Brasília'
ORDER BY distancia_km;

-- 4.4 ST_Intersects — Municípios que fazem fronteira com São Paulo capital
SELECT
    b.name,
    b.state_abbr
FROM geo.municipality a
JOIN geo.municipality b ON ST_Intersects(a.shape, b.shape) AND a.id != b.id
WHERE a.name = 'São Paulo' AND a.state_abbr = 'SP'
ORDER BY b.name;

-- 4.5 ST_Simplify — Simplificar geometria para renderização rápida
-- Reduz vértices mantendo a forma visual (tolerance em graus)
SELECT
    name,
    ST_NPoints(shape) AS vertices_original,
    ST_NPoints(ST_Simplify(shape, 0.01)) AS vertices_simplificado,
    round(100.0 - ST_NPoints(ST_Simplify(shape, 0.01)) * 100.0 / ST_NPoints(shape), 1) AS reducao_pct
FROM geo.municipality
ORDER BY vertices_original DESC
LIMIT 10;

-- 4.6 ST_Union — Agregar geometrias por estado (gerar shape do estado)
SELECT
    state_abbr,
    ST_Union(shape) AS shape_estado,
    count(*) AS municipios
FROM geo.municipality
WHERE state_abbr = 'AC'
GROUP BY state_abbr;


-- ──────────────────────────────────────────────────────────────
-- 5. JOINS COM CÓDIGOS TERRITORIAIS
-- ──────────────────────────────────────────────────────────────

-- 5.1 Resumo por estado — total municípios, área, extensão
SELECT
    state_abbr,
    count(*) AS municipios,
    round(sum(area_km2)::numeric, 2) AS area_total_km2,
    round(avg(area_km2)::numeric, 2) AS area_media_km2,
    ST_Extent(shape) AS bounding_box
FROM geo.municipality
GROUP BY state_abbr
ORDER BY area_total_km2 DESC;

-- 5.2 Resumo por região
SELECT
    region_name,
    count(*) AS municipios,
    round(sum(area_km2)::numeric, 2) AS area_total_km2,
    count(DISTINCT state_abbr) AS estados
FROM geo.municipality
GROUP BY region_name
ORDER BY municipios DESC;

-- 5.3 Centroid de cada estado (média ponderada dos centros dos municípios)
SELECT
    state_abbr,
    ST_AsText(ST_Centroid(ST_Union(shape))) AS centro_estado
FROM geo.municipality
GROUP BY state_abbr
ORDER BY state_abbr;

-- 5.4 Municípios com maior e menor área por região
SELECT DISTINCT ON (region_name)
    region_name,
    name AS maior_municipio,
    state_abbr,
    area_km2
FROM geo.municipality
ORDER BY region_name, area_km2 DESC;
