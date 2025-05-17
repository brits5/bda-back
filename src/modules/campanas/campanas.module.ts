import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampanasController } from '../controllers/campanas.controller';
import { CampanasService } from '../services/campanas.service';
import { Campana } from '../entities/campana.entity';
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