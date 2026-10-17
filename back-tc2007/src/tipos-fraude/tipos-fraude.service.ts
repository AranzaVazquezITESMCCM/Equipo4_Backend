import { Injectable } from '@nestjs/common';
import { TiposFraudeRepository } from './tipos-fraude.repository';
import { TipoFraudeResponseDto } from './dto/tipo-fraude-response.dto';

/** Lectura del catálogo de tipos de fraude. */
@Injectable()
export class TiposFraudeService {
  constructor(private readonly repository: TiposFraudeRepository) {}

  /** Lista todos los tipos de fraude. */
  async findAll(): Promise<TipoFraudeResponseDto[]> {
    const tipos = await this.repository.findAll();
    return tipos.map((t) => TipoFraudeResponseDto.fromEntity(t));
  }
}
