import { Inject, Injectable } from '@nestjs/common';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { DB_POOL } from '../database/database.module';
import { TipoPropiedad } from './entities/tipo-propiedad.entity';

const COLUMNS = 'id, nombre';

interface TipoPropiedadRow extends RowDataPacket {
  id: number;
  nombre: string;
}

/**
 * Acceso a datos de `tipo_propiedad` (catálogo, sin borrado lógico).
 * Todas las queries son parametrizadas.
 */
@Injectable()
export class TiposPropiedadRepository {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  /** Lista todos los tipos de propiedad. */
  async findAll(): Promise<TipoPropiedad[]> {
    const [rows] = await this.pool.query<TipoPropiedadRow[]>(
      `SELECT ${COLUMNS} FROM tipo_propiedad ORDER BY id`,
    );
    return rows.map(toEntity);
  }
}

/** Mapea una fila cruda de `mysql2` a {@link TipoPropiedad}. */
function toEntity(row: TipoPropiedadRow): TipoPropiedad {
  const tipo = new TipoPropiedad();
  tipo.id = row.id;
  tipo.nombre = row.nombre;
  return tipo;
}
