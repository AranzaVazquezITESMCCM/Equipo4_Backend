import { Inject, Injectable } from '@nestjs/common';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { DB_POOL } from '../database/database.module';
import { ConteoDto, ConteoMesDto } from './dto/estadisticas.dto';

/** Consultas de conteo sobre `reporte`. Ignoran los reportes borrados. */
@Injectable()
export class EstadisticasRepository {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  async contarReportes(): Promise<number> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM reporte WHERE deleted_at IS NULL`,
    );
    return Number(rows[0].total);
  }

  /** LEFT JOIN para que también salgan los estados con 0 reportes. */
  async contarPorEstado(): Promise<ConteoDto[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT e.id, e.nombre, COUNT(r.id) AS total
       FROM estado e
       LEFT JOIN reporte r ON r.estado_id = e.id AND r.deleted_at IS NULL
       GROUP BY e.id, e.nombre
       ORDER BY e.id`,
    );
    return rows.map(toConteo);
  }

  async contarPorTipoFraude(): Promise<ConteoDto[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT t.id, t.nombre, COUNT(r.id) AS total
       FROM tipo_fraude t
       LEFT JOIN reporte r ON r.tipo_fraude_id = t.id AND r.deleted_at IS NULL
       GROUP BY t.id, t.nombre
       ORDER BY total DESC, t.id`,
    );
    return rows.map(toConteo);
  }

  /** Reportes creados por mes desde el día 1 de hace 5 meses (6 meses en total). */
  async contarPorMes(): Promise<ConteoMesDto[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS mes, COUNT(*) AS total
       FROM reporte
       WHERE deleted_at IS NULL
         AND created_at >= DATE_FORMAT(CURDATE() - INTERVAL 5 MONTH, '%Y-%m-01')
       GROUP BY mes
       ORDER BY mes`,
    );
    return rows.map((r) => ({ mes: String(r.mes), total: Number(r.total) }));
  }
}

function toConteo(row: RowDataPacket): ConteoDto {
  return {
    id: Number(row.id),
    nombre: String(row.nombre),
    total: Number(row.total),
  };
}
