import { Inject, Injectable } from '@nestjs/common';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { DB_POOL } from '../database/database.module';
import { Fuente } from './entities/fuente.entity';

const COLUMNS = 'id, tipo_fuente, valor_fuente';

interface FuenteRow extends RowDataPacket {
  id: number;
  tipo_fuente: string;
  valor_fuente: string;
}

/**
 * Acceso a datos de `fuente` (catálogo, sin borrado lógico). Todas
 * las queries son parametrizadas.
 */
@Injectable()
export class FuentesRepository {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  /** Lista todas las fuentes. */
  async findAll(): Promise<Fuente[]> {
    const [rows] = await this.pool.query<FuenteRow[]>(
      `SELECT ${COLUMNS} FROM fuente ORDER BY id`,
    );
    return rows.map(toEntity);
  }
}

/** Mapea una fila cruda de `mysql2` a {@link Fuente}. */
function toEntity(row: FuenteRow): Fuente {
  const fuente = new Fuente();
  fuente.id = row.id;
  fuente.tipoFuente = row.tipo_fuente;
  fuente.valorFuente = row.valor_fuente;
  return fuente;
}
