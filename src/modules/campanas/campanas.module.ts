import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampanasController } from '../campanas/controllers/campanas.controller';
import { CampanasService } from '../campanas/services/campanas.service';
import { Campana } from '../campanas/entities/campana.entity';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    TypeOrmModule.forFeature([Campana]),
    EventEmitterModule.forRoot(),
  ],
  controllers: [CampanasController],
  providers: [CampanasService],
  exports: [CampanasService],
})
export class CampanasModule {}