import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from './jwt';
import type { RequestConUsuario } from '../../common/request-con-usuario';

/**
 * Decorador de parámetro que inyecta en el handler los claims del
 * token del usuario autenticado, evitando leer `req.user` a mano:
 *
 * ```ts
 * @Get('me')
 * findMe(@CurrentUser() user: JwtPayload) { ... }
 * ```
 *
 * Solo funciona en rutas protegidas por {@link AuthGuard}, que es
 * quien valida el token y deja el payload en `req.user`. En una ruta
 * sin ese guard devuelve `undefined`, aunque el tipo diga
 * {@link JwtPayload}.
 *
 * El valor son los claims del token (`sub`, `email`, `rolId`, ...), no
 * el registro actual de la base de datos: refleja el estado del
 * usuario al momento de emitirse el token.
 *
 * El argumento `_data` (lo que se pase entre paréntesis, p. ej.
 * `@CurrentUser('email')`) se ignora; siempre se devuelve el payload
 * completo.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): JwtPayload => {
    return context.switchToHttp().getRequest<RequestConUsuario>()
      .user as JwtPayload;
  },
);
