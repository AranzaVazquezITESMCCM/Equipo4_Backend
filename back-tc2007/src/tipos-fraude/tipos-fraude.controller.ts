import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../usuarios/auth/auth.guard';
import { TiposFraudeService } from './tipos-fraude.service';
import { TipoFraudeResponseDto } from './dto/tipo-fraude-response.dto';

/** Catálogo de tipos de fraude (`/tipos-fraude`), solo lectura. Se llena desde `schema.sql`. Requiere Bearer token. */
@ApiTags('tipos-fraude')
@ApiBearerAuth('access-token')
@Controller('tipos-fraude')
@UseGuards(AuthGuard)
export class TiposFraudeController {
  constructor(private readonly service: TiposFraudeService) {}

  /** Lista todos los tipos de fraude. */
  @ApiOperation({ summary: 'Listar tipos de fraude' })
  @ApiOkResponse({ type: TipoFraudeResponseDto, isArray: true })
  @Get()
  findAll(): Promise<TipoFraudeResponseDto[]> {
    return this.service.findAll();
  }
}
