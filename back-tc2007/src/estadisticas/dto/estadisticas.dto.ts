import { ApiProperty } from '@nestjs/swagger';

/** Número de reportes de una opción de catálogo (estado o tipo de fraude). */
export class ConteoDto {
  @ApiProperty({ example: 2 })
  id!: number;

  @ApiProperty({ example: 'Fraude confirmado' })
  nombre!: string;

  @ApiProperty({ example: 5 })
  total!: number;
}

/** Número de reportes creados en un mes. */
export class ConteoMesDto {
  @ApiProperty({ example: '2026-10', description: 'Año y mes (YYYY-MM)' })
  mes!: string;

  @ApiProperty({ example: 12 })
  total!: number;
}

/** Respuesta de `GET /estadisticas` (dashboard, solo admin). */
export class EstadisticasDto {
  @ApiProperty({ example: 40, description: 'Total de reportes activos' })
  totalReportes!: number;

  @ApiProperty({
    type: [ConteoDto],
    description: 'Reportes por estado (incluye los que tienen 0)',
  })
  porEstado!: ConteoDto[];

  @ApiProperty({
    type: [ConteoDto],
    description: 'Reportes por tipo de fraude, de mayor a menor',
  })
  porTipoFraude!: ConteoDto[];

  @ApiProperty({
    type: [ConteoMesDto],
    description:
      'Reportes creados por mes, últimos 6 meses (solo meses con reportes)',
  })
  porMes!: ConteoMesDto[];
}
