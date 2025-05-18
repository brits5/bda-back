import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Configuracion } from '../entities/configuracion.entity';
import { ActualizarConfiguracionDto, CrearConfiguracionDto } from '../dto/configuracion.dto';

@Injectable()
export class ConfiguracionesService {
  private readonly logger = new Logger(ConfiguracionesService.name);
  private cache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutos en milisegundos

  constructor(
    @InjectRepository(Configuracion)
    private configuracionesRepository: Repository<Configuracion>,
  ) {
    // Cargar configuraciones básicas en caché al iniciar el servicio
    this.cargarCache();
  }

  /**
   * Carga las configuraciones principales en caché
   */
  private async cargarCache(): Promise<void> {
    try {
      const configuraciones = await this.configuracionesRepository.find();
      
      for (const config of configuraciones) {
        this.cache.set(config.clave, config.getValorTipado());
        this.cacheExpiry.set(config.clave, Date.now() + this.CACHE_TTL);
      }
      
      this.logger.log(`${configuraciones.length} configuraciones cargadas en caché`);
    } catch (error) {
      this.logger.error('Error cargando configuraciones en caché:', error.message);
    }
  }

  /**
   * Obtiene todas las configuraciones
   */
  async findAll(): Promise<Configuracion[]> {
    return this.configuracionesRepository.find({
      order: { clave: 'ASC' },
    });
  }

  /**
   * Encuentra una configuración por su clave
   */
  async findOne(clave: string): Promise<Configuracion> {
    const configuracion = await this.configuracionesRepository.findOne({
      where: { clave },
    });

    if (!configuracion) {
      throw new NotFoundException(`Configuración con clave "${clave}" no encontrada`);
    }

    return configuracion;
  }

  /**
   * Crea una nueva configuración
   */
  async create(createConfiguracionDto: CrearConfiguracionDto): Promise<Configuracion> {
    // Verificar si ya existe
    const existente = await this.configuracionesRepository.findOne({
      where: { clave: createConfiguracionDto.clave },
    });
    
    if (existente) {
      throw new BadRequestException(`Ya existe una configuración con la clave "${createConfiguracionDto.clave}"`);
    }
    
    // Validar el tipo de valor
    if (typeof createConfiguracionDto.valor !== 'string' || typeof createConfiguracionDto.tipo !== 'string') {
      throw new BadRequestException('El valor y el tipo son requeridos y deben ser cadenas de texto');
    }
    this.validarTipoValor(createConfiguracionDto.valor, createConfiguracionDto.tipo);
    
    // Crear la configuración
    const configuracion = this.configuracionesRepository.create(createConfiguracionDto);
    const result = await this.configuracionesRepository.save(configuracion);
    
    // Actualizar caché
    this.cache.set(result.clave, result.getValorTipado());
    this.cacheExpiry.set(result.clave, Date.now() + this.CACHE_TTL);
    
    return result;
  }

  /**
   * Actualiza una configuración existente
   */
  async update(clave: string, updateConfiguracionDto: ActualizarConfiguracionDto): Promise<Configuracion> {
    const configuracion = await this.findOne(clave);
    
    // Si se está cambiando el tipo, validar que el valor sea compatible
    if (updateConfiguracionDto.tipo && updateConfiguracionDto.tipo !== configuracion.tipo) {
      this.validarTipoValor(
        updateConfiguracionDto.valor || configuracion.valor,
        updateConfiguracionDto.tipo
      );
    } else if (updateConfiguracionDto.valor) {
      // Validar que el nuevo valor sea compatible con el tipo actual
      this.validarTipoValor(
        updateConfiguracionDto.valor,
        configuracion.tipo
      );
    }
    
    // Actualizar campos
    Object.assign(configuracion, {
      ...updateConfiguracionDto,
      fecha_actualizacion: new Date(),
    });
    
    const result = await this.configuracionesRepository.save(configuracion);
    
    // Actualizar caché
    this.cache.set(result.clave, result.getValorTipado());
    this.cacheExpiry.set(result.clave, Date.now() + this.CACHE_TTL);
    
    return result;
  }

  /**
   * Elimina una configuración
   */
  async remove(clave: string): Promise<boolean> {
    const configuracion = await this.findOne(clave);
    
    await this.configuracionesRepository.remove(configuracion);
    
    // Eliminar de caché
    this.cache.delete(clave);
    this.cacheExpiry.delete(clave);
    
    return true;
  }

  /**
   * Obtiene el valor de una configuración
   */
  async obtenerValor(clave: string): Promise<any> {
    // Verificar si está en caché y no ha expirado
    const expiry = this.cacheExpiry.get(clave);
    if (this.cache.has(clave) && expiry !== undefined && expiry > Date.now()) {
      return this.cache.get(clave);
    }
    
    // No está en caché o ha expirado, buscar en BD
    const configuracion = await this.findOne(clave);
    const valor = configuracion.getValorTipado();
    
    // Actualizar caché
    this.cache.set(clave, valor);
    this.cacheExpiry.set(clave, Date.now() + this.CACHE_TTL);
    
    return valor;
  }

  /**
   * Obtiene el valor de una configuración como texto
   */
  async obtenerValorTexto(clave: string, valorPorDefecto: string = ''): Promise<string> {
    try {
      const valor = await this.obtenerValor(clave);
      return String(valor);
    } catch (error) {
      return valorPorDefecto;
    }
  }

  /**
   * Obtiene el valor de una configuración como número
   */
  async obtenerValorNumerico(clave: string, valorPorDefecto: number = 0): Promise<number> {
    try {
      const valor = await this.obtenerValor(clave);
      const numerico = Number(valor);
      return isNaN(numerico) ? valorPorDefecto : numerico;
    } catch (error) {
      return valorPorDefecto;
    }
  }

  /**
   * Obtiene el valor de una configuración como booleano
   */
  async obtenerValorBooleano(clave: string, valorPorDefecto: boolean = false): Promise<boolean> {
    try {
      const valor = await this.obtenerValor(clave);
      return Boolean(valor);
    } catch (error) {
      return valorPorDefecto;
    }
  }

  /**
   * Obtiene el valor de una configuración como JSON
   */
  async obtenerValorJSON<T>(clave: string, valorPorDefecto: T | null = null): Promise<T | null> {
    try {
      return await this.obtenerValor(clave) as T;
    } catch (error) {
      return valorPorDefecto;
    }
  }

  /**
   * Obtiene un conjunto de configuraciones al mismo tiempo
   */
  async obtenerMultiples(claves: string[]): Promise<Record<string, any>> {
    const resultado: Record<string, any> = {};
    
    for (const clave of claves) {
      try {
        resultado[clave] = await this.obtenerValor(clave);
      } catch (error) {
        this.logger.warn(`Configuración "${clave}" no encontrada`);
        resultado[clave] = null;
      }
    }
    
    return resultado;
  }

  /**
   * Valida que el valor sea compatible con el tipo especificado
   */
  private validarTipoValor(valor: string, tipo: string): void {
    switch (tipo) {
      case 'numero':
        if (isNaN(Number(valor))) {
          throw new BadRequestException(`El valor "${valor}" no es un número válido`);
        }
        break;
      case 'booleano':
        if (valor !== 'true' && valor !== 'false' && valor !== '1' && valor !== '0') {
          throw new BadRequestException(`El valor "${valor}" no es un booleano válido`);
        }
        break;
      case 'json':
        try {
          JSON.parse(valor);
        } catch (error) {
          throw new BadRequestException(`El valor no es un JSON válido: ${error.message}`);
        }
        break;
    }
  }
}