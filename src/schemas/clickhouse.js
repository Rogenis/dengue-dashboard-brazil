/**
 * SQL de criação das tabelas no ClickHouse.
 * Padrão baseado na migration up.sql da equipe.
 * Rodar via: node src/setup/clickhouse.js
 */

export const CREATE_DATABASE = `CREATE DATABASE IF NOT EXISTS prix_onboarding_db`;

export const CREATE_CASOS_DENGUE = `
CREATE TABLE IF NOT EXISTS prix_onboarding_db.casos_dengue (
  -- Identificação e Temporal
  tp_not         UInt8 COMMENT 'Tipo de notificação (2=Individual)',
  id_agravo      LowCardinality(String) COMMENT 'Código CID-10 do agravo (A90=Dengue)',
  dt_notific     Date COMMENT 'Data da notificação',

  -- Geográfico - Notificação
  sg_uf_not      LowCardinality(String) COMMENT 'Código IBGE da UF de notificação',
  id_municip     String COMMENT 'Código IBGE do município de notificação (6 dígitos)',
  id_unidade     String COMMENT 'Código CNES da unidade notificadora',

  -- Geográfico - Residência
  sg_uf          LowCardinality(Nullable(String)) COMMENT 'Código IBGE da UF de residência',
  id_mn_resi     Nullable(String) COMMENT 'Código IBGE do município de residência (6 dígitos)',

  -- Demográfico
  idade_anos     Nullable(UInt8) COMMENT 'Idade em anos (convertida de NU_IDADE_N)',
  cs_sexo        Nullable(Enum8(
    'M' = 1,
    'F' = 2,
    'I' = 3
  )) COMMENT 'Sexo do paciente',
  cs_raca        Nullable(Enum8(
    'branca' = 1,
    'preta' = 2,
    'amarela' = 3,
    'parda' = 4,
    'indigena' = 5
  )) COMMENT 'Raça/cor',

  -- Sinais e Sintomas
  febre          Nullable(Bool) COMMENT 'Febre',
  mialgia        Nullable(Bool) COMMENT 'Mialgia',
  cefaleia       Nullable(Bool) COMMENT 'Cefaleia',
  exantema       Nullable(Bool) COMMENT 'Exantema',
  vomito         Nullable(Bool) COMMENT 'Vômito',
  nausea         Nullable(Bool) COMMENT 'Náusea',
  dor_costas     Nullable(Bool) COMMENT 'Dor nas costas',
  conjuntvit     Nullable(Bool) COMMENT 'Conjuntivite',
  artrite        Nullable(Bool) COMMENT 'Artrite',
  artralgia      Nullable(Bool) COMMENT 'Artralgia',
  petequia_n     Nullable(Bool) COMMENT 'Petéquias',
  leucopenia     Nullable(Bool) COMMENT 'Leucopenia',
  laco           Nullable(Bool) COMMENT 'Prova do laço',
  dor_retro      Nullable(Bool) COMMENT 'Dor retro-orbital',

  -- Desfecho
  classi_fin     Nullable(Enum8(
    'descartado' = 5,
    'inconclusivo' = 8,
    'dengue' = 10,
    'dengue_com_alarme' = 11,
    'dengue_grave' = 12
  )) COMMENT 'Classificação final do caso',
  hospitaliz     Nullable(Enum8(
    'sim' = 1,
    'nao' = 2
  )) COMMENT 'Se houve internação',
  evolucao       Nullable(Enum8(
    'cura' = 1,
    'obito_por_dengue' = 2,
    'obito_por_outras_causas' = 3,
    'obito_em_investigacao' = 4
  )) COMMENT 'Desfecho do caso',

  -- Infecção
  coufinf        Nullable(String) COMMENT 'UF provável da infecção',

  -- Metadado de carga
  arquivo_origem LowCardinality(String) COMMENT 'Arquivo CSV de origem',
  created_at     DateTime('America/Sao_Paulo') DEFAULT now() COMMENT 'Data e hora da criação do registro'
) ENGINE = MergeTree()
ORDER BY (sg_uf_not, id_municip, dt_notific)
`;

export const CREATE_ESTABELECIMENTOS = `
CREATE TABLE IF NOT EXISTS prix_onboarding_db.estabelecimentos_saude (
  -- Identificação
  co_cnes           String COMMENT 'Código CNES do estabelecimento',
  no_fantasia       String COMMENT 'Nome fantasia do estabelecimento',
  no_razao_social   String COMMENT 'Razão social',

  -- Localização
  co_uf             LowCardinality(String) COMMENT 'Código IBGE da UF',
  co_ibge           String COMMENT 'Código IBGE do município (6 dígitos)',
  nu_latitude       Nullable(Float64) COMMENT 'Latitude',
  nu_longitude      Nullable(Float64) COMMENT 'Longitude',

  -- Tipo e Gestão
  tp_unidade        UInt8 COMMENT 'Tipo de unidade (1=Posto, 2=Centro, 4=Policlínica, 5=Hospital)',
  tp_gestao         LowCardinality(String) COMMENT 'Tipo de gestão (M=Municipal, E=Estadual, D=Dupla, S=Sem gestão)',
  co_esfera         LowCardinality(String) COMMENT 'Esfera administrativa (M=Municipal, E=Estadual, F=Federal, D=Dupla)',

  -- Endereço
  co_cep            Nullable(String) COMMENT 'CEP do estabelecimento',
  no_logradouro     Nullable(String) COMMENT 'Logradouro',
  nu_endereco       Nullable(String) COMMENT 'Número do endereço',
  no_bairro         Nullable(String) COMMENT 'Bairro',

  -- Situação
  co_motivo_desab   Nullable(String) COMMENT 'Código do motivo de desabilitação',
  ativo             Bool COMMENT 'Se o estabelecimento está ativo (derivado de CO_MOTIVO_DESAB)',

  -- Metadado
  created_at        DateTime('America/Sao_Paulo') DEFAULT now() COMMENT 'Data e hora da criação do registro'
) ENGINE = MergeTree()
ORDER BY (co_uf, co_ibge, co_cnes)
`;

export const CREATE_MUNICIPIOS = `
CREATE TABLE IF NOT EXISTS prix_onboarding_db.municipios (
  cd_mun       String COMMENT 'Código IBGE do município (7 dígitos, com verificador)',
  cd_mun_6     String COMMENT 'Código IBGE sem dígito verificador (6 dígitos, chave de join)',
  nm_mun       String COMMENT 'Nome do município',
  cd_uf        LowCardinality(String) COMMENT 'Código IBGE da UF (2 dígitos)',
  sigla_uf     LowCardinality(String) COMMENT 'Sigla da UF (ex: SP, RJ)',
  cd_regiao    LowCardinality(String) COMMENT 'Código da região (1=N, 2=NE, 3=SE, 4=S, 5=CO)',
  nm_regiao    LowCardinality(String) COMMENT 'Nome da região',
  cd_rgi       String COMMENT 'Código da Região Geográfica Imediata',
  area_km2     Float64 COMMENT 'Área do município em km²',

  created_at   DateTime('America/Sao_Paulo') DEFAULT now() COMMENT 'Data e hora da criação do registro'
) ENGINE = MergeTree()
ORDER BY (cd_uf, cd_mun_6)
`;
