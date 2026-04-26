import { Writable } from 'stream';

/**
 * Writable stream que acumula registros e faz insert em batch no ClickHouse.
 */
export class BatchWriter extends Writable {
  constructor(client, table, { batchSize = 5000 } = {}) {
    super({ objectMode: true });
    this.client = client;
    this.table = table;
    this.batchSize = batchSize;
    this.buffer = [];
    this.totalInserted = 0;
  }

  async _write(record, _encoding, callback) {
    this.buffer.push(record);

    if (this.buffer.length >= this.batchSize) {
      try {
        await this._flush_buffer();
        callback();
      } catch (err) {
        callback(err);
      }
    } else {
      callback();
    }
  }

  async _final(callback) {
    try {
      if (this.buffer.length > 0) {
        await this._flush_buffer();
      }
      callback();
    } catch (err) {
      callback(err);
    }
  }

  async _flush_buffer() {
    const batch = this.buffer.splice(0);
    await this.client.insert({
      table: this.table,
      values: batch,
      format: 'JSONEachRow',
    });
    this.totalInserted += batch.length;

    if (this.totalInserted % 50000 === 0 || batch.length < this.batchSize) {
      console.log(`  [${this.table}] ${this.totalInserted.toLocaleString('pt-BR')} registros inseridos`);
    }
  }
}
