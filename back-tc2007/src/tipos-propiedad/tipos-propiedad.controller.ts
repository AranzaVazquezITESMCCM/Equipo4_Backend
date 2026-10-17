import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../usuarios/auth/auth.guard';
import { TiposPropiedadService } from './tipos-propiedad.service';
import { TipoPropiedadResponseDto } from './dto/tipo-propiedad-response.dto';

/** Catálogo de tipos de propiedad (`/tipos-propiedad`), solo lectura. Se llena desde `schema.sql`. Requiere Bearer token. */
@ApiTags('tipos-propiedad')
@ApiBearerAuth('access-token')
@Controller('tipos-propiedad')
@UseGuards(AuthGuard)
export class TiposPropiedadController {
  constructor(private readonly service: TiposPropiedadService) {}

  /** Lista todos los tipos de propiedad. */
  @ApiOperation({ summary: 'Listar tipos de propiedad' })
  @ApiOkResponse({ type: TipoPropiedadResponseDto, isArray: true })
  @Get()
  findAll(): Promise<TipoPropiedadResponseDto[]> {
    return this.service.findAll();
  }
}
