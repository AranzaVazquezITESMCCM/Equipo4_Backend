import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../usuarios/auth/auth.guard';
import { EstadosService } from './estados.service';
import { EstadoResponseDto } from './dto/estado-response.dto';

/** Catálogo de estados (`/estados`), solo lectura. Se llena desde `schema.sql`. Requiere Bearer token. */
@ApiTags('estados')
@ApiBearerAuth('access-token')
@Controller('estados')
@UseGuards(AuthGuard)
export class EstadosController {
  constructor(private readonly service: EstadosService) {}

  /** Lista todos los estados. */
  @ApiOperation({ summary: 'Listar estados' })
  @ApiOkResponse({ type: EstadoResponseDto, isArray: true })
  @Get()
  findAll(): Promise<EstadoResponseDto[]> {
    return this.service.findAll();
  }
}
