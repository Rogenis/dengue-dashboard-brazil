# Prix Onboarding — Dashboard de Dengue

Dashboard interativo para visualizacao e analise de dados de dengue no Brasil, com mapas (Mapbox, Leaflet, Google Maps), graficos interativos (Chart.js) e insights em tempo real.

## Pre-requisitos

- **Node.js** >= 18
- **ClickHouse** rodando na porta 8123
- **PostgreSQL + PostGIS** rodando na porta 5433
- **Datasets** (ver secao abaixo)

## Datasets

Os arquivos de dados nao estao no repositorio (sao grandes). Baixe e coloque na pasta `datasets/`:

| Arquivo | Descricao | Tamanho |
|---------|-----------|---------|
| `DENGBR25.csv` | Casos de dengue 2025 (SINAN) | ~438 MB |
| `DENGBR26.csv` | Casos de dengue 2026 (SINAN) | ~43 MB |
| `cnes_estabelecimentos.csv` | Estabelecimentos de saude (CNES) | ~211 MB |
| `BR_Municipios_2025.shp/.dbf/.shx/.prj` | Shapefile dos municipios (IBGE) | ~306 MB |
| `dic_dados_dengue.pdf` | Dicionario de dados | ~380 KB |

## Instalacao

```bash
# 1. Instalar dependencias
npm install

# 2. Criar tabelas no ClickHouse
npm run setup

# 3. Criar tabelas no PostgreSQL/PostGIS
npm run setup:pg

# 4. Ingerir todos os dados (dengue, CNES, municipios, geo)
npm run ingest:all
```

Ou ingerir individualmente:

```bash
npm run ingest:dengue      # Casos de dengue (CSV → ClickHouse)
npm run ingest:cnes        # Estabelecimentos de saude (CSV → ClickHouse)
npm run ingest:municipios  # Municipios (DBF → ClickHouse)
npm run ingest:geo         # Geometrias dos municipios (SHP → PostgreSQL/PostGIS)
```

## Configuracao

Variaveis de ambiente (opcionais — valores default funcionam para desenvolvimento local):

```bash
# ClickHouse
CLICKHOUSE_URL=http://localhost:8123
CLICKHOUSE_DB=prix_onboarding_db
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=

# PostgreSQL
PG_HOST=localhost
PG_PORT=5433
PG_DATABASE=prix_onboarding_db
PG_USER=postgres
PG_PASSWORD=postgres
```

## Executando

```bash
npm run dev
```

Acesse http://localhost:3000

## Estrutura do projeto

```
src/
  config/         # Conexoes ClickHouse e PostgreSQL
  setup/          # Scripts de criacao de tabelas
  ingest/         # Scripts de ingestao de dados (CSV/DBF/SHP)
  streams/        # Transformadores de stream para ingestao
  schemas/        # Schemas das tabelas
  routes/         # Rotas da API (dashboard, dengue, geo, estabelecimentos)
  server.js       # Express server
public/
  index.html      # Frontend (mapas + dashboard + insights)
datasets/         # Dados brutos (nao versionados)
queries/          # Consultas SQL de exploracao
docs/             # Documentacao de modelagem
```

## Funcionalidades

- **3 provedores de mapa**: Mapbox (clusters + choropleth), Leaflet/OSM (estabelecimentos), Google Maps (heatmap)
- **Dashboard interativo**: 8 graficos Chart.js (line, bar, doughnut, stacked, horizontal)
- **Filtros**: por regiao, estado (UF) e periodo temporal
- **Insights reativos**: KPIs, tendencias, variacao mensal, comparativo 2025 vs 2026
- **Choropleth**: estados coloridos por intensidade de casos
- **Limites geograficos**: contornos estaduais e outline de regiao (Turf.js)

## Stack

- **Backend**: Node.js, Express 5
- **Banco analitico**: ClickHouse
- **Banco geografico**: PostgreSQL + PostGIS
- **Frontend**: HTML, CSS, JavaScript vanilla
- **Mapas**: Mapbox GL JS, Leaflet, Google Maps API
- **Graficos**: Chart.js 4
- **Geo**: Turf.js
