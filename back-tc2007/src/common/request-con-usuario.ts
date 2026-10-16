import type { Request } from 'express';
import type { JwtPayload } from '../usuarios/auth/jwt';

/**
 * Request de Express con el usuario autenticado que agrega
 * {@link AuthGuard} a partir del JWT.
 */
export interface RequestConUsuario extends Request {
  user?: JwtPayload;
}
