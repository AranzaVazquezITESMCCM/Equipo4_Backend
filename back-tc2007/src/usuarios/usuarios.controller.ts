import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from './auth/auth.guard';
import { CurrentUser } from './auth/current-user.decorator';
import type { JwtPayload } from './auth/jwt';
import { UsuariosService } from './usuarios.service';
import { UsuarioResponseDto } from './dto/usuario-response.dto';
import { AdminGuard } from './auth/admin.guard';
import { UpdateMyProfileDto } from './dto/update-profile.dto';

/**
 * Usuarios (`/usuarios`). Requiere Bearer token (ver {@link AuthGuard}).
 *
 * - `GET /usuarios`: lista para el dashboard (solo admins).
 * - `GET` y `PATCH /usuarios/me`: perfil del usuario autenticado.
 *
 * Las cuentas se crean en `/auth` (`register` y `register-admin`).
 */
@ApiTags('Usuarios')
@ApiBearerAuth('access-token')
@Controller('usuarios')
@UseGuards(AuthGuard)
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  /** Lista todos los usuarios activos (excluye los borrados lógicamente). */
  @ApiOperation({ summary: 'Listar usuarios' })
  @ApiOkResponse({ type: UsuarioResponseDto, isArray: true })
  @Get()
  @UseGuards(AdminGuard)
  findAll(): Promise<UsuarioResponseDto[]> {
    return this.service.findAll();
  }

  /** Perfil del usuario autenticado (el id sale del token). */
  @ApiOperation({ summary: 'Ver mi perfil' })
  @ApiOkResponse({ type: UsuarioResponseDto })
  @Get('me')
  findMe(@CurrentUser() user: JwtPayload): Promise<UsuarioResponseDto> {
    return this.service.findMe(user.sub);
  }

  /** Edita nombre o correo del usuario autenticado; no permite cambiar el rol. */
  @ApiOperation({ summary: 'Editar mi perfil' })
  @ApiOkResponse({ type: UsuarioResponseDto })
  @Patch('me')
  updateMe(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateMyProfileDto,
  ): Promise<UsuarioResponseDto> {
    return this.service.updateMe(user.sub, dto);
  }
}
