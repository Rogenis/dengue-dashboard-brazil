import { Transform } from 'stream';

/**
 * Corrige encoding duplo (latin-1 lido como UTF-8 → "SÃ£o" vira "São").
 */
function fixEncoding(str) {
  if (!str) return '';
  try {
    const buf = Buffer.from(str, 'latin1');
    const decoded = buf.toString('utf8');
    if (decoded !== str && !decoded.includes('\ufffd')) return decoded;
  } catch {
    // ignora erro de conversão
  }
  return str;
}

/**
 * Transform stream: seleciona e normaliza os campos de BR_Municípios.
 */
export class MunicipiosTransform extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(row, _enc, cb) {
    const cdMun = (row.CD_MUN || '').trim();

    cb(null, {
      cd_mun:     cdMun,
      cd_mun_6:   cdMun.slice(0, 6),
      nm_mun:     fixEncoding((row.NM_MUN || '').trim()),
      cd_uf:      (row.CD_UF || '').trim(),
      sigla_uf:   (row.SIGLA_UF || '').trim(),
      cd_regiao:  (row.CD_REGIAO || '').trim(),
      nm_regiao:  fixEncoding((row.NM_REGIAO || '').trim()),
      cd_rgi:     (row.CD_RGI || '').trim(),
      area_km2:   parseFloat(row.AREA_KM2) || 0,
    });
  }
}
