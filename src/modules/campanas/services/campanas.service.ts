import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, MoreThan } from 'typeorm';
import { Campana } from '../entities/campana.entity';
import { CrearCampanaDto, ActualizarCampanaDto } from '../dto/campana.dto';
import { paginate, Pagination, IPaginationOptions } from 'nestjs-typeorm-paginate';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CampanasService {
  private readonly logger = new Logger(CampanasService.name);

  constructor(
    @InjectRepository(Campana)
    private campanasRepository: Repository<Campana>,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Obtiene una lista paginada de campañas
   */
  async findAll(
    options: IPaginationOptions,
    where: FindOptionsWhere<Campana> = {},
  ): Promise<Pagination<Campana>> {
    return paginate<Campana>(this.campanasRepository, options, {
      where,
      order: { 
        es_emergencia: 'DESC',
        fecha_inicio: 'DESC' 
      },
    });
  }

  /**
   * Encuentra una campaña por su ID
   */
  async findOne(id: number): Promise<Campana> {
    const campana = await this.campanasRepository.findOne({
      where: { id_campana: id },
      relations: ['donaciones', 'suscripciones', 'seguidores'],
    });

    if (!campana) {
      throw new NotFoundException(`Campaña con ID ${id} no encontrada`);
    }

    return campana;
  }

  /**
   * Crea una nueva campaña
   */
  async create(createCampanaDto: CrearCampanaDto): Promise<Campana> {
    const campana = this.campanasRepository.create({
      ...createCampanaDto,
      estado: 'Activa',
      monto_recaudado: 0,
      contador_donaciones: 0,
    });

    const campanaGuardada = await this.campanasRepository.save(campana);
    
    // Emitir evento
    this.eventEmitter.emit('campana.created', campanaGuardada);
    
    return campanaGuardada;
  }

  /**
   * Actualiza una campaña existente
   */
  async update(id: number, updateCampanaDto: ActualizarCampanaDto): Promise<Campana> {
    const campana = await this.findOne(id);
    
    // Actualizar campos
    Object.assign(campana, updateCampanaDto);
    
    const campanaActualizada = await this.campanasRepository.save(campana);
    
    // Emitir evento
    this.eventEmitter.emit('campana.updated', campanaActualizada);
    
    return campanaActualizada;
  }

  /**
   * Cambia el estado de una campaña
   */
  async cambiarEstado(id: number, estado: 'Activa' | 'Finalizada' | 'Cancelada'): Promise<Campana> {
    const campana = await this.findOne(id);
    
    campana.estado = estado;
    
    const campanaActualizada = await this.campanasRepository.save(campana);
    
    // Emitir evento
    this.eventEmitter.emit('campana.estadoCambiado', {
      campana: campanaActualizada,
      estadoAnterior: campana.estado,
    });
    
    return campanaActualizada;
  }

  /**
   * Obtiene las campañas activas y destacadas para mostrar en el home
   */
  async obtenerCampanasDestacadas(limit: number = 4): Promise<Campana[]> {
    // Priorizar campañas de emergencia activas y luego las que están más cerca de cumplir su meta
    return this.campanasRepository.find({
      where: { 
        estado: 'Activa',
        fecha_fin: MoreThan(new Date()) 
      },
      order: {
        es_emergencia: 'DESC',
        monto_recaudado: 'DESC'
      },
      take: limit,
    });
  }

  /**
   * Busca campañas por texto en nombre o descripción
   */
  async buscarCampanas(texto: string, options: IPaginationOptions): Promise<Pagination<Campana>> {
    const queryBuilder = this.campanasRepository.createQueryBuilder('campana')
      .where('campana.nombre LIKE :texto OR campana.descripcion LIKE :texto', { 
        texto: `%${texto}%` 
      })
      .orderBy('campana.es_emergencia', 'DESC')
      .addOrderBy('campana.fecha_inicio', 'DESC');
    
    return paginate<Campana>(queryBuilder, options);
  }

  /**
   * Obtiene estadísticas de campañas
   */
  async obtenerEstadisticas() {
    const totalCampanas = await this.campanasRepository.count();
    
    const campanasActivas = await this.campanasRepository.count({
      where: { estado: 'Activa' }
    });
    
    const totalRecaudado = await this.campanasRepository
      .createQueryBuilder('campana')
      .select('SUM(campana.monto_recaudado)', 'total')
      .getRawOne();
    
    const campanasEmergencia = await this.campanasRepository.count({
      where: { 
        es_emergencia: true,
        estado: 'Activa'
      }
    });
    
    const campanaMayorExito = await this.campanasRepository.find({
      order: {
        monto_recaudado: 'DESC'
      },
      take: 1
    });
    
    return {
      totalCampanas,
      campanasActivas,
      totalRecaudado: totalRecaudado.total || 0,
      campanasEmergencia,
      campanaMayorExito: campanaMayorExito.length > 0 ? campanaMayorExito[0] : null,
    };
  }
}