import { PartialType } from '@nestjs/mapped-types';
import { CreateReporteDto } from './create-reporte.dto';
import { IsOptional, IsString, IsNumber, IsInt } from 'class-validator';

export class UpdateReporteDto extends PartialType(CreateReporteDto) {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsInt()
  fuenteId?: number;

  @IsOptional()
  @IsInt()
  tipoPropiedadId?: number;

  @IsOptional()
  @IsInt()
  tipoFraudeId?: number;

  @IsOptional()
  @IsNumber()
  precio?: number;

  @IsOptional()
  @IsString()
  zona?: string;

  @IsOptional()
  @IsString()
  contactoOfertante?: string;
}
