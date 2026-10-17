import { Inject, Injectable } from '@nestjs/common';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { DB_POOL } from '../database/database.module';
import { TipoFraude } from './entities/tipo-fraude.entity';

const COLUMNS = 'id, nombre';

interface TipoFraudeRow extends RowDataPacket {
  id: number;
  nombre: string;
}

/**
 * Acceso a datos de `tipo_fraude` (catálogo, sin borrado lógico).
 * Todas las queries son parametrizadas.
 */
@Injectable()
export class TiposFraudeRepository {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  /** Lista todos los tipos de fraude. */
  async findAll(): Promise<TipoFraude[]> {
    const [rows] = await this.pool.query<TipoFraudeRow[]>(
      `SELECT ${COLUMNS} FROM tipo_fraude ORDER BY id`,
    );
    return rows.map(toEntity);
  }
}

/** Mapea una fila cruda de `mysql2` a {@link TipoFraude}. */
function toEntity(row: TipoFraudeRow): TipoFraude {
  const tipo = new TipoFraude();
  tipo.id = row.id;
  tipo.nombre = row.nombre;
  return tipo;
}
