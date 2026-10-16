import { Module, OnModuleDestroy, Inject } from '@nestjs/common';
import { createPool } from 'mysql2/promise';
import type { Pool } from 'mysql2/promise';

/** Token de inyección del pool de conexiones `mysql2`. Se inyecta con `@Inject(DB_POOL)`. */
export const DB_POOL = 'DB_POOL';

/**
 * Cadena de conexión a MySQL. Se lee de la variable de entorno
 * `DATABASE_URL` (archivo `.env`, que no se sube al repo) para no
 * publicar usuario y contraseña. Usar un usuario de MySQL propio de la
 * app con permisos solo sobre `fraud2`, no `root`.
 *
 *
 */
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('Falta la variable de entorno DATABASE_URL');
  }
  return url;
}
/**
 * Módulo global de acceso a base de datos. Expone un único pool de
 * conexiones (`mysql2/promise`, sin ORM) bajo el token {@link DB_POOL},
 * que todos los repositorios de la app inyectan y usan directamente
 * con `pool.query(...)`.
 */
@Module({
  providers: [
    {
      provide: DB_POOL,
      useFactory: () => {
        return createPool({ uri: getDatabaseUrl() });
      },
    },
  ],
  exports: [DB_POOL],
})
export class DatabaseModule implements OnModuleDestroy {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  /** Cierra el pool de conexiones al apagar la aplicación. */
  onModuleDestroy() {
    return this.pool.end();
  }
}
