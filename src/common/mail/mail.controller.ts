import { Controller, Post, Body, Get, Param, Query, HttpStatus, HttpException } from '@nestjs/common';
import { MailService } from '../services/mail.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';


// DTOs para las solicitudes
class EmailBaseDto {
  email: string;
}

class BienvenidaDto extends EmailBaseDto {
  nombre: string;
}

class DonacionDto extends EmailBaseDto {
  monto: number;
  campana: string;
  impacto: string;
}

class ResetPasswordDto extends EmailBaseDto {
  token: string;
  nombre: string;
}

class RecordatorioSuscripcionDto extends EmailBaseDto {
  nombre: string;
  monto: number;
  frecuencia: string;
  fechaRenovacion: Date;
}

class ResumenMensualDto extends EmailBaseDto {
  nombre: string;
  donaciones: any[];
  totalDonado: number;
  impactoTotal: string;
}

class ActualizacionCampanaDto {
  emails: string[];
  nombreCampana: string;
  actualizacion: string;
  porcentajeCompletado: number;
}

class FacturaDto extends EmailBaseDto {
  numeroFactura: string;
  monto: number;
  adjuntoPath: string;
}

// Definición de la respuesta genérica
class GenericResponse {
  mensaje: string;
}

@ApiTags('Correos')
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('bienvenida')
  @ApiOperation({ summary: 'Enviar correo de bienvenida a un usuario nuevo' })
  @ApiBody({ type: BienvenidaDto, description: 'Datos del usuario para el correo de bienvenida' })
  @ApiResponse({ status: 200, description: 'Correo enviado correctamente', type: GenericResponse })
  @ApiResponse({ status: 500, description: 'Error al enviar el correo' })
  async enviarBienvenida(@Body() dto: BienvenidaDto) {
    const resultado = await this.mailService.enviarEmailBienvenida(dto.nombre, dto.email);
    if (!resultado) {
      throw new HttpException('Error al enviar el correo de bienvenida', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return { mensaje: 'Correo de bienvenida enviado correctamente' };
  }

  @Post('confirmacion-donacion')
  @ApiOperation({ summary: 'Enviar confirmación de donación' })
  @ApiBody({ type: DonacionDto, description: 'Datos de la donación realizada' })
  @ApiResponse({ status: 200, description: 'Confirmación enviada correctamente', type: GenericResponse })
  @ApiResponse({ status: 500, description: 'Error al enviar la confirmación' })
  async enviarConfirmacionDonacion(@Body() dto: DonacionDto) {
    const resultado = await this.mailService.enviarConfirmacionDonacion(
      dto.email,
      dto.monto,
      dto.campana,
      dto.impacto
    );
    if (!resultado) {
      throw new HttpException('Error al enviar la confirmación de donación', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return { mensaje: 'Confirmación de donación enviada correctamente' };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Enviar correo para restablecer contraseña' })
  @ApiBody({ type: ResetPasswordDto, description: 'Datos para el restablecimiento de contraseña' })
  @ApiResponse({ status: 200, description: 'Correo de restablecimiento enviado correctamente', type: GenericResponse })
  @ApiResponse({ status: 500, description: 'Error al enviar el correo de restablecimiento' })
  async enviarResetPassword(@Body() dto: ResetPasswordDto) {
    const resultado = await this.mailService.enviarEmailRestablecerPassword(
      dto.email,
      dto.token,
      dto.nombre
    );
    if (!resultado) {
      throw new HttpException('Error al enviar el correo de restablecimiento de contraseña', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return { mensaje: 'Correo de restablecimiento de contraseña enviado correctamente' };
  }

  @Post('recordatorio-suscripcion')
  @ApiOperation({ summary: 'Enviar recordatorio de suscripción próxima a renovarse' })
  @ApiBody({ type: RecordatorioSuscripcionDto, description: 'Datos de la suscripción para el recordatorio' })
  @ApiResponse({ status: 200, description: 'Recordatorio enviado correctamente', type: GenericResponse })
  @ApiResponse({ status: 500, description: 'Error al enviar el recordatorio' })
  async enviarRecordatorio(@Body() dto: RecordatorioSuscripcionDto) {
    const resultado = await this.mailService.enviarRecordatorioSuscripcion(
      dto.email,
      dto.nombre,
      dto.monto,
      dto.frecuencia,
      dto.fechaRenovacion
    );
    if (!resultado) {
      throw new HttpException('Error al enviar el recordatorio de suscripción', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return { mensaje: 'Recordatorio de suscripción enviado correctamente' };
  }

  @Post('resumen-mensual')
  @ApiOperation({ summary: 'Enviar resumen mensual de donaciones' })
  @ApiBody({ type: ResumenMensualDto, description: 'Datos para el resumen mensual de donaciones' })
  @ApiResponse({ status: 200, description: 'Resumen enviado correctamente', type: GenericResponse })
  @ApiResponse({ status: 500, description: 'Error al enviar el resumen' })
  async enviarResumen(@Body() dto: ResumenMensualDto) {
    const resultado = await this.mailService.enviarResumenMensual(
      dto.email,
      dto.nombre,
      dto.donaciones,
      dto.totalDonado,
      dto.impactoTotal
    );
    if (!resultado) {
      throw new HttpException('Error al enviar el resumen mensual', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return { mensaje: 'Resumen mensual enviado correctamente' };
  }

  @Post('actualizacion-campana')
  @ApiOperation({ summary: 'Enviar actualización de campaña a seguidores' })
  @ApiBody({ type: ActualizacionCampanaDto, description: 'Datos de la actualización de campaña' })
  @ApiResponse({ status: 200, description: 'Actualización enviada correctamente', type: GenericResponse })
  @ApiResponse({ status: 500, description: 'Error al enviar la actualización' })
  async enviarActualizacion(@Body() dto: ActualizacionCampanaDto) {
    const resultado = await this.mailService.enviarActualizacionCampana(
      dto.emails,
      dto.nombreCampana,
      dto.actualizacion,
      dto.porcentajeCompletado
    );
    if (!resultado) {
      throw new HttpException('Error al enviar la actualización de campaña', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return { mensaje: 'Actualización de campaña enviada correctamente' };
  }

  @Post('email-generico')
  @ApiOperation({ summary: 'Enviar email genérico' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          description: 'Correo electrónico del destinatario o array de correos',
          example: 'usuario@ejemplo.com'
        },
        subject: {
          type: 'string',
          description: 'Asunto del correo',
          example: 'Información importante'
        },
        text: {
          type: 'string',
          description: 'Contenido en texto plano (opcional)',
          example: 'Este es un mensaje de prueba'
        },
        html: {
          type: 'string',
          description: 'Contenido en formato HTML (opcional)',
          example: '<h1>Mensaje de prueba</h1><p>Este es un mensaje de prueba</p>'
        },
        attachments: {
          type: 'array',
          description: 'Array de archivos adjuntos (opcional)',
          items: {
            type: 'object',
            properties: {
              filename: {
                type: 'string',
                description: 'Nombre del archivo',
                example: 'documento.pdf'
              },
              path: {
                type: 'string',
                description: 'Ruta del archivo',
                example: '/ruta/al/archivo/documento.pdf'
              },
              contentType: {
                type: 'string',
                description: 'Tipo MIME del archivo (opcional)',
                example: 'application/pdf'
              }
            }
          }
        }
      },
      required: ['to', 'subject']
    }
  })
  @ApiResponse({ status: 200, description: 'Correo enviado correctamente', type: GenericResponse })
  @ApiResponse({ status: 500, description: 'Error al enviar el correo' })
  async enviarEmailGenerico(
    @Body() 
    options: {
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
  ) {
    const resultado = await this.mailService.enviarEmail(options);
    if (!resultado) {
      throw new HttpException('Error al enviar el correo genérico', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return { mensaje: 'Correo enviado correctamente' };
  }
}