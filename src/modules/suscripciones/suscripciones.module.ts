import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuscripcionesController } from './controllers/suscripciones.controller';
import { SuscripcionesService } from './services/suscripciones.service';
import { Suscripcion } from './entities/suscripcion.entity';
import { Donacion } from '../donaciones/entities/donacion.entity';
import { MetodoPago } from '../pagos/entities/metodo-pago.entity';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    TypeOrmModule.forFeature([Suscripcion, Donacion, MetodoPago]),
    EventEmitterModule.forRoot(),
  ],
  controllers: [SuscripcionesController],
  providers: [SuscripcionesService],
  exports: [SuscripcionesService],
})
export class SuscripcionesModule {}