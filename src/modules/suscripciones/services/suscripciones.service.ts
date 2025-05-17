import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, FindOptionsWhere } from 'typeorm';
import { Suscripcion } from '../entities/suscripcion.entity';
import { Donacion } from '../../donaciones/entities/donacion.entity';
import { MetodoPago } from '../../pagos/entities/metodo-pago.entity';
import { CrearSuscripcionDto, ActualizarSuscripcionDto } from '../dto/suscripcion.dto';
import { paginate, Pagination, IPaginationOptions } from 'nestjs-typeorm-paginate';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SuscripcionesService {
  private readonly logger = new Logger(SuscripcionesService.name);

  constructor(
    @InjectRepository(Suscripcion)
    private suscripcionesRepository: Repository<Suscripcion>,
    @InjectRepository(Donacion)
    private donacionesRepository: Repository<Donacion>,
    @InjectRepository(MetodoPago)
    private metodosPagoRepository: Repository<MetodoPago>,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Obtiene una lista paginada de suscripciones
   */
  async findAll(
    options: IPaginationOptions,
    where: FindOptionsWhere<Suscripcion> = {},
  ): Promise<Pagination<Suscripcion>> {
    return paginate<Suscripcion>(this.suscripcionesRepository, options, {
      where,
      relations: ['usuario', 'campana', 'metodo_pago'],
      order: { fecha_inicio: 'DESC' },
    });
  }

  /**
   * Encuentra una suscripción por su ID
   */
  async findOne(id: number): Promise<Suscripcion> {
    const suscripcion = await this.suscripcionesRepository.findOne({
      where: { id_suscripcion: id },
      relations: ['usuario', 'campana', 'metodo_pago', 'donaciones'],
    });

    if (!suscripcion) {
      throw new NotFoundException(`Suscripción con ID ${id} no encontrada`);
    }

    return suscripcion;
  }

  /**
   * Encuentra las suscripciones de un usuario
   */
  async findByUsuario(
    idUsuario: number,
    options: IPaginationOptions,
  ): Promise<Pagination<Suscripcion>> {
    return paginate<Suscripcion>(
      this.suscripcionesRepository,
      options,
      {
        where: { id_usuario: idUsuario },
        relations: ['campana', 'metodo_pago'],
        order: { fecha_inicio: 'DESC' },
      },
    );
  }

  /**
   * Crea una nueva suscripción
   */
  async create(createSuscripcionDto: CrearSuscripcionDto, idUsuario: number): Promise<Suscripcion> {
    // Verificar que el método de pago exista y pertenezca al usuario
    const metodoPago = await this.metodosPagoRepository.findOne({
      where: { 
        id_metodo_pago: createSuscripcionDto.id_metodo_pago,
        id_usuario: idUsuario,
        activo: true
      }
    });

    if (!metodoPago) {
      throw new BadRequestException('Método de pago no válido o no pertenece al usuario');
    }

    // Determinar fecha de inicio (hoy si no se provee)
    const fechaInicio = createSuscripcionDto.fecha_inicio || new Date();
    
    // Determinar próxima fecha de donación según frecuencia
    const proximaDonacion = new Date(fechaInicio);
    switch (createSuscripcionDto.frecuencia) {
      case 'Mensual':
        proximaDonacion.setMonth(proximaDonacion.getMonth() + 1);
        break;
      case 'Trimestral':
        proximaDonacion.setMonth(proximaDonacion.getMonth() + 3);
        break;
      case 'Anual':
        proximaDonacion.setFullYear(proximaDonacion.getFullYear() + 1);
        break;
    }

    // Crear la suscripción
    const suscripcion = this.suscripcionesRepository.create({
      ...createSuscripcionDto,
      id_usuario: idUsuario,
      fecha_inicio: fechaInicio,
      proxima_donacion: proximaDonacion,
      estado: 'Activa',
      total_donado: 0,
      total_donaciones: 0,
    });

    const suscripcionGuardada = await this.suscripcionesRepository.save(suscripcion);
    
    // Crear la primera donación de la suscripción
    await this.crearDonacionDesdeSubscripcion(suscripcionGuardada);
    
    // Emitir evento
    this.eventEmitter.emit('suscripcion.created', suscripcionGuardada);
    
    return suscripcionGuardada;
  }

  /**
   * Actualiza una suscripción existente
   */
  async update(id: number, updateSuscripcionDto: ActualizarSuscripcionDto, idUsuario: number): Promise<Suscripcion> {
    const suscripcion = await this.findOne(id);
    
    // Verificar que la suscripción pertenezca al usuario
    if (suscripcion.id_usuario !== idUsuario) {
      throw new BadRequestException('La suscripción no pertenece al usuario');
    }
    
    // Verificar método de pago si se actualiza
    if (updateSuscripcionDto.id_metodo_pago) {
      const metodoPago = await this.metodosPagoRepository.findOne({
        where: { 
          id_metodo_pago: updateSuscripcionDto.id_metodo_pago,
          id_usuario: idUsuario,
          activo: true
        }
      });

      if (!metodoPago) {
        throw new BadRequestException('Método de pago no válido o no pertenece al usuario');
      }
    }
    
    // Actualizar campos
    Object.assign(suscripcion, updateSuscripcionDto);
    
    // Si cambia la frecuencia, recalcular próxima donación
    if (updateSuscripcionDto.frecuencia && updateSuscripcionDto.frecuencia !== suscripcion.frecuencia) {
      const hoy = new Date();
      switch (updateSuscripcionDto.frecuencia) {
        case 'Mensual':
          suscripcion.proxima_donacion = new Date(hoy.setMonth(hoy.getMonth() + 1));
          break;
        case 'Trimestral':
          suscripcion.proxima_donacion = new Date(hoy.setMonth(hoy.getMonth() + 3));
          break;
        case 'Anual':
          suscripcion.proxima_donacion = new Date(hoy.setFullYear(hoy.getFullYear() + 1));
          break;
      }
    }
    
    const suscripcionActualizada = await this.suscripcionesRepository.save(suscripcion);
    
    // Emitir evento
    this.eventEmitter.emit('suscripcion.updated', suscripcionActualizada);
    
    return suscripcionActualizada;
  }

  /**
   * Cancela una suscripción
   */
  async cancelar(id: number, idUsuario: number, motivo?: string): Promise<Suscripcion> {
    const suscripcion = await this.findOne(id);
    
    // Verificar que la suscripción pertenezca al usuario
    if (suscripcion.id_usuario !== idUsuario) {
      throw new BadRequestException('La suscripción no pertenece al usuario');
    }
    
    // Actualizar estado
    suscripcion.estado = 'Cancelada';
    
    const suscripcionCancelada = await this.suscripcionesRepository.save(suscripcion);
    
    // Emitir evento
    this.eventEmitter.emit('suscripcion.cancelada', {
      suscripcion: suscripcionCancelada,
      motivo
    });
    
    return suscripcionCancelada;
  }

  /**
   * Crea una donación desde una suscripción
   */
  private async crearDonacionDesdeSubscripcion(suscripcion: Suscripcion): Promise<Donacion> {
    const metodoPago = await this.metodosPagoRepository.findOne({
      where: { id_metodo_pago: suscripcion.id_metodo_pago }
    });

    if (!metodoPago) {
      throw new BadRequestException('Método de pago no encontrado');
    }

    // Crear la donación
    const donacion = this.donacionesRepository.create({
      id_usuario: suscripcion.id_usuario,
      id_campana: suscripcion.id_campana,
      id_suscripcion: suscripcion.id_suscripcion,
      monto: suscripcion.monto,
      metodo_pago: metodoPago.tipo,
      referencia_pago: `suscripcion_${suscripcion.id_suscripcion}_${Date.now()}`,
      estado: 'Completada', // Asumimos que es exitosa para simplicidad
      es_anonima: false,
      puntos_otorgados: Math.floor(suscripcion.monto), // 1 punto por dólar
    });

    const donacionGuardada = await this.donacionesRepository.save(donacion);

    // Actualizar estadísticas de la suscripción
    await this.suscripcionesRepository.update(
      { id_suscripcion: suscripcion.id_suscripcion },
      { 
        total_donado: () => `total_donado + ${suscripcion.monto}`,
        total_donaciones: () => `total_donaciones + 1`
      }
    );

    // Emitir evento
    this.eventEmitter.emit('donacion.created', donacionGuardada);

    return donacionGuardada;
  }

  /**
   * Tarea programada para procesar pagos recurrentes
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async procesarPagosRecurrentes() {
    this.logger.log('Iniciando procesamiento de pagos recurrentes...');

    try {
      // Obtener suscripciones activas con pagos pendientes (fecha próxima <= hoy)
      const suscripcionesAProcesar = await this.suscripcionesRepository.find({
        where: {
          estado: 'Activa',
          proxima_donacion: LessThanOrEqual(new Date())
        },
        relations: ['metodo_pago']
      });

      this.logger.log(`Procesando ${suscripcionesAProcesar.length} suscripciones`);

      for (const suscripcion of suscripcionesAProcesar) {
        try {
          // Verificar que el método de pago esté activo
          if (!suscripcion.metodo_pago || !suscripcion.metodo_pago.activo) {
            this.logger.warn(`Método de pago inactivo para suscripción ${suscripcion.id_suscripcion}`);
            continue;
          }

          // Crear la donación
          await this.crearDonacionDesdeSubscripcion(suscripcion);

          // Actualizar próxima fecha de donación
          const proximaFecha = new Date();
          switch (suscripcion.frecuencia) {
            case 'Mensual':
              proximaFecha.setMonth(proximaFecha.getMonth() + 1);
              break;
            case 'Trimestral':
              proximaFecha.setMonth(proximaFecha.getMonth() + 3);
              break;
            case 'Anual':
              proximaFecha.setFullYear(proximaFecha.getFullYear() + 1);
              break;
          }

          await this.suscripcionesRepository.update(
            { id_suscripcion: suscripcion.id_suscripcion },
            { proxima_donacion: proximaFecha }
          );

          this.logger.log(`Suscripción ${suscripcion.id_suscripcion} procesada correctamente`);
        } catch (error) {
          this.logger.error(`Error procesando suscripción ${suscripcion.id_suscripcion}:`, error);
          // Continuamos con la siguiente suscripción
        }
      }

      this.logger.log('Procesamiento de pagos recurrentes completado');
    } catch (error) {
      this.logger.error('Error general procesando pagos recurrentes:', error);
    }
  }

  /**
   * Obtiene estadísticas de suscripciones
   */
  async obtenerEstadisticas() {
    const totalSuscripciones = await this.suscripcionesRepository.count();
    
    const suscripcionesActivas = await this.suscripcionesRepository.count({
      where: { estado: 'Activa' }
    });
    
    const ingresoMensualEstimado = await this.suscripcionesRepository
      .createQueryBuilder('suscripcion')
      .select('SUM(CASE WHEN suscripcion.frecuencia = :mensual THEN suscripcion.monto WHEN suscripcion.frecuencia = :trimestral THEN suscripcion.monto/3 WHEN suscripcion.frecuencia = :anual THEN suscripcion.monto/12 ELSE 0 END)', 'total')
      .where('suscripcion.estado = :estado', { estado: 'Activa' })
      .setParameter('mensual', 'Mensual')
      .setParameter('trimestral', 'Trimestral')
      .setParameter('anual', 'Anual')
      .getRawOne();
    
    const suscripcionesPorFrecuencia = await this.suscripcionesRepository
      .createQueryBuilder('suscripcion')
      .select('suscripcion.frecuencia', 'frecuencia')
      .addSelect('COUNT(*)', 'total')
      .where('suscripcion.estado = :estado', { estado: 'Activa' })
      .groupBy('suscripcion.frecuencia')
      .getRawMany();
    
    return {
      totalSuscripciones,
      suscripcionesActivas,
      ingresoMensualEstimado: ingresoMensualEstimado.total || 0,
      suscripcionesPorFrecuencia,
    };
  }
}