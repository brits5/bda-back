import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Recompensa } from '../entities/recompensa.entity';
import { UsuarioRecompensa } from '../entities/usuario-recompensa.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { MailService } from '../../../common/services/mail.service';
import { CrearRecompensaDto, ActualizarRecompensaDto, AsignarRecompensaDto } from '../dto/recompensas.dto';
import { paginate, Pagination, IPaginationOptions } from 'nestjs-typeorm-paginate';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class RecompensasService {
  private readonly logger = new Logger(RecompensasService.name);

  constructor(
    @InjectRepository(Recompensa)
    private recompensasRepository: Repository<Recompensa>,
    @InjectRepository(UsuarioRecompensa)
    private usuariosRecompensasRepository: Repository<UsuarioRecompensa>,
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
    private mailService: MailService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Obtiene una lista paginada de recompensas
   */
  async findAll(
    options: IPaginationOptions,
    where: FindOptionsWhere<Recompensa> = {},
  ): Promise<Pagination<Recompensa>> {
    return paginate<Recompensa>(this.recompensasRepository, options, {
      where,
      order: { puntos_requeridos: 'ASC' },
    });
  }

  /**
   * Encuentra una recompensa por su ID
   */
  async findOne(id: number): Promise<Recompensa> {
    const recompensa = await this.recompensasRepository.findOne({
      where: { id_recompensa: id },
    });

    if (!recompensa) {
      throw new NotFoundException(`Recompensa con ID ${id} no encontrada`);
    }

    return recompensa;
  }

  /**
   * Encuentra recompensas disponibles para un usuario
   */
  async findAvailableForUser(idUsuario: number): Promise<Recompensa[]> {
    // Obtener puntos del usuario
    const usuario = await this.usuariosRepository.findOne({
      where: { id_usuario: idUsuario },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${idUsuario} no encontrado`);
    }

    // Obtener recompensas ya obtenidas por el usuario
    const recompensasObtenidas = await this.usuariosRecompensasRepository.find({
      where: { id_usuario: idUsuario },
      select: ['id_recompensa'],
    });

    const idsRecompensasObtenidas = recompensasObtenidas.map(
      (ur) => ur.id_recompensa,
    );

    // Obtener recompensas disponibles para el usuario
    return this.recompensasRepository.find({
      where: {
        activa: true,
        puntos_requeridos: LessThanOrEqual(usuario.puntos_acumulados),
        id_recompensa: Not(In(idsRecompensasObtenidas)),
      },
      order: { puntos_requeridos: 'ASC' },
    });
  }

  /**
   * Crea una nueva recompensa
   */
  async create(createRecompensaDto: CrearRecompensaDto): Promise<Recompensa> {
    const recompensa = this.recompensasRepository.create(createRecompensaDto);
    return this.recompensasRepository.save(recompensa);
  }

  /**
   * Actualiza una recompensa existente
   */
  async update(
    id: number,
    updateRecompensaDto: ActualizarRecompensaDto,
  ): Promise<Recompensa> {
    const recompensa = await this.findOne(id);

    // Actualizar campos
    Object.assign(recompensa, updateRecompensaDto);

    return this.recompensasRepository.save(recompensa);
  }

  /**
   * Elimina una recompensa
   */
  async remove(id: number): Promise<boolean> {
    const recompensa = await this.findOne(id);

    // Verificar si la recompensa ya fue asignada a usuarios
    const asignaciones = await this.usuariosRecompensasRepository.count({
      where: { id_recompensa: id },
    });

    if (asignaciones > 0) {
      throw new BadRequestException(
        `No se puede eliminar la recompensa porque ya ha sido asignada a ${asignaciones} usuarios`,
      );
    }

    await this.recompensasRepository.remove(recompensa);
    return true;
  }

  /**
   * Asigna una recompensa a un usuario
   */
  async asignarRecompensa(
    asignarRecompensaDto: AsignarRecompensaDto,
  ): Promise<UsuarioRecompensa> {
    const { id_usuario, id_recompensa } = asignarRecompensaDto;

    // Verificar si el usuario existe
    const usuario = await this.usuariosRepository.findOne({
      where: { id_usuario },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id_usuario} no encontrado`);
    }

    // Verificar si la recompensa existe y está activa
    const recompensa = await this.recompensasRepository.findOne({
      where: { id_recompensa, activa: true },
    });

    if (!recompensa) {
      throw new NotFoundException(
        `Recompensa con ID ${id_recompensa} no encontrada o no está activa`,
      );
    }

    // Verificar si el usuario ya tiene esta recompensa
    const recompensaExistente = await this.usuariosRecompensasRepository.findOne({
      where: { id_usuario, id_recompensa },
    });

    if (recompensaExistente) {
      throw new BadRequestException(
        `El usuario ya tiene asignada esta recompensa`,
      );
    }

    // Verificar si el usuario tiene suficientes puntos
    if (usuario.puntos_acumulados < recompensa.puntos_requeridos) {
      throw new BadRequestException(
        `El usuario no tiene suficientes puntos para esta recompensa. Requiere ${recompensa.puntos_requeridos} y tiene ${usuario.puntos_acumulados}`,
      );
    }

    // Verificar disponibilidad de la recompensa
    if (
      recompensa.cantidad_disponible !== null &&
      recompensa.cantidad_disponible <= 0
    ) {
      throw new BadRequestException(
        `No hay más unidades disponibles de esta recompensa`,
      );
    }

    // Generar código único si no se proporcionó
    const codigo_unico =
      asignarRecompensaDto.codigo_unico ||
      `${recompensa.tipo.substring(0, 4).toUpperCase()}-${new Date().getFullYear()}-${String(
        Math.floor(Math.random() * 100000),
      ).padStart(5, '0')}`;

    // Crear la asignación
    const usuarioRecompensa = this.usuariosRecompensasRepository.create({
      id_usuario,
      id_recompensa,
      codigo_unico,
      puntos_usados: recompensa.puntos_requeridos,
      estado: 'Pendiente',
      notas: asignarRecompensaDto.notas ?? undefined,
    });

    const recompensaAsignada = await this.usuariosRecompensasRepository.save(
      usuarioRecompensa,
    );

    // Actualizar cantidad disponible si es limitada
    if (recompensa.cantidad_disponible !== null) {
      await this.recompensasRepository.update(
        { id_recompensa },
        { cantidad_disponible: () => 'cantidad_disponible - 1' },
      );
    }

    // Emitir evento para procesos asíncronos
    this.eventEmitter.emit('recompensa.asignada', {
      usuarioRecompensa: recompensaAsignada,
      usuario,
      recompensa,
    });

    // Enviar notificación al usuario
    await this.enviarNotificacionRecompensa(usuario, recompensa);

    return recompensaAsignada;
  }

  /**
   * Actualiza el estado de una recompensa asignada
   */
  async actualizarEstado(
    idUsuario: number,
    idRecompensa: number,
    estado: 'Pendiente' | 'Entregada' | 'Canjeada' | 'Expirada',
  ): Promise<UsuarioRecompensa> {
    const usuarioRecompensa = await this.usuariosRecompensasRepository.findOne({
      where: { id_usuario: idUsuario, id_recompensa: idRecompensa },
      relations: ['usuario', 'recompensa'],
    });

    if (!usuarioRecompensa) {
      throw new NotFoundException(
        `Recompensa no encontrada para el usuario especificado`,
      );
    }

    usuarioRecompensa.estado = estado;

    // Si se marca como entregada, guardar la fecha
    if (estado === 'Entregada' || estado === 'Canjeada') {
      usuarioRecompensa.fecha_entrega = new Date();
    }

    const resultado = await this.usuariosRecompensasRepository.save(
      usuarioRecompensa,
    );

    // Emitir evento para procesos asíncronos
    this.eventEmitter.emit('recompensa.estadoActualizado', {
      usuarioRecompensa: resultado,
    });

    return resultado;
  }

  /**
   * Verifica automáticamente si el usuario ha alcanzado nuevas recompensas
   */
  /*
  async verificarRecompensasAutomaticas(
    idUsuario: number,
  ): Promise<UsuarioRecompensa[]> {
    const usuario = await this.usuariosRepository.findOne({
      where: { id_usuario },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${idUsuario} no encontrado`);
    }

    // Obtener recompensas ya obtenidas por el usuario
    const recompensasObtenidas = await this.usuariosRecompensasRepository.find({
      where: { id_usuario },
      select: ['id_recompensa'],
    });

    const idsRecompensasObtenidas = recompensasObtenidas.map(
      (ur) => ur.id_recompensa,
    );

    // Obtener recompensas que puede obtener automáticamente
    const recompensasDisponibles = await this.recompensasRepository.find({
      where: {
        activa: true,
        puntos_requeridos: LessThanOrEqual(usuario.puntos_acumulados),
        id_recompensa: Not(In(idsRecompensasObtenidas)),
      },
    });

    const nuevasRecompensas: UsuarioRecompensa[] = [];

    // Asignar nuevas recompensas automáticamente
    for (const recompensa of recompensasDisponibles) {
      try {
        const asignada = await this.asignarRecompensa({
          id_usuario: idUsuario,
          id_recompensa: recompensa.id_recompensa,
        });
        nuevasRecompensas.push(asignada);
      } catch (error) {
        this.logger.warn(
          `Error asignando recompensa ${recompensa.id_recompensa} al usuario ${idUsuario}: ${error.message}`,
        );
        // Continuar con la siguiente recompensa
      }
    }

    return nuevasRecompensas;
  }

  */
  /**
   * Envía notificación al usuario sobre la recompensa
   */
  private async enviarNotificacionRecompensa(
    usuario: Usuario,
    recompensa: Recompensa,
  ): Promise<void> {
    // Implementación simplificada - enviar email al usuario
    const subject = `¡Has desbloqueado una nueva recompensa!`;
    const html = `
      <h1>¡Felicidades, ${usuario.nombres}!</h1>
      <p>Has desbloqueado una nueva recompensa:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h2>${recompensa.nombre}</h2>
        <p>${recompensa.descripcion || ''}</p>
      </div>
      <p>Puedes ver todos tus logros en tu perfil.</p>
      <p>¡Gracias por tu apoyo continuo!</p>
    `;

    try {
      await this.mailService.enviarEmail({
        to: usuario.correo,
        subject,
        html,
      });
    } catch (error) {
      this.logger.error(
        `Error enviando notificación de recompensa: ${error.message}`,
      );
    }
  }
}

// Importaciones necesarias para los métodos
import { LessThanOrEqual, Not, In } from 'typeorm';