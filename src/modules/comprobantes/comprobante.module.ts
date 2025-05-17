import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComprobantesService } from './services/comprobantes.service';
import { ComprobantesController } from '../comprobantes/controllers/comprobante.controller';
import { Comprobante } from './entities/comprobante.entity';
import { Donacion } from '../donaciones/entities/donacion.entity';
import { ConfigModule } from '@nestjs/config';
import { MailService } from '../../common/services/mail.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comprobante, Donacion]),
    ConfigModule,
  ],
  controllers: [ComprobantesController],
  providers: [ComprobantesService, MailService],
  exports: [ComprobantesService],
})
export class ComprobantesModule {}