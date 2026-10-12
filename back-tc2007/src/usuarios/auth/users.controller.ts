import { Body, Controller, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from './current-user.decorator';
import type { JwtPayload } from './jwt';
import { AuthGuard } from './auth.guard';
import { SuperAdminGuard } from './super-admin.guard';
import { AuthService } from './users.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';

/**
 * Autenticación y alta de cuentas (`/auth`).
 *
 * Distinto de `/usuarios`: aquí ocurre el registro público, el inicio
 * de sesión, la renovación de tokens y la recuperación de contraseña.
 * La mayoría de las rutas son públicas porque se usan antes de tener
 * un token; las únicas protegidas son las de gestión de solicitudes de
 * administrador, que exigen un Bearer token válido ({@link AuthGuard})
 * y rol de super administrador ({@link SuperAdminGuard}).
 *
 * Existen dos flujos paralelos: el de usuario final (`register` /
 * `login`) y el de administrador (`register-admin` / `admin-login`).
 * Un administrador recién registrado queda pendiente hasta que un
 * super administrador lo aprueba en `PATCH /auth/admins/:id/approve`.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  /**
   * Registro público de un usuario final. No requiere token.
   */
  @ApiOperation({ summary: 'Registrar un usuario final' })
  @ApiCreatedResponse({ description: 'Usuario creado correctamente.' })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    console.log('DTO RECIBIDO:', dto);
    return this.service.register(dto);
  }

  /**
   * Solicitud de registro como administrador. La ruta es pública,
   * pero la cuenta queda en estado pendiente: no puede usar
   * `POST /auth/admin-login` hasta que un super administrador la
   * apruebe. Reutiliza {@link RegisterDto} del registro normal.
   */
  @ApiOperation({ summary: 'Solicitar registro como administrador' })
  @ApiCreatedResponse({ description: 'Solicitud creada; pendiente de aprobación.' })
  @Post('register-admin')
  registerAdmin(@Body() dto: RegisterDto) {
    return this.service.registerAdmin(dto);
  }

  /**
   * Lista las solicitudes de administrador que aún no han sido
   * aprobadas. Solo accesible para super administradores.
   */
  @ApiOperation({ summary: 'Listar administradores pendientes de aprobación' })
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ description: 'Lista de administradores pendientes.' })
  @Get('pending-admins')
  @UseGuards(AuthGuard, SuperAdminGuard)
  getPendingAdmins() {
    return this.service.getPendingAdmins();
  }

  /**
   * Aprueba la solicitud de un administrador pendiente, habilitándolo
   * para iniciar sesión en el flujo de administración. Solo accesible
   * para super administradores.
   */
  @ApiOperation({ summary: 'Aprobar un administrador pendiente' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', description: 'ID del administrador a aprobar' })
  @ApiOkResponse({ description: 'Administrador aprobado.' })
  @Patch('admins/:id/approve')
  @UseGuards(AuthGuard, SuperAdminGuard)
  approveAdmin(@Param('id') id: string) {
    return this.service.approveAdmin(id);
  }

    /** Rechaza una solicitud pendiente: el usuario pasa de Pendiente (4) a Usuario (1). */
  @ApiOperation({ summary: 'Rechazar una solicitud de administrador' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', description: 'ID del usuario pendiente' })
  @ApiOkResponse({ description: 'Solicitud rechazada.' })
  @Patch('admins/:id/reject')
  @UseGuards(AuthGuard, SuperAdminGuard)
  rejectAdmin(@Param('id') id: string) {
    return this.service.rejectAdmin(id);
  }

  /**
   * Quita el acceso a un administrador o super admin: pasa a Usuario (1).
   * No permite quitarse el rol a sí mismo ni dejar el sistema sin super admins.
   */
  @ApiOperation({ summary: 'Quitar acceso a un administrador' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', description: 'ID del administrador' })
  @ApiOkResponse({ description: 'Acceso retirado.' })
  @Patch('admins/:id/revoke')
  @UseGuards(AuthGuard, SuperAdminGuard)
  revokeAdmin(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.revokeAdmin(id, user.sub);
  }


  /**
   * Inicio de sesión de usuario final. Responde `200` (en lugar del
   * `201` por defecto de un `POST`) porque no crea ningún recurso.
   */
  @ApiOperation({ summary: 'Iniciar sesión (usuario final)' })
  @ApiOkResponse({ description: 'Credenciales válidas; devuelve los tokens de sesión.' })
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.service.login(dto);
  }

  /**
   * Inicio de sesión del panel de administración. Usa el mismo
   * {@link LoginDto} que el login normal, pero el servicio valida
   * además que la cuenta sea de administrador y esté aprobada.
   */
  @ApiOperation({ summary: 'Iniciar sesión (administrador)' })
  @ApiOkResponse({ description: 'Credenciales válidas; devuelve los tokens de sesión.' })
  @Post('admin-login')
  @HttpCode(200)
  adminLogin(@Body() dto: LoginDto) {
    return this.service.adminLogin(dto);
  }

  /**
   * Intercambia un refresh token vigente por un nuevo access token,
   * para que el cliente renueve la sesión sin volver a pedir
   * credenciales.
   */
  @ApiOperation({ summary: 'Renovar el access token' })
  @ApiOkResponse({ description: 'Devuelve un nuevo access token.' })
  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto) {
    return this.service.refresh(dto);
  }

  /**
   * Inicia la recuperación de contraseña para el correo indicado.
   *
   * El body está tipado en línea (`{ correo: string }`) en vez de con
   * un DTO de clase, por lo que no pasa por class-validator ni aparece
   * descrito en Swagger salvo por el `@ApiBody` de abajo.
   */
  @ApiOperation({ summary: 'Solicitar recuperación de contraseña' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { correo: { type: 'string', format: 'email' } },
      required: ['correo'],
    },
  })
  @ApiOkResponse({ description: 'Solicitud procesada.' })
  @Post('forgot-password')
  @HttpCode(200)
  forgotPassword(@Body() dto: { correo: string }) {
    return this.service.forgotPassword(dto.correo);
  }

@ApiOperation({ summary: 'Verificar código de recuperación' })
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      correo: { type: 'string', format: 'email' },
      codigo: { type: 'string', example: 'K7M2QX' },
    },
    required: ['correo', 'codigo'],
  },
})
@ApiOkResponse({ description: 'Código válido.' })
@Post('verify-code')
@HttpCode(200)
verifyCode(@Body() dto: { correo: string; codigo: string }) {
  return this.service.verifyCode(dto.correo, dto.codigo);
}

@Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() body: { correo: string; codigo: string; nuevaContrasena: string }) {
    // Si en tu constructor se llama 'authService', usa this.authService.resetPassword
    // Si en tu constructor se llama 'service', usa this.service.resetPassword
    return this.service.resetPassword(body);
  }

}