import { Injectable } from '@nestjs/common';
import { FuentesRepository } from './fuentes.repository';
import { FuenteResponseDto } from './dto/fuente-response.dto';

/** Lectura del catálogo de fuentes. */
@Injectable()
export class FuentesService {
  constructor(private readonly repository: FuentesRepository) {}

  /** Lista todas las fuentes. */
  async findAll(): Promise<FuenteResponseDto[]> {
    const fuentes = await this.repository.findAll();
    return fuentes.map((f) => FuenteResponseDto.fromEntity(f));
  }
}
