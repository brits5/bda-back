import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
  ) {
    const secret = configService.get<string>('jwt.secret');
    if (!secret) {
      throw new Error('JWT secret is not defined in the configuration');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    // Verificar que el usuario existe y está activo
    const usuario = await this.usuariosRepository.findOne({
      where: { id_usuario: payload.sub, activo: true },
    });

    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    // Determinar rol para autorizaciones
    // En una implementación real, podrías tener una tabla de roles y permisos
    const isAdmin = usuario.correo.endsWith('@admin.com'); // Ejemplo simplificado
    const role = isAdmin ? 'admin' : 'user';

    return {
      userId: payload.sub,
      email: payload.email,
      nombre: payload.nombre,
      nivel: payload.nivel,
      role: role,
    };
  }
}