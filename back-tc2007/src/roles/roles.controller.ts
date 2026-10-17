import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../usuarios/auth/auth.guard';
import { RolesService } from './roles.service';
import { RolResponseDto } from './dto/rol-response.dto';

/** Catálogo de roles (`/roles`), solo lectura. Se llena desde `schema.sql`. Requiere Bearer token. */
@ApiTags('roles')
@ApiBearerAuth('access-token')
@Controller('roles')
@UseGuards(AuthGuard)
export class RolesController {
  constructor(private readonly service: RolesService) {}

  /** Lista todos los roles. */
  @ApiOperation({ summary: 'Listar roles' })
  @ApiOkResponse({ type: RolResponseDto, isArray: true })
  @Get()
  findAll(): Promise<RolResponseDto[]> {
    return this.service.findAll();
  }
}
