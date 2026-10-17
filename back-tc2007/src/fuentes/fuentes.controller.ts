import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../usuarios/auth/auth.guard';
import { FuentesService } from './fuentes.service';
import { FuenteResponseDto } from './dto/fuente-response.dto';

/** Catálogo de fuentes (`/fuentes`), solo lectura. Se llena desde `schema.sql`. Requiere Bearer token. */
@ApiTags('fuentes')
@ApiBearerAuth('access-token')
@Controller('fuentes')
@UseGuards(AuthGuard)
export class FuentesController {
  constructor(private readonly service: FuentesService) {}

  /** Lista todas las fuentes. */
  @ApiOperation({ summary: 'Listar fuentes' })
  @ApiOkResponse({ type: FuenteResponseDto, isArray: true })
  @Get()
  findAll(): Promise<FuenteResponseDto[]> {
    return this.service.findAll();
  }
}
