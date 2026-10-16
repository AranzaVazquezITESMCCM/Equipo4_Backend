import { Injectable } from '@nestjs/common';
import { EstadisticasRepository } from './estadisticas.repository';
import { EstadisticasDto } from './dto/estadisticas.dto';

@Injectable()
export class EstadisticasService {
  constructor(private readonly repository: EstadisticasRepository) {}

  /** Junta todos los conteos del dashboard en una sola respuesta. */
  async obtener(): Promise<EstadisticasDto> {
    const [totalReportes, porEstado, porTipoFraude, porMes] = await Promise.all(
      [
        this.repository.contarReportes(),
        this.repository.contarPorEstado(),
        this.repository.contarPorTipoFraude(),
        this.repository.contarPorMes(),
      ],
    );
    return { totalReportes, porEstado, porTipoFraude, porMes };
  }
}
