import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../usuarios/auth/auth.guard';
import { AdminGuard } from '../usuarios/auth/admin.guard';
import { EstadisticasService } from './estadisticas.service';
import { EstadisticasDto } from './dto/estadisticas.dto';

/** Métricas del dashboard administrativo. Solo admin y super admin. */
@ApiTags('estadisticas')
@ApiBearerAuth('access-token')
@Controller('estadisticas')
@UseGuards(AuthGuard, AdminGuard)
export class EstadisticasController {
  constructor(private readonly service: EstadisticasService) {}

  @ApiOperation({ summary: 'Métricas del dashboard (solo admin)' })
  @ApiOkResponse({ type: EstadisticasDto })
  @Get()
  obtener(): Promise<EstadisticasDto> {
    return this.service.obtener();
  }
}
