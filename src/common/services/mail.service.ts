import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    path: string;
    contentType?: string;
  }>;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('mail.host'),
      port: this.configService.get<number>('mail.port'),
      secure: this.configService.get<number>('mail.port') === 465,
      auth: {
        user: this.configService.get<string>('mail.user'),
        pass: this.configService.get<string>('mail.password'),
      },
    });
  }

  /**
   * Envía un email simple
   */
  async enviarEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.configService.get<string>('mail.from'),
        ...options,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email enviado: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error enviando email: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Envía un email con adjuntos
   */
  async enviarEmailConAdjunto(options: EmailOptions): Promise<boolean> {
    return this.enviarEmail(options);
  }

  /**
   * Envía un email de bienvenida
   */
  async enviarEmailBienvenida(nombre: string, email: string): Promise<boolean> {
    const subject = '¡Bienvenido a nuestro sistema de donaciones!';
    const html = `
      <h1>¡Bienvenido, ${nombre}!</h1>
      <p>Gracias por registrarte en nuestro sistema de donaciones.</p>
      <p>Ahora podrás:</p>
      <ul>
        <li>Realizar donaciones de forma rápida y segura</li>
        <li>Configurar donaciones recurrentes</li>
        <li>Acceder a tu historial de donaciones</li>
        <li>Descargar tus comprobantes y facturas</li>
      </ul>
      <p>Si tienes cualquier duda, no dudes en contactarnos.</p>
      <p>¡Gracias por tu apoyo!</p>
    `;

    return this.enviarEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Envía un email de confirmación de donación
   */
  async enviarConfirmacionDonacion(email: string, monto: number, campana: string, impacto: string): Promise<boolean> {
    const subject = 'Confirmación de donación';
    const html = `
      <h1>¡Gracias por tu donación!</h1>
      <p>Hemos recibido tu donación de $${monto} para la campaña "${campana}".</p>
      <p><strong>Impacto de tu donación:</strong> ${impacto}</p>
      <p>Adjunto encontrarás el comprobante de tu donación.</p>
      <p>¡Gracias por tu generosidad!</p>
    `;

    return this.enviarEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Envía un email para restablecer contraseña
   */
  async enviarEmailRestablecerPassword(email: string, token: string, nombre: string): Promise<boolean> {
    const resetUrl = `${this.configService.get<string>('app.frontendUrl')}/resetear-password?token=${token}`;
    const subject = 'Restablecimiento de contraseña';
    const html = `
      <h1>Hola, ${nombre}</h1>
      <p>Has solicitado restablecer tu contraseña.</p>
      <p>Por favor, haz clic en el siguiente enlace para crear una nueva contraseña:</p>
      <p><a href="${resetUrl}">Restablecer mi contraseña</a></p>
      <p>Este enlace expirará en 1 hora.</p>
      <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
    `;

    return this.enviarEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Envía un recordatorio de suscripción próxima a renovarse
   */
  async enviarRecordatorioSuscripcion(email: string, nombre: string, monto: number, frecuencia: string, fechaRenovacion: Date): Promise<boolean> {
    const subject = 'Recordatorio de próxima donación recurrente';
    const html = `
      <h1>Recordatorio de donación recurrente</h1>
      <p>Hola, ${nombre}:</p>
      <p>Queremos recordarte que tu donación recurrente de $${monto} (${frecuencia.toLowerCase()}) se renovará el día ${fechaRenovacion.toLocaleDateString()}.</p>
      <p>No necesitas hacer nada, el pago se procesará automáticamente.</p>
      <p>Si deseas modificar o cancelar tu donación recurrente, puedes hacerlo desde tu panel de usuario.</p>
      <p>¡Gracias por tu apoyo continuo!</p>
    `;

    return this.enviarEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Envía un email de resumen mensual de donaciones
   */
  async enviarResumenMensual(email: string, nombre: string, donaciones: any[], totalDonado: number, impactoTotal: string): Promise<boolean> {
    const subject = 'Resumen mensual de tus donaciones';
    
    // Crear tabla HTML de donaciones
    let tablaDonaciones = `
      <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%;">
        <tr>
          <th>Fecha</th>
          <th>Campaña</th>
          <th>Monto</th>
        </tr>
    `;
    
    donaciones.forEach(donacion => {
      tablaDonaciones += `
        <tr>
          <td>${new Date(donacion.fecha_donacion).toLocaleDateString()}</td>
          <td>${donacion.campana ? donacion.campana.nombre : 'Donación general'}</td>
          <td>$${donacion.monto}</td>
        </tr>
      `;
    });
    
    tablaDonaciones += '</table>';
    
    const html = `
      <h1>Resumen mensual de donaciones</h1>
      <p>Hola, ${nombre}:</p>
      <p>Aquí tienes el resumen de tus donaciones del último mes:</p>
      
      ${tablaDonaciones}
      
      <p><strong>Total donado este mes:</strong> $${totalDonado}</p>
      <p><strong>Impacto acumulado:</strong> ${impactoTotal}</p>
      
      <p>¡Gracias por tu generosidad y apoyo continuo!</p>
    `;

    return this.enviarEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Envía un email de actualización de campaña a seguidores
   */
  async enviarActualizacionCampana(emails: string[], nombreCampana: string, actualizacion: string, porcentajeCompletado: number): Promise<boolean> {
    const subject = `Actualización de la campaña: ${nombreCampana}`;
    const html = `
      <h1>Actualización de campaña</h1>
      <p>Queremos mantenerte informado sobre el progreso de la campaña "${nombreCampana}"</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p>${actualizacion}</p>
      </div>
      
      <div style="background-color: #e8f4f8; padding: 10px; border-radius: 5px;">
        <p><strong>Progreso actual:</strong> ${porcentajeCompletado}% completado</p>
        <div style="background-color: #ddd; border-radius: 10px; height: 20px; width: 100%;">
          <div style="background-color: #4CAF50; border-radius: 10px; height: 20px; width: ${porcentajeCompletado}%;"></div>
        </div>
      </div>
      
      <p>Gracias por seguir esta campaña y por tu apoyo.</p>
    `;

    return this.enviarEmail({
      to: emails,
      subject,
      html,
    });
  }

  /**
   * Envía un email de factura
   */
  async enviarFactura(email: string, numeroFactura: string, monto: number, adjuntoPath: string): Promise<boolean> {
    const subject = `Factura ${numeroFactura}`;
    const html = `
      <h1>Tu factura está lista</h1>
      <p>Estimado cliente:</p>
      <p>Adjunto encontrarás la factura ${numeroFactura} por un monto de $${monto}.</p>
      <p>Gracias por tu donación.</p>
    `;

    return this.enviarEmailConAdjunto({
      to: email,
      subject,
      html,
      attachments: [
        {
          filename: `Factura-${numeroFactura}.pdf`,
          path: adjuntoPath,
          contentType: 'application/pdf',
        },
      ],
    });
  }
}