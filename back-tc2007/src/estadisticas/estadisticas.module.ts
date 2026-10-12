import { Module } from '@nestjs/common';
import { AuthModule } from '../usuarios/auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { EstadisticasController } from './estadisticas.controller';
import { EstadisticasRepository } from './estadisticas.repository';
import { EstadisticasService } from './estadisticas.service';

/** Módulo de métricas del dashboard. */
@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [EstadisticasController],
  providers: [EstadisticasService, EstadisticasRepository],
})
export class EstadisticasModule {}