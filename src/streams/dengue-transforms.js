import { Transform } from 'stream';

/**
 * Converte NU_IDADE_N codificado para idade em anos.
 * 1º dígito = unidade: 1=hora, 2=dia, 3=mês, 4=ano
 * Ex: 4021 → 21 anos, 3009 → 0 (9 meses), 2015 → 0 (15 dias)
 */
export function converterIdade(raw) {
  if (!raw || raw.trim() === '') return null;
  const num = parseInt(raw, 10);
  if (isNaN(num)) return null;

  const unidade = Math.floor(num / 1000);
  const valor = num % 1000;

  if (unidade === 4) return valor;
  if (unidade === 3) return valor < 12 ? 0 : Math.floor(valor / 12);
  if (unidade <= 2) return 0;
  return null;
}

/**
 * Converte string de data para formato YYYY-MM-DD ou null.
 */
export function parseDate(val) {
  if (!val || val.trim() === '') return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  const m = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return null;
}

function strOrNull(val, nullValues = ['0', '']) {
  if (!val) return null;
  const trimmed = val.trim();
  if (nullValues.includes(trimmed)) return null;
  return trimmed;
}

// Mapeamentos para Enum do ClickHouse
const SEXO_MAP = { M: 'M', F: 'F', I: 'I' };
const RACA_MAP = { 1: 'branca', 2: 'preta', 3: 'amarela', 4: 'parda', 5: 'indigena' };
const CLASSI_MAP = { 5: 'descartado', 8: 'inconclusivo', 10: 'dengue', 11: 'dengue_com_alarme', 12: 'dengue_grave' };
const HOSP_MAP = { 1: 'sim', 2: 'nao' };
const EVOL_MAP = { 1: 'cura', 2: 'obito_por_dengue', 3: 'obito_por_outras_causas', 4: 'obito_em_investigacao' };

function mapEnum(val, mapping) {
  if (!val || val.trim() === '') return null;
  return mapping[val.trim()] || null;
}

function sintomaToBool(val) {
  if (!val || val.trim() === '') return null;
  return val.trim() === '1' ? true : val.trim() === '2' ? false : null;
}

/**
 * Transform stream: filtra registros inválidos (duplicados, chikungunya, surto).
 */
export class DengueFilter extends Transform {
  constructor() {
    super({ objectMode: true });
    this.filtered = { duplicados: 0, chikungunya: 0, surto: 0 };
  }

  _transform(row, _enc, cb) {
    if (row.NDUPLIC_N === '2') {
      this.filtered.duplicados++;
      return cb();
    }
    if (row.CLASSI_FIN === '13') {
      this.filtered.chikungunya++;
      return cb();
    }
    if (row.TP_NOT !== '2') {
      this.filtered.surto++;
      return cb();
    }
    cb(null, row);
  }

  _flush(cb) {
    const { duplicados, chikungunya, surto } = this.filtered;
    const total = duplicados + chikungunya + surto;
    console.log(`  Filtrados: ${total.toLocaleString('pt-BR')} registros`);
    console.log(`    - Duplicados (NDUPLIC_N=2): ${duplicados.toLocaleString('pt-BR')}`);
    console.log(`    - Chikungunya (CLASSI_FIN=13): ${chikungunya.toLocaleString('pt-BR')}`);
    console.log(`    - Surto/Outros (TP_NOT≠2): ${surto.toLocaleString('pt-BR')}`);
    cb();
  }
}

/**
 * Transform stream: seleciona e normaliza os 29 campos de dengue.
 */
export class DengueTransform extends Transform {
  constructor(arquivoOrigem) {
    super({ objectMode: true });
    this.arquivoOrigem = arquivoOrigem;
  }

  _transform(row, _enc, cb) {
    cb(null, {
      tp_not:         2,
      id_agravo:      (row.ID_AGRAVO || 'A90').trim(),
      dt_notific:     parseDate(row.DT_NOTIFIC),

      sg_uf_not:      (row.SG_UF_NOT || '').trim(),
      id_municip:     (row.ID_MUNICIP || '').trim(),
      id_unidade:     (row.ID_UNIDADE || '').trim(),

      sg_uf:          strOrNull(row.SG_UF),
      id_mn_resi:     strOrNull(row.ID_MN_RESI),

      idade_anos:     converterIdade(row.NU_IDADE_N),
      cs_sexo:        mapEnum(row.CS_SEXO, SEXO_MAP),
      cs_raca:        mapEnum(row.CS_RACA, RACA_MAP),

      febre:          sintomaToBool(row.FEBRE),
      mialgia:        sintomaToBool(row.MIALGIA),
      cefaleia:       sintomaToBool(row.CEFALEIA),
      exantema:       sintomaToBool(row.EXANTEMA),
      vomito:         sintomaToBool(row.VOMITO),
      nausea:         sintomaToBool(row.NAUSEA),
      dor_costas:     sintomaToBool(row.DOR_COSTAS),
      conjuntvit:     sintomaToBool(row.CONJUNTVIT),
      artrite:        sintomaToBool(row.ARTRITE),
      artralgia:      sintomaToBool(row.ARTRALGIA),
      petequia_n:     sintomaToBool(row.PETEQUIA_N),
      leucopenia:     sintomaToBool(row.LEUCOPENIA),
      laco:           sintomaToBool(row.LACO),
      dor_retro:      sintomaToBool(row.DOR_RETRO),

      classi_fin:     mapEnum(row.CLASSI_FIN, CLASSI_MAP),
      hospitaliz:     mapEnum(row.HOSPITALIZ, HOSP_MAP),
      evolucao:       mapEnum(row.EVOLUCAO, EVOL_MAP),

      coufinf:        strOrNull(row.COUFINF),

      arquivo_origem: this.arquivoOrigem,
    });
  }
}
