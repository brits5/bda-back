import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsEmail, IsOptional, IsBoolean, IsDate, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CrearMetodoPagoDto {
  @ApiProperty({ 
    example: 'Tarjeta', 
    description: 'Tipo de método de pago', 
    enum: ['Tarjeta', 'PLUX', 'PayPal'] 
  })
  @IsString()
  @IsNotEmpty()
  tipo: string;

  @ApiProperty({ example: 'tok_visa_encriptado123', description: 'Token de referencia del método de pago' })
  @IsString()
  @IsNotEmpty()
  token_referencia: string;

  @ApiProperty({ example: 'Mi Visa Principal', description: 'Alias o nombre amigable', required: false })
  @IsOptional()
  @IsString()
  alias?: string;

  @ApiProperty({ example: '4321', description: 'Últimos dígitos (para tarjetas)', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(4)
  ultimo_digitos?: string;

  @ApiProperty({ example: 'Banco Pichincha', description: 'Nombre del banco (para tarjetas)', required: false })
  @IsOptional()
  @IsString()
  banco?: string;

  @ApiProperty({ example: 'Corriente', description: 'Tipo de cuenta', required: false })
  @IsOptional()
  @IsString()
  tipo_cuenta?: string;
}