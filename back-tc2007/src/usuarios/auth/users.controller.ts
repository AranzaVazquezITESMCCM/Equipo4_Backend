import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AdminGuard } from './admin.guard';
import { AuthService } from './users.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { ApiBody, ApiOkResponse, ApiOperation } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    console.log('DTO RECIBIDO:', dto);
    return this.service.register(dto);
  }

  @Post('register-admin')
    @UseGuards(AuthGuard, AdminGuard)
    registerAdmin(@Body() dto: RegisterDto) {
      return this.service.registerAdmin(dto);
    }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.service.login(dto);
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto) {
    return this.service.refresh(dto);
  }

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