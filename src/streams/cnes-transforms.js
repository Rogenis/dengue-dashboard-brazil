import { Transform } from 'stream';

/**
 * Transform stream: seleciona e normaliza os campos do CNES.
 */
export class CnesTransform extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(row, _enc, cb) {
    const lat = parseFloat(row.NU_LATITUDE);
    const lon = parseFloat(row.NU_LONGITUDE);
    const motivo = (row.CO_MOTIVO_DESAB || '').trim();

    cb(null, {
      co_cnes:              (row.CO_CNES || '').trim(),
      no_fantasia:          (row.NO_FANTASIA || '').trim(),
      no_razao_social:      (row.NO_RAZAO_SOCIAL || '').trim(),

      co_uf:                (row.CO_UF || '').trim(),
      co_ibge:              (row.CO_IBGE || '').trim(),
      nu_latitude:          isNaN(lat) ? null : lat,
      nu_longitude:         isNaN(lon) ? null : lon,

      tp_unidade:           parseInt(row.TP_UNIDADE, 10) || 0,
      tp_gestao:            (row.TP_GESTAO || '').trim(),
      co_esfera:            (row.CO_ESFERA_ADMINISTRATIVA || '').trim(),

      co_cep:               (row.CO_CEP || '').trim() || null,
      no_logradouro:        (row.NO_LOGRADOURO || '').trim() || null,
      nu_endereco:          (row.NU_ENDERECO || '').trim() || null,
      no_bairro:            (row.NO_BAIRRO || '').trim() || null,

      co_motivo_desab:      motivo || null,
      ativo:                motivo === '' ? 1 : 0,
    });
  }
}
