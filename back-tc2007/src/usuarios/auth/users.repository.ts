import { Inject, Injectable } from '@nestjs/common';
import type { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

import { DB_POOL } from 'src/database/database.module';
import { User } from './entities/user.entity';
import { randomUUID } from 'node:crypto';

/**
 * Columnas que se leen de `usuario` al construir un {@link User}.
 * Se listan explícitamente en lugar de usar `SELECT *` para no
 * depender del orden ni arrastrar columnas nuevas sin querer.
 */
const COLUMNS =
  'id, correo, contrasena, salt, nombre, created_at, rol_id, deleted_at';

interface UserRow extends RowDataPacket {
  id: string;
  correo: string;
  contrasena: string;
  salt: string;
  nombre: string;
  created_at: Date;
  rol_id: number;
}

interface RecoveryCodeRow extends RowDataPacket {
  id: string;
  usuario_id: string;
  codigo: string;
  expira_en: Date;
  usado: number | boolean;
}
export interface PendingAdminRow extends RowDataPacket {
  id: string;
  correo: string;
  nombre: string;
  created_at: Date;
}

/**
 * Acceso a datos para el flujo de autenticación. Opera sobre la
 * misma tabla `usuario` que {@link UsuariosRepository}
 * (usuarios/usuarios.repository.ts), pero con las queries mínimas
 * que necesita login/registro, más la tabla `recovery_code` para la
 * recuperación de contraseña. Todas las queries son parametrizadas.
 *
 * Los `id` nuevos (de usuario y de código de recuperación) se generan
 * con `Math.random().toString(36).substring(2, 10)`: una cadena
 * base 36 de hasta 8 caracteres. No son UUID ni criptográficamente
 * seguros, y no hay reintento si chocan con un id existente.
 *
 * Valores de `rol_id` que maneja este repositorio:
 * - `1`: usuario final (registro público).
 * - `2`: administrador aprobado.
 * - `4`: solicitud de administrador pendiente.
 */
@Injectable()
export class UsersRepository {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  /**
   * Busca un usuario activo por correo (excluye borrados lógicamente).
   * Usado en login, en recuperación de contraseña y para checar
   * duplicados en registro.
   */
  async findByEmail(correo: string): Promise<User | undefined> {
    const [rows] = await this.pool.query<UserRow[]>(
      `SELECT ${COLUMNS}
             FROM usuario
             WHERE correo = ?
             AND deleted_at IS NULL`,
      [correo],
    );
    return rows[0] && toEntity(rows[0]);
  }

  /**
   * Inserta un usuario nuevo con `rol_id = 1` (rol "Usuario") fijo:
   * el registro público nunca puede crear administradores. El `id` se
   * genera aquí mismo (ver nota de la clase sobre su formato) y, tras
   * insertar, se relee la fila con {@link findById} para devolver la
   * entidad con los valores que puso la base (p. ej. `created_at`).
   */
  async save(
    correo: string,
    contrasena: string,
    salt: string,
    nombre: string,
  ): Promise<User> {
    const id = randomUUID();
    await this.pool.query<ResultSetHeader>(
      `INSERT INTO usuario
                (id, correo, contrasena, salt, nombre, rol_id)
             VALUES (?, ?, ?, ?, ?, 1)`,
      [id, correo, contrasena, salt, nombre],
    );
    return (await this.findById(id))!;
  }

  /**
   * Igual que {@link save}, pero inserta con `rol_id = 4` (solicitud
   * de administrador pendiente). La cuenta no tiene acceso a nada hasta
   * que {@link approveAdmin} la promueva.
   */
  async saveAdmin(
    correo: string,
    contrasena: string,
    salt: string,
    nombre: string,
  ): Promise<User> {
    const id = randomUUID();
    await this.pool.query(
      `INSERT INTO usuario
        (id, correo, contrasena, salt, nombre, rol_id)
      VALUES (?, ?, ?, ?, ?, 4)`,
      [id, correo, contrasena, salt, nombre],
    );

    return (await this.findById(id))!;
  }
  /**
   * Lista las solicitudes de administrador pendientes (`rol_id = 4`)
   * activas. Devuelve filas crudas, no entidades, y solo con los
   * campos que necesita el dashboard: nunca expone hash ni salt.
   */
  async findPendingAdmins(): Promise<PendingAdminRow[]> {
    const [rows] = await this.pool.query<PendingAdminRow[]>(
      `SELECT id, correo, nombre, created_at
      FROM usuario
      WHERE rol_id = 4
      AND deleted_at IS NULL`,
    );
    return rows;
  }

  /**
   * Promueve una solicitud pendiente a administrador (`rol_id` de 4
   * a 2). La condición `rol_id = 4` en el `WHERE` hace que la
   * operación sea idempotente y segura: no afecta a usuarios que no
   * estén pendientes.
   *
   * @returns `true` si se actualizó una fila; `false` si el id no
   * existe, ya fue aprobado o está borrado.
   */
  async approveAdmin(id: string): Promise<boolean> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `UPDATE usuario
      SET rol_id = 2
      WHERE id = ?
      AND rol_id = 4
      AND deleted_at IS NULL`,
      [id],
    );
    return result.affectedRows > 0;
  }

  /** Pendiente (4) → Usuario (1). */
  async rejectAdmin(id: string): Promise<boolean> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `UPDATE usuario SET rol_id = 1
       WHERE id = ? AND rol_id = 4 AND deleted_at IS NULL`,
      [id],
    );
    return result.affectedRows > 0;
  }

  /** Admin (2) o Super admin (3) → Usuario (1). */
  async revokeAdmin(id: string): Promise<boolean> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `UPDATE usuario SET rol_id = 1
       WHERE id = ? AND rol_id IN (2, 3) AND deleted_at IS NULL`,
      [id],
    );
    return result.affectedRows > 0;
  }

  /** Rol actual de un usuario activo, o `undefined` si no existe. */
  async findRolId(id: string): Promise<number | undefined> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT rol_id FROM usuario WHERE id = ? AND deleted_at IS NULL`,
      [id],
    );
    return rows[0]?.rol_id as number | undefined;
  }

  /** Número de super admins activos. */
  async countSuperAdmins(): Promise<number> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM usuario WHERE rol_id = 3 AND deleted_at IS NULL`,
    );
    return Number(rows[0].total);
  }

  /**
   * Busca un usuario activo por id. Hoy solo se usa internamente para
   * releer la fila recién insertada en {@link save} y {@link saveAdmin}.
   */
  async findById(id: string): Promise<User | undefined> {
    const [rows] = await this.pool.query<UserRow[]>(
      `SELECT ${COLUMNS} FROM usuario WHERE id = ? AND deleted_at IS NULL`,
      [id],
    );
    return rows[0] && toEntity(rows[0]);
  }

  /**
   * Guarda un código de recuperación de contraseña, marcado como no
   * usado. No invalida códigos anteriores del mismo usuario: si pide
   * varios, todos siguen siendo válidos hasta que expiren o se usen.
   */
  /**
   * Guarda un código de recuperación de contraseña, marcado como no usado.
   * Invalida los códigos anteriores del mismo usuario y genera un ID de 8 caracteres.
   */
  async createRecoveryCode(usuarioId: string, codigo: string, expiraEn: Date) {
    // 1. Invalida TODOS los códigos anteriores que no se hayan usado aún
    await this.pool.query(
      `UPDATE recovery_code 
       SET usado = TRUE 
       WHERE usuario_id = ? AND usado = FALSE`,
      [usuarioId],
    );

    // Generar ID único para la fila de recovery_code
    const id = randomUUID();

    // 2. Inserta el nuevo código activo con su id correspondiente
    await this.pool.query(
      `INSERT INTO recovery_code (id, usuario_id, codigo, expira_en, usado) 
       VALUES (?, ?, ?, ?, FALSE)`,
      [id, usuarioId, codigo, expiraEn],
    );
  }

  /**
   * Busca un código de recuperación no usado que coincida con el usuario y el código.
   * La comparación es case-sensitive usando BINARY.
   */
  async findRecoveryCode(
    usuarioId: string,
    codigo: string,
  ): Promise<RecoveryCodeRow | null> {
    const [rows] = await this.pool.query<RecoveryCodeRow[]>(
      `SELECT * FROM recovery_code
       WHERE usuario_id = ?
         AND codigo = BINARY ?
         AND usado = FALSE
       LIMIT 1`,
      [usuarioId, codigo],
    );
    return rows[0] ?? null;
  }

  /** Marca un código de recuperación como usado para que no se pueda reutilizar. */
  /** Marca un código de recuperación como usado */
  async useRecoveryCode(id: string | number): Promise<void> {
    await this.pool.query(
      `UPDATE recovery_code
     SET usado = TRUE
     WHERE id = ?`,
      [id],
    );
  }

  /**
   * Reemplaza el hash y el salt de un usuario. Ambos se actualizan juntos.
   */
  async updatePassword(
    usuarioId: string,
    contrasena: string,
    salt: string,
  ): Promise<void> {
    await this.pool.query(
      `UPDATE usuario
      SET contrasena = ?, salt = ?
      WHERE id = ?`,
      [contrasena, salt, usuarioId],
    );
  }
}

/**
 * Mapea una fila cruda de `mysql2` (snake_case, nombres en español) a
 * {@link User}. Aunque {@link COLUMNS} lee `nombre` y `deleted_at`,
 * esos campos no se copian a la entidad.
 */
function toEntity(row: UserRow): User {
  const user = new User();

  user.id = row.id;
  user.email = row.correo;
  user.passwordHash = row.contrasena;
  user.salt = row.salt;
  user.createdAt = row.created_at;
  user.rolId = row.rol_id;
  return user;
}
