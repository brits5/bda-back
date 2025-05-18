import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan } from 'typeorm';
import { EstadisticaMensual } from '../entities/estadistica-mensual';
import { Donacion } from '../../donaciones/entities/donacion.entity';
import { Suscripcion } from '../../suscripciones/entities/suscripcion.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Campana } from '../../campanas/entities/campana.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as moment from 'moment';

@Injectable()
export class EstadisticasService {
  private readonly logger = new Logger(EstadisticasService.name);

  constructor(
    @InjectRepository(EstadisticaMensual)
    private estadisticasRepository: Repository<EstadisticaMensual>,
    @InjectRepository(Donacion)
    private donacionesRepository: Repository<Donacion>,
    @InjectRepository(Suscripcion)
    private suscripcionesRepository: Repository<Suscripcion>,
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
    @InjectRepository(Campana)
    private campanasRepository: Repository<Campana>,
  ) {}

  /**
   * Obtiene las estadísticas mensuales de un período específico
   */
  async obtenerEstadisticasMensuales(
    fechaInicio: Date = moment().subtract(12, 'months').toDate(),
    fechaFin: Date = moment().toDate(),
  ): Promise<EstadisticaMensual[]> {
    const añoInicio = fechaInicio.getFullYear();
    const mesInicio = fechaInicio.getMonth() + 1;
    const añoFin = fechaFin.getFullYear();
    const mesFin = fechaFin.getMonth() + 1;

    return this.estadisticasRepository.find({
      where: [
        { ano: añoInicio, mes: MoreThan(mesInicio - 1) },
        { ano: Between(añoInicio + 1, añoFin - 1) },
        { ano: añoFin, mes: LessThan(mesFin + 1) },
      ],
      order: {
        ano: 'ASC',
        mes: 'ASC',
      },
    });
  }

  /**
   * Obtiene las estadísticas del mes actual en tiempo real
   */
  async obtenerEstadisticasMesActual(): Promise<any> {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59);

    // Total de donaciones
    const totalDonaciones = await this.donacionesRepository
      .createQueryBuilder('donacion')
      .select('SUM(donacion.monto)', 'total')
      .addSelect('COUNT(DISTINCT donacion.id_donacion)', 'count')
      .where('donacion.fecha_donacion BETWEEN :primerDia AND :ultimoDia', { 
        primerDia: primerDiaMes,
        ultimoDia: ultimoDiaMes 
      })
      .andWhere('donacion.estado = :estado', { estado: 'Completada' })
      .getRawOne();

    // Donantes únicos
    const donantesUnicos = await this.donacionesRepository
      .createQueryBuilder('donacion')
      .select('COUNT(DISTINCT donacion.id_usuario)', 'count')
      .where('donacion.fecha_donacion BETWEEN :primerDia AND :ultimoDia', { 
        primerDia: primerDiaMes,
        ultimoDia: ultimoDiaMes 
      })
      .andWhere('donacion.estado = :estado', { estado: 'Completada' })
      .andWhere('donacion.id_usuario IS NOT NULL')
      .getRawOne();

    // Nuevos usuarios
    const nuevosUsuarios = await this.usuariosRepository
      .createQueryBuilder('usuario')
      .select('COUNT(usuario.id_usuario)', 'count')
      .where('usuario.fecha_registro BETWEEN :primerDia AND :ultimoDia', { 
        primerDia: primerDiaMes,
        ultimoDia: ultimoDiaMes 
      })
      .getRawOne();

    // Nuevas suscripciones
    const nuevasSuscripciones = await this.suscripcionesRepository
      .createQueryBuilder('suscripcion')
      .select('COUNT(suscripcion.id_suscripcion)', 'count')
      .where('suscripcion.fecha_inicio BETWEEN :primerDia AND :ultimoDia', { 
        primerDia: primerDiaMes,
        ultimoDia: ultimoDiaMes 
      })
      .getRawOne();

    // Suscripciones canceladas
    const suscripcionesCanceladas = await this.suscripcionesRepository
      .createQueryBuilder('suscripcion')
      .select('COUNT(suscripcion.id_suscripcion)', 'count')
      .where('suscripcion.ultima_actualizacion BETWEEN :primerDia AND :ultimoDia', { 
        primerDia: primerDiaMes,
        ultimoDia: ultimoDiaMes 
      })
      .andWhere('suscripcion.estado = :estado', { estado: 'Cancelada' })
      .getRawOne();

    // Campaña principal
    const campañaPrincipal = await this.donacionesRepository
      .createQueryBuilder('donacion')
      .select('donacion.id_campana', 'id_campana')
      .addSelect('SUM(donacion.monto)', 'total')
      .addSelect('COUNT(donacion.id_donacion)', 'count')
      .where('donacion.fecha_donacion BETWEEN :primerDia AND :ultimoDia', { 
        primerDia: primerDiaMes,
        ultimoDia: ultimoDiaMes 
      })
      .andWhere('donacion.estado = :estado', { estado: 'Completada' })
      .andWhere('donacion.id_campana IS NOT NULL')
      .groupBy('donacion.id_campana')
      .orderBy('total', 'DESC')
      .limit(1)
      .getRawOne();

    // Obtener detalles de la campaña principal
    let campañaDetalle: Campana | null = null;
    if (campañaPrincipal && campañaPrincipal.id_campana) {
      campañaDetalle = await this.campanasRepository.findOne({
        where: { id_campana: campañaPrincipal.id_campana }
      });
    }

    return {
      ano: hoy.getFullYear(),
      mes: hoy.getMonth() + 1,
      total_donaciones: totalDonaciones?.total || 0,
      contador_donaciones: totalDonaciones?.count || 0,
      contador_donantes_unicos: donantesUnicos?.count || 0,
      contador_nuevos_donantes: nuevosUsuarios?.count || 0,
      contador_suscripciones_nuevas: nuevasSuscripciones?.count || 0,
      contador_suscripciones_canceladas: suscripcionesCanceladas?.count || 0,
      campana_principal: campañaPrincipal?.id_campana || null,
      campana_principal_detalle: campañaDetalle,
      monto_promedio: totalDonaciones?.count > 0 
        ? totalDonaciones.total / totalDonaciones.count 
        : 0,
    };
  }

  /**
   * Obtiene un dashboard completo de estadísticas
   */
  async obtenerDashboard(): Promise<any> {
    const mesActual = await this.obtenerEstadisticasMesActual();
    
    // Obtener últimos 12 meses
    const ultimos12Meses = await this.obtenerEstadisticasMensuales();
    
    // Total histórico donado
    const totalHistorico = await this.donacionesRepository
      .createQueryBuilder('donacion')
      .select('SUM(donacion.monto)', 'total')
      .addSelect('COUNT(DISTINCT donacion.id_donacion)', 'count')
      .andWhere('donacion.estado = :estado', { estado: 'Completada' })
      .getRawOne();
    
    // Usuarios activos (que han donado en los últimos 3 meses)
    const ultimosTresMeses = moment().subtract(3, 'months').toDate();
    const usuariosActivos = await this.donacionesRepository
      .createQueryBuilder('donacion')
      .select('COUNT(DISTINCT donacion.id_usuario)', 'count')
      .where('donacion.fecha_donacion >= :fecha', { fecha: ultimosTresMeses })
      .andWhere('donacion.estado = :estado', { estado: 'Completada' })
      .andWhere('donacion.id_usuario IS NOT NULL')
      .getRawOne();
    
    // Top 5 donantes
    const topDonantes = await this.donacionesRepository
      .createQueryBuilder('donacion')
      .select('donacion.id_usuario', 'id_usuario')
      .addSelect('SUM(donacion.monto)', 'total')
      .addSelect('COUNT(donacion.id_donacion)', 'count')
      .where('donacion.estado = :estado', { estado: 'Completada' })
      .andWhere('donacion.id_usuario IS NOT NULL')
      .groupBy('donacion.id_usuario')
      .orderBy('total', 'DESC')
      .limit(5)
      .getRawMany();
    
    // Obtener detalles de los top donantes
    const topDonantesDetalle: Array<{
      id_usuario: number;
      nombre: string;
      total_donado: any;
      cantidad_donaciones: any;
      nivel_donante: string;
    }> = [];
    for (const donante of topDonantes) {
      const usuario = await this.usuariosRepository.findOne({
        where: { id_usuario: donante.id_usuario }
      });
      
      if (usuario) {
        topDonantesDetalle.push({
          id_usuario: usuario.id_usuario,
          nombre: `${usuario.nombres} ${usuario.apellidos}`,
          total_donado: donante.total,
          cantidad_donaciones: donante.count,
          nivel_donante: usuario.nivel_donante,
        });
      }
    }
    
    return {
      mes_actual: mesActual,
      ultimos_12_meses: ultimos12Meses,
      total_historico: {
        monto: totalHistorico?.total || 0,
        donaciones: totalHistorico?.count || 0,
      },
      usuarios_activos: usuariosActivos?.count || 0,
      top_donantes: topDonantesDetalle,
    };
  }

  /**
   * Actualiza las estadísticas del mes anterior (tarea programada)
   */
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async actualizarEstadisticasMensual() {
    this.logger.log('Actualizando estadísticas mensuales...');
    
    try {
      // Obtener mes anterior
      const fechaAnterior = moment().subtract(1, 'months');
      const año = fechaAnterior.year();
      const mes = fechaAnterior.month() + 1;
      
      // Calcular fechas de inicio y fin del mes anterior
      const fechaInicio = new Date(año, mes - 1, 1);
      const fechaFin = new Date(año, mes, 0, 23, 59, 59);
      
      // Total de donaciones
      const totalDonaciones = await this.donacionesRepository
        .createQueryBuilder('donacion')
        .select('SUM(donacion.monto)', 'total')
        .addSelect('COUNT(DISTINCT donacion.id_donacion)', 'count')
        .where('donacion.fecha_donacion BETWEEN :fechaInicio AND :fechaFin', { 
          fechaInicio, 
          fechaFin 
        })
        .andWhere('donacion.estado = :estado', { estado: 'Completada' })
        .getRawOne();
      
      // Donantes únicos
      const donantesUnicos = await this.donacionesRepository
        .createQueryBuilder('donacion')
        .select('COUNT(DISTINCT donacion.id_usuario)', 'count')
        .where('donacion.fecha_donacion BETWEEN :fechaInicio AND :fechaFin', { 
          fechaInicio, 
          fechaFin 
        })
        .andWhere('donacion.estado = :estado', { estado: 'Completada' })
        .andWhere('donacion.id_usuario IS NOT NULL')
        .getRawOne();
      
      // Nuevos donantes (primera donación en este mes)
      const nuevosDonantes = await this.donacionesRepository
        .createQueryBuilder('d1')
        .select('COUNT(DISTINCT d1.id_usuario)', 'count')
        .where('d1.fecha_donacion BETWEEN :fechaInicio AND :fechaFin', { 
          fechaInicio, 
          fechaFin 
        })
        .andWhere('d1.estado = :estado', { estado: 'Completada' })
        .andWhere('d1.id_usuario IS NOT NULL')
        .andWhere(qb => {
          const subQuery = qb
            .subQuery()
            .select('1')
            .from(Donacion, 'd2')
            .where('d2.id_usuario = d1.id_usuario')
            .andWhere('d2.fecha_donacion < :fechaInicio', { fechaInicio })
            .andWhere('d2.estado = :estado', { estado: 'Completada' })
            .getQuery();
          return 'NOT EXISTS ' + subQuery;
        })
        .getRawOne();
      
      // Nuevas suscripciones
      const nuevasSuscripciones = await this.suscripcionesRepository
        .createQueryBuilder('suscripcion')
        .select('COUNT(suscripcion.id_suscripcion)', 'count')
        .where('suscripcion.fecha_inicio BETWEEN :fechaInicio AND :fechaFin', { 
          fechaInicio, 
          fechaFin 
        })
        .getRawOne();
      
      // Suscripciones canceladas
      const suscripcionesCanceladas = await this.suscripcionesRepository
        .createQueryBuilder('suscripcion')
        .select('COUNT(suscripcion.id_suscripcion)', 'count')
        .where('suscripcion.ultima_actualizacion BETWEEN :fechaInicio AND :fechaFin', { 
          fechaInicio, 
          fechaFin 
        })
        .andWhere('suscripcion.estado = :estado', { estado: 'Cancelada' })
        .getRawOne();
      
      // Campaña principal
      const campañaPrincipal = await this.donacionesRepository
        .createQueryBuilder('donacion')
        .select('donacion.id_campana', 'id_campana')
        .addSelect('SUM(donacion.monto)', 'total')
        .where('donacion.fecha_donacion BETWEEN :fechaInicio AND :fechaFin', { 
          fechaInicio, 
          fechaFin 
        })
        .andWhere('donacion.estado = :estado', { estado: 'Completada' })
        .andWhere('donacion.id_campana IS NOT NULL')
        .groupBy('donacion.id_campana')
        .orderBy('total', 'DESC')
        .limit(1)
        .getRawOne();
      
      // Calcular monto promedio
      const montoPromedio = totalDonaciones?.count > 0 
        ? totalDonaciones.total / totalDonaciones.count 
        : 0;
      
      // Crear o actualizar estadísticas
      const estadistica = await this.estadisticasRepository.findOne({
        where: { ano: año, mes: mes }
      });
      
      if (estadistica) {
        // Actualizar existente
        await this.estadisticasRepository.update(
          { ano: año, mes: mes },
          {
            total_donaciones: totalDonaciones?.total || 0,
            contador_donaciones: totalDonaciones?.count || 0,
            contador_donantes_unicos: donantesUnicos?.count || 0,
            contador_nuevos_donantes: nuevosDonantes?.count || 0,
            contador_suscripciones_nuevas: nuevasSuscripciones?.count || 0,
            contador_suscripciones_canceladas: suscripcionesCanceladas?.count || 0,
            campana_principal: campañaPrincipal?.id_campana || null,
            monto_promedio: montoPromedio,
          }
        );
      } else {
        // Crear nueva
        await this.estadisticasRepository.insert({
          ano: año,
          mes: mes,
          total_donaciones: totalDonaciones?.total || 0,
          contador_donaciones: totalDonaciones?.count || 0,
          contador_donantes_unicos: donantesUnicos?.count || 0,
          contador_nuevos_donantes: nuevosDonantes?.count || 0,
          contador_suscripciones_nuevas: nuevasSuscripciones?.count || 0,
          contador_suscripciones_canceladas: suscripcionesCanceladas?.count || 0,
          campana_principal: campañaPrincipal?.id_campana || null,
          monto_promedio: montoPromedio,
        });
      }
      
      this.logger.log(`Estadísticas de ${mes}/${año} actualizadas correctamente`);
    } catch (error) {
      this.logger.error(`Error actualizando estadísticas mensuales: ${error.message}`, error.stack);
    }
  }
}