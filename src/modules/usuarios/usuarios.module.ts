import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosController } from '../usuarios/controllers/usuarios.controller';
import { UsuariosService } from '../usuarios/services/usuarios.service';
import { Usuario } from './entities/usuario.entity';
import { Notificacion } from './entities/notificacion.entity';
import { ConfigModule } from '@nestjs/config';
import { MailService } from '../../common/services/mail.service';
import { Donacion } from '../donaciones/entities/donacion.entity';
import { Suscripcion } from '../suscripciones/entities/suscripcion.entity';
import { UsuarioRecompensa } from '../recompensas/entities/usuario-recompensa.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Usuario, 
      Notificacion, 
      Donacion, 
      Suscripcion, 
      UsuarioRecompensa
    ]),
    ConfigModule,
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService, MailService],
  exports: [UsuariosService],
})
export class UsuariosModule {}