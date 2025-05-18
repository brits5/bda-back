import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecompensasController } from '../recompensas/controllers/recompensas.controller';
import { RecompensasService } from '../recompensas/services/recompensas.service';
import { Recompensa } from './entities/recompensa.entity';
import { UsuarioRecompensa } from './entities/usuario-recompensa.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { ConfigModule } from '@nestjs/config';
import { MailService } from '../../common/services/mail.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Recompensa, UsuarioRecompensa, Usuario]),
    ConfigModule,
  ],
  controllers: [RecompensasController],
  providers: [RecompensasService, MailService],
  exports: [RecompensasService],
})
export class RecompensasModule {}