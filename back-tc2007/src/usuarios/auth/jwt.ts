/**
 * Implementación mínima de JWT con HS256 (HMAC-SHA256), sin
 * dependencias externas: solo `node:crypto` y `node:buffer`.
 *
 * Genera tokens con el formato estándar `header.payload.firma`, cada
 * parte en base64url, así que son compatibles con cualquier librería
 * JWT que use el mismo secreto. La usan {@link AuthService} para
 * emitir y renovar tokens y {@link AuthGuard} para validarlos.
 */
import { Buffer } from 'node:buffer';
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Secreto con el que se firman y verifican todos los tokens.
 */
function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Falta la variable de entorno JWT_SECRET');
  }
  return secret;
}

/** Claims que viajan dentro de cada token emitido por {@link sign}. */
export interface JwtPayload {
  /** Id del usuario (claim estándar "subject"). */
  sub: string;
  email: string;
  rol?: string;
  /**
   * Distingue access tokens de refresh tokens. Ambos se firman igual,
   * así que quien consume el token debe revisar este campo para no
   * aceptar uno en lugar del otro.
   */
  type: 'access' | 'refresh';
  /** Momento de emisión, en segundos Unix. */
  iat: number;
  /** Momento de expiración, en segundos Unix. */
  exp: number;
  /** Rol del usuario al momento de emitir el token (ver {@link SuperAdminGuard}). */
  rolId: number;
}

/** Hora actual en segundos Unix, la unidad que usan `iat` y `exp`. */
function now(): number {
  return Math.floor(Date.now() / 1000);
}

/** Serializa un objeto a JSON y lo codifica en base64url. */
function b64url(json: object): string {
  return Buffer.from(JSON.stringify(json)).toString('base64url');
}

/** Firma una cadena con HMAC-SHA256 y {@link SECRET}; devuelve base64url. */
function hmac(data: string): string {
  return createHmac('sha256', getSecret()).update(data).digest('base64url');
}

/**
 * Emite un token firmado. `iat` y `exp` se calculan aquí, por eso no
 * forman parte del parámetro `payload`.
 *
 * @param payload Claims del token, sin `iat` ni `exp`.
 * @param ttlSeconds Vida del token en segundos.
 * @returns El token en formato `header.payload.firma`.
 */
export function sign(
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
  ttlSeconds: number,
): string {
  const header = b64url({ alg: 'HS256', typ: 'JWT' });
  const body = b64url({
    ...payload,
    iat: now(),
    exp: now() + ttlSeconds,
  });

  const signature = hmac(`${header}.${body}`);

  return `${header}.${body}.${signature}`;
}

/**
 * Valida un token y devuelve sus claims.
 *
 * La firma se recalcula siempre con HS256 sin leer el `alg` del
 * header, lo que evita ataques que cambian el algoritmo (como
 * `alg: none`). El payload solo se decodifica después de validar la
 * firma, así que `JSON.parse` nunca procesa contenido ajeno.
 *
 * No revisa `type`: esa validación le toca a quien llama (por ejemplo,
 * {@link AuthService.refresh} exige `type === 'refresh'`).
 *
 * @returns Los claims si el token es válido y no ha expirado; `null`
 * si está mal formado, la firma no coincide o ya expiró.
 */
export function verify(token: string): JwtPayload | null {
  const [header, body, signature] = token.split('.');

  if (!header || !body || !signature) {
    return null;
  }

  // Comparación en tiempo constante: con `!==` se puede adivinar la
  // firma byte por byte midiendo cuánto tarda en responder.
  const esperada = Buffer.from(hmac(`${header}.${body}`));
  const recibida = Buffer.from(signature);
  if (
    esperada.length !== recibida.length ||
    !timingSafeEqual(esperada, recibida)
  ) {
    return null;
  }

  // Un body que no es JSON válido debe ser 401 (token inválido), no 500.
  let payload: JwtPayload;
  try {
    payload = JSON.parse(
      Buffer.from(body, 'base64url').toString(),
    ) as JwtPayload;
  } catch {
    return null;
  }

  if (typeof payload.exp !== 'number' || payload.exp < now()) {
    return null;
  }

  return payload;
}
