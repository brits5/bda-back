import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from '../auth/controllers/auth.controller';
import { AuthService } from '../auth/strategies/auth.service';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { MailService } from '../../common/services/mail.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('jwt.secret'),
        signOptions: { expiresIn: configService.get('jwt.expiresIn') },
      }),
    }),
    TypeOrmModule.forFeature([Usuario]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, MailService],
  exports: [AuthService],
})
export class AuthModule {}