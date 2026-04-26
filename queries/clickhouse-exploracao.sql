-- ============================================================
-- Etapa 5 — Exploração e consultas no ClickHouse
-- Banco: prix_onboarding_db
-- ============================================================


-- ──────────────────────────────────────────────────────────────
-- 1. RESULTADO DA CARGA — Verificação de volume e integridade
-- ──────────────────────────────────────────────────────────────

-- 1.1 Contagem total por tabela
SELECT 'casos_dengue' AS tabela, count() AS registros FROM casos_dengue
UNION ALL
SELECT 'estabelecimentos_saude', count() FROM estabelecimentos_saude
UNION ALL
SELECT 'municipios', count() FROM municipios;

-- 1.2 Casos por arquivo de origem
SELECT
    arquivo_origem,
    count() AS registros,
    min(dt_notific) AS primeira_notificacao,
    max(dt_notific) AS ultima_notificacao
FROM casos_dengue
GROUP BY arquivo_origem;

-- 1.3 Estabelecimentos ativos vs inativos
SELECT
    ativo,
    count() AS total,
    round(count() * 100.0 / (SELECT count() FROM estabelecimentos_saude), 2) AS percentual
FROM estabelecimentos_saude
GROUP BY ativo;


-- ──────────────────────────────────────────────────────────────
-- 2. AGREGAÇÕES SIMPLES
-- ──────────────────────────────────────────────────────────────

-- 2.1 Casos por classificação final
SELECT
    classi_fin,
    count() AS casos,
    round(count() * 100.0 / (SELECT count() FROM casos_dengue), 2) AS percentual
FROM casos_dengue
GROUP BY classi_fin
ORDER BY casos DESC;

-- 2.2 Distribuição por sexo e faixa etária
SELECT
    cs_sexo,
    multiIf(
        idade_anos < 10, '0-9',
        idade_anos < 20, '10-19',
        idade_anos < 40, '20-39',
        idade_anos < 60, '40-59',
        '60+'
    ) AS faixa_etaria,
    count() AS casos
FROM casos_dengue
WHERE cs_sexo IS NOT NULL AND idade_anos IS NOT NULL
GROUP BY cs_sexo, faixa_etaria
ORDER BY cs_sexo, faixa_etaria;

-- 2.3 Distribuição por raça/cor
SELECT
    cs_raca,
    count() AS casos,
    round(count() * 100.0 / sum(count()) OVER (), 2) AS percentual
FROM casos_dengue
WHERE cs_raca IS NOT NULL
GROUP BY cs_raca
ORDER BY casos DESC;


-- ──────────────────────────────────────────────────────────────
-- 3. RECORTES POR PERÍODO, LOCALIDADE E CLASSIFICAÇÃO
-- ──────────────────────────────────────────────────────────────

-- 3.1 Evolução mensal de casos
SELECT
    toStartOfMonth(dt_notific) AS mes,
    count() AS casos,
    countIf(classi_fin = 'dengue_grave') AS casos_graves,
    countIf(evolucao = 'obito_por_dengue') AS obitos
FROM casos_dengue
GROUP BY mes
ORDER BY mes;

-- 3.2 Top 10 UFs com mais casos
SELECT
    m.sigla_uf,
    count() AS casos,
    countIf(hospitaliz = 'sim') AS hospitalizacoes,
    round(countIf(hospitaliz = 'sim') * 100.0 / count(), 2) AS taxa_hospitalizacao
FROM casos_dengue c
JOIN municipios m ON c.sg_uf_not = m.cd_uf
GROUP BY m.sigla_uf
ORDER BY casos DESC
LIMIT 10;

-- 3.3 Top 10 municípios com mais casos (com nome)
SELECT
    m.nm_mun,
    m.sigla_uf,
    count() AS casos
FROM casos_dengue c
JOIN municipios m ON c.id_municip = m.cd_mun_6
GROUP BY m.nm_mun, m.sigla_uf
ORDER BY casos DESC
LIMIT 10;

-- 3.4 Casos por região geográfica
SELECT
    m.nm_regiao,
    count() AS casos,
    countIf(classi_fin IN ('dengue_com_alarme', 'dengue_grave')) AS casos_alarme_grave,
    round(countIf(classi_fin IN ('dengue_com_alarme', 'dengue_grave')) * 100.0 / count(), 2) AS pct_alarme_grave
FROM casos_dengue c
JOIN municipios m ON c.id_municip = m.cd_mun_6
GROUP BY m.nm_regiao
ORDER BY casos DESC;

-- 3.5 Casos no último trimestre por classificação
SELECT
    classi_fin,
    count() AS casos
FROM casos_dengue
WHERE dt_notific >= toStartOfQuarter(now())
GROUP BY classi_fin
ORDER BY casos DESC;


-- ──────────────────────────────────────────────────────────────
-- 4. ANÁLISES E INSIGHTS
-- ──────────────────────────────────────────────────────────────

-- 4.1 Taxa de letalidade por UF (óbitos / casos confirmados)
SELECT
    m.sigla_uf,
    count() AS casos_confirmados,
    countIf(evolucao = 'obito_por_dengue') AS obitos,
    round(countIf(evolucao = 'obito_por_dengue') * 100.0 / count(), 4) AS taxa_letalidade_pct
FROM casos_dengue c
JOIN municipios m ON c.id_municip = m.cd_mun_6
WHERE classi_fin IN ('dengue', 'dengue_com_alarme', 'dengue_grave')
GROUP BY m.sigla_uf
HAVING casos_confirmados > 100
ORDER BY taxa_letalidade_pct DESC;

-- 4.2 Perfil sintomático — frequência de cada sintoma
SELECT
    'febre' AS sintoma, countIf(febre = true) AS positivos, count() AS total,
    round(countIf(febre = true) * 100.0 / count(), 2) AS pct
FROM casos_dengue WHERE classi_fin = 'dengue'
UNION ALL
SELECT 'cefaleia', countIf(cefaleia = true), count(),
    round(countIf(cefaleia = true) * 100.0 / count(), 2) FROM casos_dengue WHERE classi_fin = 'dengue'
UNION ALL
SELECT 'mialgia', countIf(mialgia = true), count(),
    round(countIf(mialgia = true) * 100.0 / count(), 2) FROM casos_dengue WHERE classi_fin = 'dengue'
UNION ALL
SELECT 'exantema', countIf(exantema = true), count(),
    round(countIf(exantema = true) * 100.0 / count(), 2) FROM casos_dengue WHERE classi_fin = 'dengue'
UNION ALL
SELECT 'vomito', countIf(vomito = true), count(),
    round(countIf(vomito = true) * 100.0 / count(), 2) FROM casos_dengue WHERE classi_fin = 'dengue'
UNION ALL
SELECT 'artralgia', countIf(artralgia = true), count(),
    round(countIf(artralgia = true) * 100.0 / count(), 2) FROM casos_dengue WHERE classi_fin = 'dengue'
UNION ALL
SELECT 'dor_retro', countIf(dor_retro = true), count(),
    round(countIf(dor_retro = true) * 100.0 / count(), 2) FROM casos_dengue WHERE classi_fin = 'dengue'
UNION ALL
SELECT 'leucopenia', countIf(leucopenia = true), count(),
    round(countIf(leucopenia = true) * 100.0 / count(), 2) FROM casos_dengue WHERE classi_fin = 'dengue'
UNION ALL
SELECT 'petequia_n', countIf(petequia_n = true), count(),
    round(countIf(petequia_n = true) * 100.0 / count(), 2) FROM casos_dengue WHERE classi_fin = 'dengue'
ORDER BY pct DESC;

-- 4.3 Incidência por 100 mil habitantes (usando área como proxy de densidade)
-- Municípios com maior concentração de casos por km²
SELECT
    m.nm_mun,
    m.sigla_uf,
    count() AS casos,
    m.area_km2,
    round(count() / m.area_km2, 2) AS casos_por_km2
FROM casos_dengue c
JOIN municipios m ON c.id_municip = m.cd_mun_6
GROUP BY m.nm_mun, m.sigla_uf, m.area_km2
HAVING casos > 100
ORDER BY casos_por_km2 DESC
LIMIT 10;

-- 4.4 Diferença de perfil entre dengue simples e dengue grave
SELECT
    classi_fin,
    round(avgIf(idade_anos, idade_anos IS NOT NULL), 1) AS idade_media,
    round(countIf(hospitaliz = 'sim') * 100.0 / count(), 2) AS pct_hospitalizado,
    round(countIf(febre = true) * 100.0 / count(), 2) AS pct_febre,
    round(countIf(vomito = true) * 100.0 / count(), 2) AS pct_vomito,
    round(countIf(petequia_n = true) * 100.0 / count(), 2) AS pct_petequias,
    round(countIf(leucopenia = true) * 100.0 / count(), 2) AS pct_leucopenia
FROM casos_dengue
WHERE classi_fin IN ('dengue', 'dengue_grave')
GROUP BY classi_fin;


-- ──────────────────────────────────────────────────────────────
-- 5. FUNÇÕES ESPECÍFICAS DO CLICKHOUSE
-- ──────────────────────────────────────────────────────────────

-- 5.1 has() — Verificar se um array contém um valor
-- Exemplo: UFs que aparecem tanto como notificação quanto como residência
SELECT sg_uf_not AS uf_notificacao,
       groupUniqArray(sg_uf) AS ufs_residencia,
       has(groupUniqArray(sg_uf), sg_uf_not) AS inclui_propria_uf
FROM casos_dengue
WHERE sg_uf IS NOT NULL
GROUP BY sg_uf_not
ORDER BY sg_uf_not;

-- 5.2 topK() — Top sintomas mais frequentes nos casos graves
SELECT topK(5)(sintoma) AS top_sintomas
FROM (
    SELECT arrayJoin(
        arrayFilter(x -> x != '',
            [if(febre = true, 'febre', ''),
             if(cefaleia = true, 'cefaleia', ''),
             if(mialgia = true, 'mialgia', ''),
             if(vomito = true, 'vomito', ''),
             if(exantema = true, 'exantema', ''),
             if(artralgia = true, 'artralgia', ''),
             if(petequia_n = true, 'petequia', ''),
             if(leucopenia = true, 'leucopenia', ''),
             if(dor_retro = true, 'dor_retro', '')]
        )
    ) AS sintoma
    FROM casos_dengue
    WHERE classi_fin = 'dengue_grave'
);

-- 5.3 quantile() — Mediana e percentis de idade por classificação
SELECT
    classi_fin,
    quantile(0.25)(idade_anos) AS p25,
    quantile(0.5)(idade_anos) AS mediana,
    quantile(0.75)(idade_anos) AS p75
FROM casos_dengue
WHERE classi_fin IS NOT NULL AND idade_anos IS NOT NULL
GROUP BY classi_fin
ORDER BY classi_fin;

-- 5.4 uniqExact() — Contagem de valores distintos
SELECT
    uniqExact(id_municip) AS municipios_com_notificacao,
    uniqExact(id_unidade) AS unidades_notificadoras,
    uniqExact(sg_uf_not) AS ufs_com_notificacao
FROM casos_dengue;

-- 5.5 formatDateTime() e toRelativeDayNum() — Série temporal por semana epidemiológica
SELECT
    toMonday(dt_notific) AS semana,
    count() AS casos,
    bar(count(), 0, 50000, 40) AS grafico
FROM casos_dengue
GROUP BY semana
ORDER BY semana;


-- ──────────────────────────────────────────────────────────────
-- 6. ReplacingMergeTree — Estratégia de deduplicação
-- ──────────────────────────────────────────────────────────────

-- 6.1 Criar versão com ReplacingMergeTree para demonstrar deduplicação
-- Útil quando há reingestão de dados e queremos manter apenas a versão mais recente
CREATE TABLE IF NOT EXISTS prix_onboarding_db.casos_dengue_replacing (
    tp_not         UInt8,
    id_agravo      LowCardinality(String),
    dt_notific     Date,
    sg_uf_not      LowCardinality(String),
    id_municip     String,
    id_unidade     String,
    sg_uf          LowCardinality(Nullable(String)),
    id_mn_resi     Nullable(String),
    idade_anos     Nullable(UInt8),
    cs_sexo        Nullable(Enum8('M' = 1, 'F' = 2, 'I' = 3)),
    classi_fin     Nullable(Enum8(
        'descartado' = 5, 'inconclusivo' = 8, 'dengue' = 10,
        'dengue_com_alarme' = 11, 'dengue_grave' = 12
    )),
    hospitaliz     Nullable(Enum8('sim' = 1, 'nao' = 2)),
    evolucao       Nullable(Enum8(
        'cura' = 1, 'obito_por_dengue' = 2,
        'obito_por_outras_causas' = 3, 'obito_em_investigacao' = 4
    )),
    arquivo_origem LowCardinality(String),
    created_at     DateTime('America/Sao_Paulo') DEFAULT now(),
    _version       UInt64 DEFAULT toUnixTimestamp(now()) COMMENT 'Versão para ReplacingMergeTree'
) ENGINE = ReplacingMergeTree(_version)
ORDER BY (sg_uf_not, id_municip, dt_notific, id_unidade);

-- 6.2 Inserir dados na tabela replacing (cópia da original)
INSERT INTO casos_dengue_replacing
    (tp_not, id_agravo, dt_notific, sg_uf_not, id_municip, id_unidade,
     sg_uf, id_mn_resi, idade_anos, cs_sexo, classi_fin, hospitaliz,
     evolucao, arquivo_origem)
SELECT
    tp_not, id_agravo, dt_notific, sg_uf_not, id_municip, id_unidade,
    sg_uf, id_mn_resi, idade_anos, cs_sexo, classi_fin, hospitaliz,
    evolucao, arquivo_origem
FROM casos_dengue;

-- 6.3 Simular reingestão (inserir duplicados com versão mais nova)
INSERT INTO casos_dengue_replacing
    (tp_not, id_agravo, dt_notific, sg_uf_not, id_municip, id_unidade,
     sg_uf, id_mn_resi, idade_anos, cs_sexo, classi_fin, hospitaliz,
     evolucao, arquivo_origem)
SELECT
    tp_not, id_agravo, dt_notific, sg_uf_not, id_municip, id_unidade,
    sg_uf, id_mn_resi, idade_anos, cs_sexo, classi_fin, hospitaliz,
    evolucao, arquivo_origem
FROM casos_dengue
LIMIT 1000;

-- 6.4 Comparar contagens — sem FINAL vs com FINAL
-- Sem FINAL: mostra todas as versões (incluindo duplicadas)
SELECT count() AS sem_final FROM casos_dengue_replacing;

-- Com FINAL: mostra apenas a versão mais recente de cada registro
SELECT count() AS com_final FROM casos_dengue_replacing FINAL;

-- 6.5 Forçar merge para eliminar fisicamente duplicatas
OPTIMIZE TABLE casos_dengue_replacing FINAL;
SELECT count() AS apos_optimize FROM casos_dengue_replacing;
