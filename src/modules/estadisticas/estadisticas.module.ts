import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstadisticasController } from '../estadisticas/controllers/estadisticas.controller';
import { EstadisticasService } from './services/estadisticas.service';
import { EstadisticaMensual } from './entities/estadistica-mensual';
import { Donacion } from '../donaciones/entities/donacion.entity';
import { Suscripcion } from '../suscripciones/entities/suscripcion.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Campana } from '../campanas/entities/campana.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EstadisticaMensual,
      Donacion,
      Suscripcion,
      Usuario,
      Campana,
    ]),
    ConfigModule,
  ],
  controllers: [EstadisticasController],
  providers: [EstadisticasService],
  exports: [EstadisticasService],
})
export class EstadisticasModule {}