import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ConfiguracionesController } from '../configuraciones/controllers/configuraciones.controller';
import { ConfiguracionesService } from '../configuraciones/services/configuraciones.services';
import { Configuracion } from './entities/configuracion.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Configuracion]),
    ConfigModule,
  ],
  controllers: [ConfiguracionesController],
  providers: [ConfiguracionesService],
  exports: [ConfiguracionesService],
})
export class ConfiguracionesModule {}