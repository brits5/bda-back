import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import { Comprobante } from '../entities/comprobante.entity';
import { Donacion } from '../../donaciones/entities/donacion.entity';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../../../common/services/mail.service';

import { Like } from 'typeorm';

@Injectable()
export class ComprobantesService {
  private readonly logger = new Logger(ComprobantesService.name);
  private readonly storagePath: string;

  constructor(
    @InjectRepository(Comprobante)
    private comprobantesRepository: Repository<Comprobante>,
    @InjectRepository(Donacion)
    private donacionesRepository: Repository<Donacion>,
    private configService: ConfigService,
    private mailService: MailService,
  ) {
    this.storagePath = this.configService.get<string>('storage.path') || '/default/storage/path';
    // Asegurar que el directorio existe
    const comprobanteDir = path.join(this.storagePath, 'comprobantes');
    if (!fs.existsSync(comprobanteDir)) {
      fs.mkdirSync(comprobanteDir, { recursive: true });
    }
  }

  /**
   * Encuentra un comprobante por su ID
   */
  async findOne(id: number): Promise<Comprobante> {
    const comprobante = await this.comprobantesRepository.findOne({
      where: { id_comprobante: id },
      relations: ['donacion', 'donacion.usuario', 'donacion.campana'],
    });

    if (!comprobante) {
      throw new NotFoundException(`Comprobante con ID ${id} no encontrado`);
    }

    return comprobante;
  }

  /**
   * Encuentra un comprobante por su código único
   */
  async findByCodigoUnico(codigo: string): Promise<Comprobante> {
    const comprobante = await this.comprobantesRepository.findOne({
      where: { codigo_unico: codigo },
      relations: ['donacion', 'donacion.usuario', 'donacion.campana'],
    });

    if (!comprobante) {
      throw new NotFoundException(`Comprobante con código ${codigo} no encontrado`);
    }

    return comprobante;
  }

  /**
   * Genera y guarda un comprobante para una donación
   */
  async generarComprobante(idDonacion: number): Promise<Comprobante> {
    // Verificar si la donación ya tiene un comprobante
    const existente = await this.comprobantesRepository.findOne({
      where: { id_donacion: idDonacion }
    });

    if (existente) {
      return existente;
    }

    // Obtener la donación
    const donacion = await this.donacionesRepository.findOne({
      where: { id_donacion: idDonacion },
      relations: ['usuario', 'campana'],
    });

    if (!donacion) {
      throw new NotFoundException(`Donación con ID ${idDonacion} no encontrada`);
    }

    // Generar código único para el comprobante (formato: COMP-AÑO-NÚMERO)
    const año = new Date().getFullYear();
    const contador = await this.comprobantesRepository.count({
      where: { codigo_unico: Like(`COMP-${año}-%`) }
    });
    const codigoUnico = `COMP-${año}-${String(contador + 1).padStart(5, '0')}`;

    // Crear ruta para el PDF
    const nombreArchivo = `${codigoUnico}.pdf`;
    const rutaPdf = `/comprobantes/${nombreArchivo}`;
    const rutaCompleta = path.join(this.storagePath, 'comprobantes', nombreArchivo);

    // Crear el comprobante en la base de datos
    const comprobante = this.comprobantesRepository.create({
      id_donacion: idDonacion,
      codigo_unico: codigoUnico,
      url_pdf: rutaPdf,
      enviado_email: false,
      correo_envio: donacion.correo_comprobante || (donacion.usuario ? donacion.usuario.correo : undefined),
    });

    const comprobanteGuardado = await this.comprobantesRepository.save(comprobante);

    // Generar el PDF físicamente
    await this.generarPdf(comprobanteGuardado, donacion, rutaCompleta);

    // Enviar por email si hay correo disponible
    if (comprobanteGuardado.correo_envio) {
      await this.enviarComprobantePorEmail(comprobanteGuardado, donacion);
    }

    return comprobanteGuardado;
  }

  /**
   * Genera el archivo PDF del comprobante
   */
  private async generarPdf(comprobante: Comprobante, donacion: Donacion, rutaArchivo: string): Promise<void> {
    // Aquí implementaríamos la generación del PDF con una librería como PDFKit
    // Por simplicidad, solo creamos un archivo vacío en esta implementación
    try {
      fs.writeFileSync(
        rutaArchivo, 
        `Comprobante de donación ${comprobante.codigo_unico}\n` +
        `Fecha: ${new Date().toLocaleDateString()}\n` +
        `Monto: $${donacion.monto}\n` +
        `Método de pago: ${donacion.metodo_pago}\n` +
        `Campaña: ${donacion.campana ? donacion.campana.nombre : 'Donación general'}\n` +
        `Donante: ${donacion.es_anonima ? 'Anónimo' : (donacion.usuario ? donacion.usuario.getNombreCompleto() : 'Sin usuario')}`
      );
      
      this.logger.log(`Archivo PDF generado en ${rutaArchivo}`);
    } catch (error) {
      this.logger.error(`Error generando PDF: ${error.message}`);
      throw error;
    }
  }

  /**
   * Envía el comprobante por email
   */
  private async enviarComprobantePorEmail(comprobante: Comprobante, donacion: Donacion): Promise<void> {
    try {
      // Obtener info de impacto
      const impactoTexto = donacion.getImpactoTexto();
      
      // Enviar el email con el comprobante adjunto
      await this.mailService.enviarEmailConAdjunto({
        to: comprobante.correo_envio,
        subject: `Comprobante de donación ${comprobante.codigo_unico}`,
        html: `
          <h1>¡Gracias por tu donación!</h1>
          <p>Hemos recibido tu donación de $${donacion.monto} correctamente.</p>
          <p><strong>Impacto de tu donación:</strong> ${impactoTexto}</p>
          <p>Adjunto encontrarás el comprobante de tu donación.</p>
          <p>¡Gracias por tu generosidad!</p>
        `,
        attachments: [
          {
            filename: `${comprobante.codigo_unico}.pdf`,
            path: path.join(this.storagePath, comprobante.url_pdf.substring(1)),
          }
        ]
      });
      
      // Actualizar estado de envío
      await this.comprobantesRepository.update(
        { id_comprobante: comprobante.id_comprobante },
        { 
          enviado_email: true,
          fecha_envio: new Date()
        }
      );
      
      this.logger.log(`Comprobante ${comprobante.codigo_unico} enviado a ${comprobante.correo_envio}`);
    } catch (error) {
      this.logger.error(`Error enviando comprobante por email: ${error.message}`);
      // No propagamos el error para no interrumpir el flujo principal
    }
  }

  /**
   * Reenvía un comprobante a un correo
   */
  async reenviarComprobante(idComprobante: number, correo: string): Promise<boolean> {
    const comprobante = await this.findOne(idComprobante);
    const donacion = comprobante.donacion;
    
    comprobante.correo_envio = correo;
    
    await this.enviarComprobantePorEmail(comprobante, donacion);
    
    return true;
  }
}
