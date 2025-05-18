import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial, Between, MoreThan, LessThan, FindOptionsWhere } from 'typeorm';
import { Donacion } from '../entities/donacion.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Campana } from '../../campanas/entities/campana.entity';
import { CrearDonacionDto } from '../dto/donacion.dto';
import { ComprobantesService } from '../../comprobantes/services/comprobantes.service';

import { FacturasService } from '../../facturas/services/facturas.services';
import { ConfiguracionesService } from '../../configuraciones/services/configuraciones.services';
import { paginate, Pagination, IPaginationOptions } from 'nestjs-typeorm-paginate';
import { EventEmitter2 } from '@nestjs/event-emitter';
;

@Injectable()
export class DonacionesService {
  private readonly logger = new Logger(DonacionesService.name);

  constructor(
    @InjectRepository(Donacion)
    private donacionesRepository: Repository<Donacion>,
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
    @InjectRepository(Campana)
    private campanasRepository: Repository<Campana>,
    private comprobantesService: ComprobantesService,
    private facturasService: FacturasService,
    private configuracionesService: ConfiguracionesService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Obtiene una lista paginada de donaciones
   */
  async findAll(
    options: IPaginationOptions,
    where: FindOptionsWhere<Donacion> = {},
  ): Promise<Pagination<Donacion>> {
    return paginate<Donacion>(this.donacionesRepository, options, {
      where,
      relations: ['usuario', 'campana'],
      order: { fecha_donacion: 'DESC' },
    });
  }

  /**
   * Encuentra una donación por su ID
   */
  async findOne(id: number): Promise<Donacion> {
    const donacion = await this.donacionesRepository.findOne({
      where: { id_donacion: id },
      relations: ['usuario', 'campana', 'comprobantes', 'facturas'],
    });

    if (!donacion) {
      throw new NotFoundException(`Donación con ID ${id} no encontrada`);
    }

    return donacion;
  }

  /**
   * Crea una nueva donación
   */
  async create(createDonacionDto: CrearDonacionDto): Promise<Donacion> {
  const { id_usuario, id_campana, ...restDonacionData } = createDonacionDto;

  // Crear la entidad donación usando DeepPartial<Donacion>
  const donacionData: DeepPartial<Donacion> = {
    ...restDonacionData,
    id_usuario: id_usuario ?? undefined,
    id_campana: id_campana ?? undefined,
    estado: 'Pendiente',
  };
  
    const donacion = this.donacionesRepository.create(donacionData);

    // Calcular puntos a otorgar según configuración
    const puntosPorDolar = await this.configuracionesService.obtenerValorNumerico('puntos_por_dolar', 1);
    donacion.puntos_otorgados = Math.floor(donacion.monto * puntosPorDolar);

    // Guardar la donación - especificar que es una sola entidad, no un array
    const donacionGuardada = await this.donacionesRepository.save(donacion as Donacion);

    // Emitir evento para procesos asíncronos
    this.eventEmitter.emit('donacion.created', donacionGuardada);

    return donacionGuardada;
  }

  /**
   * Actualiza el estado de una donación
   */
  async actualizarEstado(id: number, estado: string, referenciaExterna?: string): Promise<Donacion> {
    const donacion = await this.findOne(id);
    
    donacion.estado = estado;
    
    if (referenciaExterna) {
      donacion.referencia_pago = referenciaExterna;
    }
    
    const donacionActualizada = await this.donacionesRepository.save(donacion);
    
    // Para donaciones completadas, generar comprobante y actualizar campaña
    if (estado === 'Completada') {
      await this.procesarDonacionCompletada(donacionActualizada);
    }
    
    // Emitir evento
    this.eventEmitter.emit('donacion.estadoActualizado', donacionActualizada);
    
    return donacionActualizada;
  }

  /**
   * Procesa acciones necesarias cuando una donación se completa
   */
  private async procesarDonacionCompletada(donacion: Donacion): Promise<void> {
    try {
      // Generar comprobante
      await this.comprobantesService.generarComprobante(donacion.id_donacion);
      
      // Si requiere factura y tiene datos fiscales, generarla
      if (donacion.requiere_factura && donacion.id_usuario) {
        await this.facturasService.generarFacturaAutomatica(donacion.id_donacion);
      }
      
      // Actualizar monto recaudado de la campaña
      if (donacion.id_campana) {
        await this.actualizarMontoCampana(donacion.id_campana);
      }
      
      // Actualizar puntos del usuario
      if (donacion.id_usuario) {
        await this.actualizarPuntosUsuario(donacion.id_usuario, donacion.puntos_otorgados);
      }
    } catch (error) {
      this.logger.error(`Error procesando donación completada ID ${donacion.id_donacion}:`, error);
      // No propagamos el error para no interrumpir el flujo principal
    }
  }

  /**
   * Actualiza el monto recaudado de una campaña
   */
  private async actualizarMontoCampana(idCampana: number): Promise<void> {
    const totalDonado = await this.donacionesRepository
      .createQueryBuilder('donacion')
      .select('SUM(donacion.monto)', 'total')
      .where('donacion.id_campana = :idCampana', { idCampana })
      .andWhere('donacion.estado = :estado', { estado: 'Completada' })
      .getRawOne();
    
    const contadorDonaciones = await this.donacionesRepository
      .createQueryBuilder('donacion')
      .where('donacion.id_campana = :idCampana', { idCampana })
      .andWhere('donacion.estado = :estado', { estado: 'Completada' })
      .getCount();
    
    await this.campanasRepository.update(
      { id_campana: idCampana },
      { 
        monto_recaudado: totalDonado.total || 0,
        contador_donaciones: contadorDonaciones
      }
    );
  }

  /**
   * Actualiza los puntos de un usuario
   */
  private async actualizarPuntosUsuario(idUsuario: number, puntosOtorgados: number): Promise<void> {
    await this.usuariosRepository
      .createQueryBuilder()
      .update(Usuario)
      .set({
        puntos_acumulados: () => `puntos_acumulados + ${puntosOtorgados}`,
        nivel_donante: () => `
          CASE 
            WHEN puntos_acumulados + ${puntosOtorgados} >= 1000 THEN 'Platino'
            WHEN puntos_acumulados + ${puntosOtorgados} >= 500 THEN 'Oro'
            WHEN puntos_acumulados + ${puntosOtorgados} >= 200 THEN 'Plata'
            ELSE 'Bronce'
          END
        `
      })
      .where('id_usuario = :id', { id: idUsuario })
      .execute();
  }

  /**
   * Obtiene estadísticas de donaciones en un periodo
   */
  async obtenerEstadisticas(fechaInicio: Date, fechaFin: Date) {
    const totalDonaciones = await this.donacionesRepository
      .createQueryBuilder('donacion')
      .select('SUM(donacion.monto)', 'total')
      .addSelect('COUNT(DISTINCT donacion.id_donacion)', 'count')
      .addSelect('COUNT(DISTINCT donacion.id_usuario)', 'uniqueDonors')
      .where('donacion.fecha_donacion BETWEEN :fechaInicio AND :fechaFin', { fechaInicio, fechaFin })
      .andWhere('donacion.estado = :estado', { estado: 'Completada' })
      .getRawOne();

    const donantesPorCampana = await this.donacionesRepository
      .createQueryBuilder('donacion')
      .select('campana.nombre', 'campana')
      .addSelect('SUM(donacion.monto)', 'total')
      .addSelect('COUNT(DISTINCT donacion.id_donacion)', 'count')
      .innerJoin('donacion.campana', 'campana')
      .where('donacion.fecha_donacion BETWEEN :fechaInicio AND :fechaFin', { fechaInicio, fechaFin })
      .andWhere('donacion.estado = :estado', { estado: 'Completada' })
      .groupBy('campana.id_campana')
      .orderBy('total', 'DESC')
      .getRawMany();

    return {
      totalDonaciones: totalDonaciones.total || 0,
      cantidadDonaciones: parseInt(totalDonaciones.count) || 0,
      donantesUnicos: parseInt(totalDonaciones.uniqueDonors) || 0,
      donantesPorCampana,
    };
  }
}