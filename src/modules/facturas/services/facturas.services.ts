import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import { Factura } from '../entities/factura.entity';
import { DatosFiscales } from '../entities/datos-fiscales.entity';
import { Donacion } from '../../donaciones/entities/donacion.entity';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../../../common/services/mail.service';
import { CrearDatosFiscalesDto } from '../dto/factura.dto';

@Injectable()
export class FacturasService {
  private readonly logger = new Logger(FacturasService.name);
  private readonly storagePath: string;

  constructor(
    @InjectRepository(Factura)
    private facturasRepository: Repository<Factura>,
    @InjectRepository(DatosFiscales)
    private datosFiscalesRepository: Repository<DatosFiscales>,
    @InjectRepository(Donacion)
    private donacionesRepository: Repository<Donacion>,
    private configService: ConfigService,
    private mailService: MailService,
  ) {
    this.storagePath = this.configService.get<string>('storage.path') || 'default/storage/path';
    // Asegurar que el directorio existe
    const facturaDir = path.join(this.storagePath, 'facturas');
    if (!fs.existsSync(facturaDir)) {
      fs.mkdirSync(facturaDir, { recursive: true });
    }
  }

  /**
   * Encuentra una factura por su ID
   */
  async findOne(id: number): Promise<Factura> {
    const factura = await this.facturasRepository.findOne({
      where: { id_factura: id },
      relations: ['donacion', 'donacion.usuario', 'donacion.campana', 'datos_fiscales'],
    });

    if (!factura) {
      throw new NotFoundException(`Factura con ID ${id} no encontrada`);
    }

    return factura;
  }

  /**
   * Encuentra una factura por su número
   */
  async findByNumero(numero: string): Promise<Factura> {
    const factura = await this.facturasRepository.findOne({
      where: { numero_factura: numero },
      relations: ['donacion', 'donacion.usuario', 'donacion.campana', 'datos_fiscales'],
    });

    if (!factura) {
      throw new NotFoundException(`Factura con número ${numero} no encontrada`);
    }

    return factura;
  }

  /**
   * Encuentra los datos fiscales de un usuario
   */
  async findDatosFiscalesByUsuario(idUsuario: number): Promise<DatosFiscales[]> {
    return this.datosFiscalesRepository.find({
      where: { id_usuario: idUsuario },
    });
  }

  /**
   * Obtiene los datos fiscales por ID
   */
  async findDatosFiscales(id: number): Promise<DatosFiscales> {
    const datosFiscales = await this.datosFiscalesRepository.findOne({
      where: { id_datos_fiscales: id },
    });

    if (!datosFiscales) {
      throw new NotFoundException(`Datos fiscales con ID ${id} no encontrados`);
    }

    return datosFiscales;
  }

  /**
   * Crea o actualiza datos fiscales
   */
  async createOrUpdateDatosFiscales(
    datosFiscalesDto: CrearDatosFiscalesDto,
    idUsuario?: number,
  ): Promise<DatosFiscales> {
    // Verificar si ya existen datos fiscales con el mismo RFC para el usuario
    let datosFiscales: DatosFiscales | null = null;
    
    if (idUsuario) {
      datosFiscales = await this.datosFiscalesRepository.findOne({
        where: { 
          id_usuario: idUsuario,
          rfc: datosFiscalesDto.rfc,
        },
      });
    }
    
    if (datosFiscales) {
      // Actualizar datos existentes
      Object.assign(datosFiscales, {
        ...datosFiscalesDto,
        ultima_actualizacion: new Date(),
      });
    } else {
      // Crear nuevos datos fiscales
      datosFiscales = this.datosFiscalesRepository.create({
        ...datosFiscalesDto,
        id_usuario: idUsuario,
      });
    }
    
    return this.datosFiscalesRepository.save(datosFiscales);
  }

  /**
   * Genera una factura para una donación
   */
  async generarFacturaManual(
    idDonacion: number,
    datosFiscalesDto: CrearDatosFiscalesDto,
    idUsuario?: number,
  ): Promise<Factura> {
    // Verificar si la donación existe
    const donacion = await this.donacionesRepository.findOne({
      where: { id_donacion: idDonacion },
      relations: ['usuario'],
    });
    
    if (!donacion) {
      throw new NotFoundException(`Donación con ID ${idDonacion} no encontrada`);
    }
    
    // Verificar si ya existe una factura para esta donación
    const facturaExistente = await this.facturasRepository.findOne({
      where: { id_donacion: idDonacion },
    });
    
    if (facturaExistente) {
      throw new BadRequestException(`Ya existe una factura para esta donación`);
    }
    
    // Crear o actualizar datos fiscales
    const datosFiscales = await this.createOrUpdateDatosFiscales(
      datosFiscalesDto,
      idUsuario || donacion.id_usuario,
    );
    
    // Generar número de factura (formato: FAC-AÑO-NÚMERO)
    const año = new Date().getFullYear();
    const contador = await this.facturasRepository.count({
      where: { numero_factura: Like(`FAC-${año}-%`) },
    });
    const numeroFactura = `FAC-${año}-${String(contador + 1).padStart(5, '0')}`;
    
    // Crear ruta para el PDF
    const nombreArchivo = `${numeroFactura}.pdf`;
    const rutaPdf = `/facturas/${nombreArchivo}`;
    const rutaCompleta = path.join(this.storagePath, 'facturas', nombreArchivo);
    
    // Crear la factura en la base de datos
    const factura = this.facturasRepository.create({
      id_donacion: idDonacion,
      id_datos_fiscales: datosFiscales.id_datos_fiscales,
      numero_factura: numeroFactura,
      subtotal: donacion.monto,
      impuestos: 0, // Sin impuestos para donaciones
      total: donacion.monto,
      url_pdf: rutaPdf,
      enviada_email: false,
      enviada_sat: datosFiscales.requiere_cfdi,
    });
    
    const facturaGuardada = await this.facturasRepository.save(factura);
    
    // Generar el PDF físicamente
    await this.generarPdf(facturaGuardada, donacion, datosFiscales, rutaCompleta);
    
    // Enviar por email
    const emailDestino = datosFiscales.correo_facturacion || 
      (donacion.usuario ? donacion.usuario.correo : donacion.correo_comprobante);
    
    if (emailDestino) {
      await this.enviarFacturaPorEmail(facturaGuardada, donacion, emailDestino);
    }
    
    // Actualizar donación para marcar que ya tiene factura
    await this.donacionesRepository.update(
      { id_donacion: idDonacion },
      { requiere_factura: true }
    );
    
    return facturaGuardada;
  }

  /**
   * Genera factura automáticamente para una donación que ya indicó que requiere factura
   */
  async generarFacturaAutomatica(idDonacion: number): Promise<Factura | null> {
    // Verificar si la donación existe y requiere factura
    const donacion = await this.donacionesRepository.findOne({
      where: { id_donacion: idDonacion, requiere_factura: true },
      relations: ['usuario'],
    });
    
    if (!donacion || !donacion.id_usuario) {
      return null; // No se puede generar factura automática
    }
    
    // Verificar si ya existe una factura
    const facturaExistente = await this.facturasRepository.findOne({
      where: { id_donacion: idDonacion },
    });
    
    if (facturaExistente) {
      return facturaExistente;
    }
    
    // Buscar datos fiscales del usuario
    const datosFiscales = await this.datosFiscalesRepository.findOne({
      where: { id_usuario: donacion.id_usuario },
      order: { ultima_actualizacion: 'DESC' }, // Usar los más recientes
    });
    
    if (!datosFiscales) {
      return null; // No hay datos fiscales para generar factura automática
    }
    
    // Generar número de factura (formato: FAC-AÑO-NÚMERO)
    const año = new Date().getFullYear();
    const contador = await this.facturasRepository.count({
      where: { numero_factura: Like(`FAC-${año}-%`) },
    });
    const numeroFactura = `FAC-${año}-${String(contador + 1).padStart(5, '0')}`;
    
    // Crear ruta para el PDF
    const nombreArchivo = `${numeroFactura}.pdf`;
    const rutaPdf = `/facturas/${nombreArchivo}`;
    const rutaCompleta = path.join(this.storagePath, 'facturas', nombreArchivo);
    
    // Crear la factura en la base de datos
    const factura = this.facturasRepository.create({
      id_donacion: idDonacion,
      id_datos_fiscales: datosFiscales.id_datos_fiscales,
      numero_factura: numeroFactura,
      subtotal: donacion.monto,
      impuestos: 0, // Sin impuestos para donaciones
      total: donacion.monto,
      url_pdf: rutaPdf,
      enviada_email: false,
      enviada_sat: datosFiscales.requiere_cfdi,
    });
    
    const facturaGuardada = await this.facturasRepository.save(factura);
    
    // Generar el PDF físicamente
    await this.generarPdf(facturaGuardada, donacion, datosFiscales, rutaCompleta);
    
    // Enviar por email
    const emailDestino = datosFiscales.correo_facturacion || donacion.usuario.correo;
    
    if (emailDestino) {
      await this.enviarFacturaPorEmail(facturaGuardada, donacion, emailDestino);
    }
    
    return facturaGuardada;
  }

  /**
   * Genera el archivo PDF de la factura
   */
  private async generarPdf(
    factura: Factura,
    donacion: Donacion,
    datosFiscales: DatosFiscales,
    rutaArchivo: string,
  ): Promise<void> {
    // Aquí implementaríamos la generación del PDF con una librería como PDFKit
    // Por simplicidad, solo creamos un archivo vacío en esta implementación
    try {
      fs.writeFileSync(
        rutaArchivo, 
        `Factura ${factura.numero_factura}\n` +
        `Fecha: ${new Date().toLocaleDateString()}\n` +
        `RFC: ${datosFiscales.rfc}\n` +
        `Razón Social: ${datosFiscales.razon_social}\n` +
        `Dirección: ${datosFiscales.direccion_fiscal || 'No especificada'}\n\n` +
        `Concepto: Donación\n` +
        `Campaña: ${donacion.campana ? donacion.campana.nombre : 'Donación general'}\n` +
        `Subtotal: $${factura.subtotal}\n` +
        `Impuestos: $${factura.impuestos}\n` +
        `Total: $${factura.total}`
      );
      
      this.logger.log(`Archivo PDF de factura generado en ${rutaArchivo}`);
    } catch (error) {
      this.logger.error(`Error generando PDF de factura: ${error.message}`);
      throw error;
    }
  }

  /**
   * Envía la factura por email
   */
  private async enviarFacturaPorEmail(
    factura: Factura,
    donacion: Donacion,
    email: string,
  ): Promise<void> {
    try {
      // Enviar el email con la factura adjunta
      await this.mailService.enviarFactura(
        email,
        factura.numero_factura,
        factura.total,
        path.join(this.storagePath, factura.url_pdf.substring(1))
      );
      
      // Actualizar estado de envío
      await this.facturasRepository.update(
        { id_factura: factura.id_factura },
        { 
          enviada_email: true,
          fecha_envio: new Date()
        }
      );
      
      this.logger.log(`Factura ${factura.numero_factura} enviada a ${email}`);
    } catch (error) {
      this.logger.error(`Error enviando factura por email: ${error.message}`);
      // No propagamos el error para no interrumpir el flujo principal
    }
  }

  /**
   * Reenvía una factura por email
   */
  async reenviarFactura(idFactura: number, correo: string): Promise<boolean> {
    const factura = await this.findOne(idFactura);
    const donacion = await this.donacionesRepository.findOne({
      where: { id_donacion: factura.id_donacion },
      relations: ['campana'],
    });

    if (!donacion) {
      throw new NotFoundException(`Donación con ID ${factura.id_donacion} no encontrada`);
    }
    
    try {
      await this.enviarFacturaPorEmail(factura, donacion, correo);
      return true;
    } catch (error) {
      this.logger.error(`Error reenviando factura: ${error.message}`);
      return false;
    }
  }

  /**
   * Obtiene las facturas de un usuario
   */
  async findByUsuario(idUsuario: number): Promise<Factura[]> {
    return this.facturasRepository
      .createQueryBuilder('factura')
      .innerJoin('factura.donacion', 'donacion')
      .leftJoinAndSelect('factura.datos_fiscales', 'datos_fiscales')
      .leftJoinAndSelect('donacion.campana', 'campana')
      .where('donacion.id_usuario = :idUsuario', { idUsuario })
      .orderBy('factura.fecha_emision', 'DESC')
      .getMany();
  }
}

// Importación necesaria para el método Like
import { Like } from 'typeorm';