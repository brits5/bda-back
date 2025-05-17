import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { LoginDto, RegisterDto, ResetPasswordRequestDto, ResetPasswordDto } from '../../auth/dto/auth.dto';
import { MailService } from '../../../common/services/mail.service';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
    private jwtService: JwtService,
    private mailService: MailService,
    private configService: ConfigService,
  ) {}

  /**
   * Valida un usuario mediante sus credenciales
   */
  async validateUser(correo: string, password: string): Promise<any> {
    const usuario = await this.usuariosRepository.findOne({
      where: { correo, activo: true }
    });

    if (usuario && (await bcrypt.compare(password, usuario.password))) {
      const { password, ...result } = usuario;
      return result;
    }
    return null;
  }

  /**
   * Realiza el login de un usuario
   */
  async login(loginDto: LoginDto) {
    const usuario = await this.validateUser(loginDto.correo, loginDto.password);
    
    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }
    
    // Actualizar último login
    await this.usuariosRepository.update(
      { id_usuario: usuario.id_usuario },
      { ultimo_login: new Date() }
    );
    
    return this.generateTokens(usuario);
  }

  /**
   * Registra un nuevo usuario
   */
  async register(registerDto: RegisterDto) {
    // Verificar si el correo ya está en uso
    const existente = await this.usuariosRepository.findOne({
      where: { correo: registerDto.correo }
    });
    
    if (existente) {
      throw new BadRequestException('El correo electrónico ya está registrado');
    }
    
    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    
    // Crear el usuario
    const usuario = this.usuariosRepository.create({
      ...registerDto,
      password: hashedPassword,
      fecha_registro: new Date(),
      ultimo_login: new Date(),
      activo: true,
      puntos_acumulados: 0,
      nivel_donante: 'Bronce',
    });
    
    const usuarioGuardado = await this.usuariosRepository.save(usuario);
    
    // Enviar email de bienvenida
    await this.mailService.enviarEmailBienvenida(
      usuarioGuardado.nombres,
      usuarioGuardado.correo
    );
    
    // Generar tokens
    const { password, ...result } = usuarioGuardado;
    return {
      ...this.generateTokens(result),
      usuario: result,
    };
  }

  /**
   * Genera tokens JWT (access token y refresh token)
   */
  private generateTokens(usuario: any) {
    const payload = { 
      sub: usuario.id_usuario, 
      email: usuario.correo,
      nombre: `${usuario.nombres} ${usuario.apellidos}`,
      nivel: usuario.nivel_donante
    };
    
    return {
      access_token: this.jwtService.sign(payload, {
        secret: this.configService.get('jwt.secret'),
        expiresIn: this.configService.get('jwt.expiresIn'),
      }),
      refresh_token: this.jwtService.sign(
        { ...payload, type: 'refresh' },
        {
          secret: this.configService.get('jwt.secret'),
          expiresIn: this.configService.get('jwt.refreshExpiresIn'),
        },
      ),
      expires_in: this.getExpiresInSeconds(this.configService.get('jwt.expiresIn') || '1h'),
    };
  }

  /**
   * Refresca un token JWT
   */
  async refreshToken(refreshToken: string) {
    try {
      // Verificar el refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('jwt.secret'),
      });
      
      // Verificar que sea un refresh token
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Token inválido');
      }
      
      // Obtener el usuario
      const usuario = await this.usuariosRepository.findOne({
        where: { id_usuario: payload.sub, activo: true }
      });
      
      if (!usuario) {
        throw new UnauthorizedException('Usuario no encontrado o inactivo');
      }
      
      // Generar nuevos tokens
      const { password, ...result } = usuario;
      return this.generateTokens(result);
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  /**
   * Solicita un restablecimiento de contraseña
   */
  async requestPasswordReset(resetDto: ResetPasswordRequestDto) {
    const usuario = await this.usuariosRepository.findOne({
      where: { correo: resetDto.correo, activo: true }
    });
    
    if (!usuario) {
      // Por seguridad, no indicamos si el correo existe o no
      return { message: 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña' };
    }
    
    // Generar token único
    const resetToken = uuidv4();
    
    // Guardar token en la base de datos (en una tabla separada para tokens de restablecimiento)
    // Este es un ejemplo simplificado; en producción, deberías usar una tabla dedicada
    
    // Enviar email con el token
    await this.mailService.enviarEmailRestablecerPassword(
      usuario.correo,
      resetToken,
      usuario.nombres
    );
    
    return { 
      message: 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña'
    };
  }

  /**
   * Restablece la contraseña con un token
   */
  async resetPassword(resetDto: ResetPasswordDto) {
    // Verificar token (aquí deberías buscar en una tabla de tokens de reset)
    // Este es un ejemplo simplificado
    
    // Actualizar contraseña
    const hashedPassword = await bcrypt.hash(resetDto.password, 10);
    
    // En un escenario real, buscarías el usuario asociado al token
    // Aquí es una implementación de ejemplo
    /*
    await this.usuariosRepository.update(
      { id_usuario: userId },
      { password: hashedPassword }
    );
    */
    
    return { message: 'Contraseña restablecida exitosamente' };
  }

  /**
   * Convierte una expresión de expiración (como '1d', '2h') a segundos
   */
  private getExpiresInSeconds(expiresIn: string): number {
    const unit = expiresIn.charAt(expiresIn.length - 1);
    const value = parseInt(expiresIn.slice(0, -1));
    
    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 3600; // 1 hora por defecto
    }
  }

  /**
   * Verifica si un token es válido
   */
  async validateToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get('jwt.secret'),
      });
    } catch (error) {
      return null;
    }
  }

  /**
   * Obtiene un usuario por su ID
   */
  async getUserById(userId: number) {
    const usuario = await this.usuariosRepository.findOne({
      where: { id_usuario: userId }
    });

    if (!usuario) {
      throw new BadRequestException('Usuario no encontrado');
    }

    const { password, ...result } = usuario;
    return result;
  }

  /**
   * Cambia la contraseña de un usuario
   */
  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const usuario = await this.usuariosRepository.findOne({
      where: { id_usuario: userId }
    });

    if (!usuario) {
      throw new BadRequestException('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(currentPassword, usuario.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Contraseña actual incorrecta');
    }

    // Verificar que la nueva contraseña sea diferente
    if (currentPassword === newPassword) {
      throw new BadRequestException('La nueva contraseña debe ser diferente a la actual');
    }

    // Encriptar nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña FALTAAAAAA
    
    return { message: 'Contraseña actualizada exitosamente' };
  }

  /**
   * Verifica si un usuario es administrador
   */
  async isAdmin(userId: number): Promise<boolean> {
    const usuario = await this.usuariosRepository.findOne({
      where: { id_usuario: userId }
    });

    if (!usuario) {
      return false;
    }

    // En una implementación real, verificarías el rol desde la base de datos
    // Este es un ejemplo simplificado
    return usuario.correo.endsWith('@admin.com');
  }
}