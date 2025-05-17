import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacturasService } from './services/facturas.service';
import { FacturasController } from './controllers/facturas.controller';
import { Factura } from './entities/factura.entity';
import { DatosFiscales } from './entities/datos-fiscales.entity';
import { Donacion } from '../donaciones/entities/donacion.entity';
import { ConfigModule } from '@nestjs/config';
import { MailService } from '../../common/services/mail.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Factura, DatosFiscales, Donacion]),
    ConfigModule,
  ],
  controllers: [FacturasController],
  providers: [FacturasService, MailService],
  exports: [FacturasService],
})
export class FacturasModule {}