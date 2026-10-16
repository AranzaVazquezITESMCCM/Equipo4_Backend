/**
 * Devuelve el `errno` de un error de MySQL (mysql2), o `undefined`
 * si el error no trae uno. Sirve para distinguir, por ejemplo,
 * violaciones de llave foránea (1451, 1452) sin usar `any`.
 */
export function mysqlErrno(err: unknown): number | undefined {
  if (typeof err === 'object' && err !== null && 'errno' in err) {
    const { errno } = err;
    return typeof errno === 'number' ? errno : undefined;
  }
  return undefined;
}
