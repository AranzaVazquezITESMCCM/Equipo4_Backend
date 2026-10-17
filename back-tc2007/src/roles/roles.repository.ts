import { Inject, Injectable } from '@nestjs/common';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { DB_POOL } from '../database/database.module';
import { Rol } from './entities/rol.entity';

const COLUMNS = 'id, nombre, alias';

interface RolRow extends RowDataPacket {
  id: number;
  nombre: string;
  alias: string;
}

/**
 * Acceso a datos de `rol` (catálogo, sin borrado lógico — no tiene
 * columna `deleted_at`). Todas las queries son parametrizadas.
 */
@Injectable()
export class RolesRepository {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  /** Lista todos los roles. */
  async findAll(): Promise<Rol[]> {
    const [rows] = await this.pool.query<RolRow[]>(
      `SELECT ${COLUMNS} FROM rol ORDER BY id`,
    );
    return rows.map(toEntity);
  }
}

/** Mapea una fila cruda de `mysql2` a {@link Rol}. */
function toEntity(row: RolRow): Rol {
  const rol = new Rol();
  rol.id = row.id;
  rol.nombre = row.nombre;
  rol.alias = row.alias;
  return rol;
}
