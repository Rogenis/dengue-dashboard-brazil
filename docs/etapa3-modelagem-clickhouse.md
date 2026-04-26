# Etapa 3 — Carga Analítica no ClickHouse

## Visão Geral

Duas tabelas principais para análise de dengue, mais uma tabela auxiliar de municípios para enriquecimento geográfico.

| Tabela | Registros | Fonte | Descrição |
|--------|-----------|-------|-----------|
| `casos_dengue` | ~1,8M | DENGBR25.csv + DENGBR26.csv | Notificações individuais de dengue (SINAN) |
| `estabelecimentos_saude` | ~609k | cnes_estabelecimentos.csv | Cadastro Nacional de Estabelecimentos de Saúde |
| `municipios` | ~5,5k | BR_Municipios_2025.dbf | Municípios brasileiros (IBGE 2025) |

---

## Estrutura das Tabelas

### 1. `casos_dengue`

Armazena notificações individuais de dengue filtradas do SINAN.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `tp_not` | UInt8 | Tipo de notificação (2=Individual) |
| `id_agravo` | LowCardinality(String) | Código CID-10 (A90=Dengue) |
| `dt_notific` | Date | Data da notificação |
| `sg_uf_not` | LowCardinality(String) | UF de notificação (código IBGE) |
| `id_municip` | String | Município de notificação (6 dígitos IBGE) |
| `id_unidade` | String | Código CNES da unidade notificadora |
| `sg_uf` | Nullable(LowCardinality(String)) | UF de residência |
| `id_mn_resi` | Nullable(String) | Município de residência (6 dígitos) |
| `idade_anos` | Nullable(UInt8) | Idade em anos (convertida de NU_IDADE_N) |
| `cs_sexo` | Nullable(Enum8) | Sexo: M=1, F=2, I=3 |
| `cs_raca` | Nullable(Enum8) | Raça/cor: branca=1, preta=2, amarela=3, parda=4, indigena=5 |
| `febre` ... `dor_retro` | Nullable(Bool) | 14 campos de sinais/sintomas |
| `classi_fin` | Nullable(Enum8) | Classificação final: descartado=5, inconclusivo=8, dengue=10, dengue_com_alarme=11, dengue_grave=12 |
| `hospitaliz` | Nullable(Enum8) | Hospitalização: sim=1, nao=2 |
| `evolucao` | Nullable(Enum8) | Desfecho: cura=1, óbito_dengue=2, óbito_outros=3, óbito_investigação=4 |
| `coufinf` | Nullable(String) | UF provável da infecção |
| `arquivo_origem` | LowCardinality(String) | Arquivo CSV de origem |
| `created_at` | DateTime('America/Sao_Paulo') | Timestamp de ingestão |

**ORDER BY:** `(sg_uf_not, id_municip, dt_notific)`
**Engine:** MergeTree()

### 2. `estabelecimentos_saude`

Cadastro de estabelecimentos de saúde do CNES.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `co_cnes` | String | Código CNES |
| `no_fantasia` | String | Nome fantasia |
| `no_razao_social` | String | Razão social |
| `co_uf` | LowCardinality(String) | UF (código IBGE) |
| `co_ibge` | String | Município (6 dígitos IBGE) |
| `nu_latitude` | Nullable(Float64) | Latitude |
| `nu_longitude` | Nullable(Float64) | Longitude |
| `tp_unidade` | UInt8 | Tipo de unidade |
| `tp_gestao` | LowCardinality(String) | Gestão: M/E/D/S |
| `co_esfera` | LowCardinality(String) | Esfera administrativa |
| `co_cep` | Nullable(String) | CEP |
| `no_logradouro` | Nullable(String) | Logradouro |
| `nu_endereco` | Nullable(String) | Número |
| `no_bairro` | Nullable(String) | Bairro |
| `co_motivo_desab` | Nullable(String) | Motivo de desabilitação |
| `ativo` | Bool | Derivado: true se não há motivo de desabilitação |
| `created_at` | DateTime('America/Sao_Paulo') | Timestamp de ingestão |

**ORDER BY:** `(co_uf, co_ibge, co_cnes)`
**Engine:** MergeTree()

### 3. `municipios` (tabela auxiliar)

Dimensão geográfica para enriquecimento via JOINs.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `cd_mun` | String | Código IBGE (7 dígitos, com verificador) |
| `cd_mun_6` | String | Código IBGE (6 dígitos, chave de JOIN) |
| `nm_mun` | String | Nome do município |
| `cd_uf` | LowCardinality(String) | UF (2 dígitos) |
| `sigla_uf` | LowCardinality(String) | Sigla UF |
| `cd_regiao` | LowCardinality(String) | Código região |
| `nm_regiao` | LowCardinality(String) | Nome região |
| `cd_rgi` | String | Região Geográfica Imediata |
| `area_km2` | Float64 | Área em km² |
| `created_at` | DateTime('America/Sao_Paulo') | Timestamp de ingestão |

**ORDER BY:** `(cd_uf, cd_mun_6)`
**Engine:** MergeTree()

---

## Decisões de Modelagem

### Tipos de Dados

| Decisão | Justificativa |
|---------|---------------|
| **Enum8** para campos categóricos | Segue padrão da migration `up.sql` da equipe. Garante validação na inserção e economia de armazenamento (1 byte vs string). Usado em: sexo, raça, classificação, hospitalização e evolução. |
| **LowCardinality(String)** para UF, gestão, esfera | Campos com poucos valores distintos (<30). ClickHouse usa dicionário interno, reduzindo armazenamento e acelerando filtros. |
| **Nullable()** em campos opcionais | Dados do SINAN/CNES frequentemente vêm vazios ou com valores inválidos. Nullable permite distinguir "não informado" de um valor default. |
| **Date** (não DateTime) para `dt_notific` | Notificações têm apenas data, sem horário. Date ocupa 2 bytes vs 4 do DateTime. |
| **UInt8** para `idade_anos` e `tp_not` | Faixa de 0-255 é suficiente. Economia de armazenamento vs UInt16/UInt32. |
| **Float64** para coordenadas | Precisão necessária para latitude/longitude. |
| **DateTime('America/Sao_Paulo')** para `created_at` | Padrão da equipe (migration `up.sql`). Garante fuso horário consistente. |
| **COMMENT em todas as colunas** | Padrão da equipe. Facilita exploração do schema via `DESCRIBE TABLE`. |

### ORDER BY (Sorting Key)

A sorting key define a ordem física dos dados no disco e funciona como índice primário esparso no ClickHouse.

| Tabela | ORDER BY | Justificativa |
|--------|----------|---------------|
| `casos_dengue` | `(sg_uf_not, id_municip, dt_notific)` | Consultas típicas filtram por UF → município → período. A ordenação UF/município agrupa dados geograficamente, e a data permite range scans eficientes. |
| `estabelecimentos_saude` | `(co_uf, co_ibge, co_cnes)` | Consultas por localização (UF → município) e lookup por CNES. |
| `municipios` | `(cd_uf, cd_mun_6)` | Lookup por UF e código de município para JOINs. |

### Particionamento

**Decisão: não particionar.**

- `casos_dengue` tem ~1,8M registros (2 anos). Particionamento por mês geraria ~24 partições de ~75k registros — partes muito pequenas, o que degrada performance no ClickHouse (overhead de merge e metadados).
- Regra geral do ClickHouse: particionar apenas quando cada partição tem >1M de registros. Com o volume atual, o MergeTree sem partição é mais eficiente.
- Se no futuro o volume crescer (ex: dados históricos de 10+ anos), pode-se adicionar `PARTITION BY toYear(dt_notific)`.

### Engine

**MergeTree()** para todas as tabelas.

- É o engine padrão e mais versátil do ClickHouse.
- Não foi usado ReplacingMergeTree pois os dados são imutáveis (carga única, sem updates).
- A migration `up.sql` da equipe usa ReplacingMergeTree para tabelas com `updated_at`, mas nossos dados SINAN não têm esse padrão de atualização.

---

## Estratégia de Inserção

### Formato

- **JSONEachRow** — formato nativo do client `@clickhouse/client`. Cada registro é um objeto JSON, enviado em batch.

### Configuração do Client

```javascript
clickhouse_settings: {
  async_insert: 1,           // Inserções assíncronas (buffer server-side)
  wait_for_async_insert: 1,  // Aguarda confirmação da inserção
}
```

- `async_insert` permite que o ClickHouse agrupe inserções pequenas internamente, reduzindo o número de partes criadas.
- `wait_for_async_insert` garante que o client só prossegue após a inserção ser confirmada (evita perda de dados).

---

## Estratégia de Carga em Lote

### BatchWriter (Writable Stream)

A classe `BatchWriter` implementa a carga em lote como um Writable stream do Node.js:

```
CSV/DBF → parser → Transform(s) → BatchWriter → ClickHouse
```

| Parâmetro | Valor | Justificativa |
|-----------|-------|---------------|
| **batchSize** (dengue) | 5.000 | Bom equilíbrio entre uso de memória e throughput. Lotes menores = mais round-trips; maiores = mais memória. |
| **batchSize** (CNES) | 5.000 | Mesmo raciocínio. |
| **batchSize** (municípios) | 2.000 | Dataset pequeno (5,5k), 2 batches são suficientes. |

### Funcionamento

1. Registros chegam um a um via stream (objectMode).
2. São acumulados em buffer interno até atingir `batchSize`.
3. Ao atingir, faz `INSERT INTO tabela FORMAT JSONEachRow` com o batch completo.
4. No `_final()` (fim do stream), insere registros remanescentes.
5. Log de progresso a cada 50.000 registros.

### Filtros Pré-Inserção (Dengue)

Antes do BatchWriter, o `DengueFilter` remove registros inválidos:

| Filtro | Campo | Critério | Motivo |
|--------|-------|----------|--------|
| Duplicados | NDUPLIC_N | = 2 | Registros marcados como duplicata no SINAN |
| Chikungunya | CLASSI_FIN | = 13 | Classificação final como Chikungunya, não Dengue |
| Não-individual | TP_NOT | ≠ 2 | Apenas notificações individuais são relevantes |

---

## Relacionamentos (JOINs)

As tabelas se conectam por código IBGE do município (6 dígitos):

```
casos_dengue.id_municip ──────┐
                               ├── municipios.cd_mun_6
estabelecimentos_saude.co_ibge┘

casos_dengue.id_unidade ──── estabelecimentos_saude.co_cnes
```

Exemplos de queries analíticas possíveis:

```sql
-- Casos por região com nome
SELECT m.nm_regiao, count() as casos
FROM casos_dengue c
JOIN municipios m ON c.id_municip = m.cd_mun_6
GROUP BY m.nm_regiao;

-- Estabelecimentos notificadores ativos por município
SELECT e.no_fantasia, count() as notificacoes
FROM casos_dengue c
JOIN estabelecimentos_saude e ON c.id_unidade = e.co_cnes
WHERE e.ativo = true
GROUP BY e.no_fantasia
ORDER BY notificacoes DESC LIMIT 10;
```

---

## Como Executar

```bash
# 1. Criar tabelas
npm run setup

# 2. Ingerir tudo (setup + municípios + CNES + dengue)
npm run ingest:all

# Ou individualmente:
npm run ingest:municipios
npm run ingest:cnes
npm run ingest:dengue
```
