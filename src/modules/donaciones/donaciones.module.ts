import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DonacionesController } from './controllers/donaciones.controller';
import { DonacionesService } from './services/donaciones.service';
import { Donacion } from './entities/donacion.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Campana } from '../campanas/entities/campana.entity';
import { ComprobantesModule } from '../comprobantes/comprobante.module';
import { FacturasModule } from '../facturas/facturas.module';
import { ConfiguracionesModule } from '../configuraciones/configuraciones.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    TypeOrmModule.forFeature([Donacion, Usuario, Campana]),
    ComprobantesModule,
    FacturasModule,
    ConfiguracionesModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [DonacionesController],
  providers: [DonacionesService],
  exports: [DonacionesService],
})
export class DonacionesModule {}