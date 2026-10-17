import { Injectable } from '@nestjs/common';
import { EstadosRepository } from './estados.repository';
import { EstadoResponseDto } from './dto/estado-response.dto';

/** Lectura del catálogo de estados. */
@Injectable()
export class EstadosService {
  constructor(private readonly repository: EstadosRepository) {}

  /** Lista todos los estados. */
  async findAll(): Promise<EstadoResponseDto[]> {
    const estados = await this.repository.findAll();
    return estados.map((e) => EstadoResponseDto.fromEntity(e));
  }
}
