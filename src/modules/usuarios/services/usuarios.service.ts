import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../entities/usuario.entity';
import { Notificacion } from '../entities/notificacion.entity';
import { Donacion } from '../../donaciones/entities/donacion.entity';
import { Suscripcion } from '../../suscripciones/entities/suscripcion.entity';
import { UsuarioRecompensa } from '../../recompensas/entities/usuario-recompensa.entity';
import { MailService } from '../../../common/services/mail.service';
import { ActualizarUsuarioDto, CambiarPasswordDto, CrearNotificacionDto } from '../dto/usuarios.dto';
import { paginate, Pagination, IPaginationOptions } from 'nestjs-typeorm-paginate';

@Injectable()
export class UsuariosService {
  private readonly logger = new Logger(UsuariosService.name);

  constructor(
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
    @InjectRepository(Notificacion)
    private notificacionesRepository: Repository<Notificacion>,
    @InjectRepository(Donacion)
    private donacionesRepository: Repository<Donacion>,
    @InjectRepository(Suscripcion)
    private suscripcionesRepository: Repository<Suscripcion>,
    @InjectRepository(UsuarioRecompensa)
    private usuariosRecompensasRepository: Repository<UsuarioRecompensa>,
    private mailService: MailService,
  ) {}

  /**
   * Encuentra todos los usuarios con paginación
   */
  async findAll(
    options: IPaginationOptions,
    where: FindOptionsWhere<Usuario> = {},
  ): Promise<Pagination<Usuario>> {
    return paginate<Usuario>(this.usuariosRepository, options, {
      where,
      order: { fecha_registro: 'DESC' },
    });
  }

  /**
   * Encuentra un usuario por ID
   */
  async findOne(id: number): Promise<Usuario> {
    const usuario = await this.usuariosRepository.findOne({
      where: { id_usuario: id },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return usuario;
  }

  /**
   * Encuentra un usuario por correo electrónico
   */
  async findByEmail(correo: string): Promise<Usuario> {
    const usuario = await this.usuariosRepository.findOne({
      where: { correo },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con correo ${correo} no encontrado`);
    }

    return usuario;
  }

  /**
   * Actualiza un usuario
   */
  async update(id: number, updateUsuarioDto: ActualizarUsuarioDto): Promise<Usuario> {
    const usuario = await this.findOne(id);
    
    // Actualizar campos
    Object.assign(usuario, updateUsuarioDto);
    
    return this.usuariosRepository.save(usuario);
  }

  /**
   * Cambia la contraseña de un usuario
   */
  async changePassword(id: number, cambiarPasswordDto: CambiarPasswordDto): Promise<boolean> {
    const usuario = await this.findOne(id);
    
    // Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(
      cambiarPasswordDto.password_actual,
      usuario.password,
    );
    
    if (!isPasswordValid) {
      throw new BadRequestException('Contraseña actual incorrecta');
    }
    
    // Verificar que la nueva contraseña sea diferente
    if (cambiarPasswordDto.password_actual === cambiarPasswordDto.password_nueva) {
      throw new BadRequestException('La nueva contraseña debe ser diferente a la actual');
    }
    
    // Encriptar nueva contraseña
    const hashedPassword = await bcrypt.hash(cambiarPasswordDto.password_nueva, 10);
    
    // Actualizar contraseña
    await this.usuariosRepository.update(
      { id_usuario: id },
      { password: hashedPassword }
    );
    
    return true;
  }

  /**
   * Desactiva un usuario
   */
  async deactivate(id: number): Promise<boolean> {
    const usuario = await this.findOne(id);
    
    usuario.activo = false;
    
    await this.usuariosRepository.save(usuario);
    
    return true;
  }

  /**
   * Obtiene las notificaciones de un usuario
   */
  async getNotificaciones(idUsuario: number, leidas: boolean | null = null): Promise<Notificacion[]> {
    const where: FindOptionsWhere<Notificacion> = { id_usuario: idUsuario };
    
    if (leidas !== null) {
      where.leida = leidas;
    }
    
    return this.notificacionesRepository.find({
      where,
      order: { fecha_creacion: 'DESC' },
    });
  }

  /**
   * Crea una nueva notificación
   */
  async createNotificacion(createNotificacionDto: CrearNotificacionDto | CrearNotificacionDto[]): Promise<Notificacion | Notificacion[]> {
    const notificacion = Array.isArray(createNotificacionDto)
      ? this.notificacionesRepository.create(createNotificacionDto)
      : this.notificacionesRepository.create(createNotificacionDto);
    
    if (Array.isArray(notificacion)) {
      return this.notificacionesRepository.save(notificacion);
    }
    return this.notificacionesRepository.save(notificacion as Notificacion);
  }

  /**
   * Marca una notificación como leída
   */
  async markNotificacionAsRead(id: number, idUsuario: number): Promise<boolean> {
    const notificacion = await this.notificacionesRepository.findOne({
      where: { id_notificacion: id, id_usuario: idUsuario },
    });
    
    if (!notificacion) {
      throw new NotFoundException(`Notificación no encontrada o no pertenece al usuario`);
    }
    
    notificacion.leida = true;
    notificacion.fecha_lectura = new Date();
    
    await this.notificacionesRepository.save(notificacion);
    
    return true;
  }

  /**
   * Marca todas las notificaciones de un usuario como leídas
   */
  async markAllNotificacionesAsRead(idUsuario: number): Promise<boolean> {
    await this.notificacionesRepository.update(
      { id_usuario: idUsuario, leida: false },
      { leida: true, fecha_lectura: new Date() }
    );
    
    return true;
  }

  /**
   * Obtiene el historial de donaciones de un usuario
   */
  async getDonaciones(idUsuario: number): Promise<Donacion[]> {
    return this.donacionesRepository.find({
      where: { id_usuario: idUsuario },
      relations: ['campana', 'comprobantes', 'facturas'],
      order: { fecha_donacion: 'DESC' },
    });
  }

  /**
   * Obtiene las suscripciones de un usuario
   */
  async getSuscripciones(idUsuario: number): Promise<Suscripcion[]> {
    return this.suscripcionesRepository.find({
      where: { id_usuario: idUsuario },
      relations: ['campana', 'metodo_pago'],
      order: { fecha_creacion: 'DESC' },
    });
  }

  /**
   * Obtiene las recompensas de un usuario
   */
  async getRecompensas(idUsuario: number): Promise<UsuarioRecompensa[]> {
    return this.usuariosRecompensasRepository.find({
      where: { id_usuario: idUsuario },
      relations: ['recompensa'],
      order: { fecha_obtencion: 'DESC' },
    });
  }

  /**
   * Obtiene estadísticas del usuario
   */
  async getEstadisticas(idUsuario: number): Promise<any> {
    // Total donado
    const totalDonado = await this.donacionesRepository
      .createQueryBuilder('donacion')
      .select('SUM(donacion.monto)', 'total')
      .addSelect('COUNT(donacion.id_donacion)', 'count')
      .where('donacion.id_usuario = :idUsuario', { idUsuario })
      .andWhere('donacion.estado = :estado', { estado: 'Completada' })
      .getRawOne();
    
    // Total donaciones por campaña
    const donacionesPorCampana = await this.donacionesRepository
      .createQueryBuilder('donacion')
      .select('campana.nombre', 'campana')
      .addSelect('SUM(donacion.monto)', 'total')
      .addSelect('COUNT(donacion.id_donacion)', 'count')
      .leftJoin('donacion.campana', 'campana')
      .where('donacion.id_usuario = :idUsuario', { idUsuario })
      .andWhere('donacion.estado = :estado', { estado: 'Completada' })
      .groupBy('donacion.id_campana')
      .addGroupBy('campana.nombre')
      .orderBy('total', 'DESC')
      .getRawMany();
    
    // Suscripciones activas
    const suscripcionesActivas = await this.suscripcionesRepository
      .createQueryBuilder('suscripcion')
      .select('COUNT(suscripcion.id_suscripcion)', 'count')
      .addSelect('SUM(suscripcion.monto)', 'total')
      .where('suscripcion.id_usuario = :idUsuario', { idUsuario })
      .andWhere('suscripcion.estado = :estado', { estado: 'Activa' })
      .getRawOne();
    
    // Recompensas
    const recompensas = await this.usuariosRecompensasRepository
      .createQueryBuilder('ur')
      .select('r.tipo', 'tipo')
      .addSelect('COUNT(ur.id_recompensa)', 'count')
      .leftJoin('ur.recompensa', 'r')
      .where('ur.id_usuario = :idUsuario', { idUsuario })
      .groupBy('r.tipo')
      .orderBy('count', 'DESC')
      .getRawMany();
    
    return {
      total_donado: totalDonado.total || 0,
      cantidad_donaciones: totalDonado.count || 0,
      puntos_acumulados: (await this.findOne(idUsuario)).puntos_acumulados,
      donaciones_por_campana: donacionesPorCampana,
      suscripciones_activas: suscripcionesActivas.count || 0,
      monto_mensual_recurrente: suscripcionesActivas.total || 0,
      recompensas_por_tipo: recompensas,
    };
  }

  /**
   * Envía un resumen mensual al usuario
   */
  async enviarResumenMensual(idUsuario: number): Promise<boolean> {
    const usuario = await this.findOne(idUsuario);
    const donaciones = await this.donacionesRepository.find({
      where: { 
        id_usuario: idUsuario,
        fecha_donacion: Between(
          new Date(new Date().setDate(1)),
          new Date()
        ),
        estado: 'Completada',
      },
      relations: ['campana'],
      order: { fecha_donacion: 'DESC' },
    });
    
    if (donaciones.length === 0) {
      return false; // No hay donaciones este mes
    }
    
    const totalDonado = donaciones.reduce((sum, donacion) => sum + Number(donacion.monto), 0);
    
    // Calcular impacto total (simplificado)
    const impactoTotal = `Ayudaste a financiar ${donaciones.length} proyectos este mes`;
    
    return this.mailService.enviarResumenMensual(
      usuario.correo,
      usuario.nombres,
      donaciones,
      totalDonado,
      impactoTotal
    );
  }

  /**
   * Busca usuarios por texto (nombre, apellido, correo, etc.)
   */
  async buscar(
    texto: string,
    options: IPaginationOptions,
  ): Promise<Pagination<Usuario>> {
    const queryBuilder = this.usuariosRepository
      .createQueryBuilder('usuario')
      .where(
        'usuario.nombres LIKE :texto OR usuario.apellidos LIKE :texto OR usuario.correo LIKE :texto OR usuario.cedula LIKE :texto',
        { texto: `%${texto}%` }
      )
      .orderBy('usuario.fecha_registro', 'DESC');
    
    return paginate<Usuario>(queryBuilder, options);
  }
}

// Importación necesaria para el método Between
import { Between } from 'typeorm';