import { Inject, Injectable } from '@nestjs/common';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { DB_POOL } from '../database/database.module';
import { Estado } from './entities/estado.entity';

const COLUMNS = 'id, nombre';

interface EstadoRow extends RowDataPacket {
  id: number;
  nombre: string;
}

/**
 * Acceso a datos de `estado` (catálogo, sin borrado lógico). Todas
 * las queries son parametrizadas.
 */
@Injectable()
export class EstadosRepository {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  /** Lista todos los estados. */
  async findAll(): Promise<Estado[]> {
    const [rows] = await this.pool.query<EstadoRow[]>(
      `SELECT ${COLUMNS} FROM estado ORDER BY id`,
    );
    return rows.map(toEntity);
  }
}

/** Mapea una fila cruda de `mysql2` a {@link Estado}. */
function toEntity(row: EstadoRow): Estado {
  const estado = new Estado();
  estado.id = row.id;
  estado.nombre = row.nombre;
  return estado;
}
