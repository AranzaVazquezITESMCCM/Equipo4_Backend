import { Injectable } from '@nestjs/common';
import { TiposPropiedadRepository } from './tipos-propiedad.repository';
import { TipoPropiedadResponseDto } from './dto/tipo-propiedad-response.dto';

/** Lectura del catálogo de tipos de propiedad. */
@Injectable()
export class TiposPropiedadService {
  constructor(private readonly repository: TiposPropiedadRepository) {}

  /** Lista todos los tipos de propiedad. */
  async findAll(): Promise<TipoPropiedadResponseDto[]> {
    const tipos = await this.repository.findAll();
    return tipos.map((t) => TipoPropiedadResponseDto.fromEntity(t));
  }
}
