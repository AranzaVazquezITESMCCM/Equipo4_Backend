import { ConflictException, Inject, Injectable } from '@nestjs/common';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { mysqlErrno } from '../common/mysql-error';
import { DB_POOL } from '../database/database.module';
import { Usuario } from './entities/usuario.entity';

const COLUMNS =
  'id, correo, contrasena, salt, nombre, rol_id, created_at, deleted_at';

interface UsuarioRow extends RowDataPacket {
  id: string;
  correo: string;
  contrasena: string;
  salt: string;
  nombre: string;
  rol_id: number;
  created_at: Date;
  deleted_at: Date | null;
}

/**
 *
 * Aplica borrado lógico: toda lectura filtra `deleted_at IS NULL`.
 */
@Injectable()
export class UsuariosRepository {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  /** Lista los usuarios activos, ordenados por fecha de creación. */
  async findAll(): Promise<Usuario[]> {
    const [rows] = await this.pool.query<UsuarioRow[]>(
      `SELECT ${COLUMNS} FROM usuario WHERE deleted_at IS NULL ORDER BY created_at`,
    );
    return rows.map(toEntity);
  }

  /** Busca un usuario activo por id (UUID). `undefined` si no existe o está borrado. */
  async findById(id: string): Promise<Usuario | undefined> {
    const [rows] = await this.pool.query<UsuarioRow[]>(
      `SELECT ${COLUMNS} FROM usuario WHERE id = ? AND deleted_at IS NULL`,
      [id],
    );
    return rows[0] && toEntity(rows[0]);
  }

  /**
   * Actualiza solo las columnas presentes en `changes` (patrón
   * "set dinámico" parametrizado). Si `changes` viene vacío, no
   * ejecuta ningún UPDATE y simplemente relee la fila.
   * @throws ConflictException si `rolId` no referencia un rol existente.
   */
  async update(
    id: string,
    changes: Partial<Usuario>,
  ): Promise<Usuario | undefined> {
    const asignaciones: string[] = [];
    const valores: unknown[] = [];

    if (changes.correo !== undefined) {
      asignaciones.push('correo = ?');
      valores.push(changes.correo);
    }
    if (changes.contrasena !== undefined) {
      asignaciones.push('contrasena = ?');
      valores.push(changes.contrasena);
    }
    if (changes.salt !== undefined) {
      asignaciones.push('salt = ?');
      valores.push(changes.salt);
    }
    if (changes.nombre !== undefined) {
      asignaciones.push('nombre = ?');
      valores.push(changes.nombre);
    }
    if (changes.rolId !== undefined) {
      asignaciones.push('rol_id = ?');
      valores.push(changes.rolId);
    }

    if (asignaciones.length === 0) return this.findById(id);

    try {
      await this.pool.query(
        `UPDATE usuario SET ${asignaciones.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
        [...valores, id],
      );
    } catch (err: unknown) {
      if (mysqlErrno(err) === 1452) {
        throw new ConflictException('El rol especificado no existe');
      }
      throw err;
    }
    return this.findById(id);
  }
}

/** Mapea una fila cruda de `mysql2` (snake_case) a {@link Usuario}. */
function toEntity(row: UsuarioRow): Usuario {
  const usuario = new Usuario();
  usuario.id = row.id;
  usuario.correo = row.correo;
  usuario.contrasena = row.contrasena;
  usuario.salt = row.salt;
  usuario.nombre = row.nombre;
  usuario.rolId = row.rol_id;
  usuario.createdAt = row.created_at;
  usuario.deletedAt = row.deleted_at;
  return usuario;
}
