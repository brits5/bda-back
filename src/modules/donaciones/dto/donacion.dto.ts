import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsEnum, IsOptional, IsBoolean, Min, IsArray, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

export class CrearDonacionDto {
  @ApiProperty({ example: 50, description: 'Monto de la donación' })
  @IsNumber()
  @Min(1, { message: 'El monto debe ser mayor a 0' })
  @Type(() => Number)
  monto: number;

  @ApiProperty({ example: 2, description: 'ID de la campaña (opcional)', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  id_campana?: number;

  @ApiProperty({ 
    example: 'PLUX', 
    description: 'Método de pago', 
    enum: ['Tarjeta', 'PLUX', 'PayPal'] 
  })
  @IsEnum(['Tarjeta', 'PLUX', 'PayPal'], { message: 'Método de pago no válido' })
  metodo_pago: string;

  @ApiProperty({ 
    example: 'plux_token_123456', 
    description: 'Token o referencia de pago obtenido del proveedor' 
  })
  @IsString()
  @IsNotEmpty()
  referencia_pago: string;

  @ApiProperty({ example: 'usuario@ejemplo.com', description: 'Correo para enviar comprobante', required: false })
  @IsOptional()
  @IsEmail({}, { message: 'Correo electrónico no válido' })
  correo_comprobante?: string;

  @ApiProperty({ example: true, description: 'Aceptación de términos y condiciones' })
  @IsBoolean()
  acepto_terminos: boolean;

  @ApiProperty({ example: false, description: 'Aceptación para recibir noticias', required: false })
  @IsOptional()
  @IsBoolean()
  acepto_noticias?: boolean;

  @ApiProperty({ example: false, description: 'Indicador si la donación es anónima', required: false })
  @IsOptional()
  @IsBoolean()
  es_anonima?: boolean;

  @ApiProperty({ example: true, description: 'Indicador si requiere factura', required: false })
  @IsOptional()
  @IsBoolean()
  requiere_factura?: boolean;

  @ApiProperty({ description: 'ID de usuario (para usuarios registrados)', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  id_usuario?: number;
}

export class PluxPagoResponseDto {
  @ApiProperty({ example: 'success', description: 'Estado de la transacción' })
  status: string;

  @ApiProperty({ example: 'tx_12345', description: 'ID de transacción de PLUX' })
  transaction_id: string;

  @ApiProperty({ example: 'Tarjeta', description: 'Método de pago utilizado' })
  payment_method: string;

  @ApiProperty({ example: '1234', description: 'Últimos dígitos de la tarjeta (para pagos con tarjeta)' })
  last_digits?: string;

  @ApiProperty({ example: 'Banco Ejemplo', description: 'Banco emisor (para pagos con tarjeta)' })
  bank_name?: string;
}

export class WebhookPluxDto {
  @ApiProperty({ example: 'payment.success', description: 'Tipo de evento' })
  event: string;

  @ApiProperty({ description: 'Datos de la transacción' })
  data: {
    transaction_id: string;
    status: string;
    amount: number;
    reference: string;
    payment_method: string;
  };

  @ApiProperty({ example: '2023-05-16T10:30:00Z', description: 'Fecha y hora del evento' })
  timestamp: string;
}