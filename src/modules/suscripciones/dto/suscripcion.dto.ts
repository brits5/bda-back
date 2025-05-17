import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsEnum, IsOptional, IsBoolean, Min, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CrearSuscripcionDto {
  @ApiProperty({ example: 20, description: 'Monto de la suscripción' })
  @IsNumber()
  @Min(1, { message: 'El monto debe ser mayor a 0' })
  @Type(() => Number)
  monto: number;

  @ApiProperty({ 
    example: 'Mensual', 
    description: 'Frecuencia de la suscripción', 
    enum: ['Mensual', 'Trimestral', 'Anual'] 
  })
  @IsEnum(['Mensual', 'Trimestral', 'Anual'], { message: 'Frecuencia no válida' })
  frecuencia: string;

  @ApiProperty({ example: 2, description: 'ID de la campaña (opcional)', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  id_campana?: number;

  @ApiProperty({ example: 1, description: 'ID del método de pago a utilizar' })
  @IsNumber()
  @Type(() => Number)
  id_metodo_pago: number;

  @ApiProperty({ example: '2023-06-01', description: 'Fecha de inicio (opcional)', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fecha_inicio?: Date;

  @ApiProperty({ example: '2024-06-01', description: 'Fecha de fin (opcional)', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fecha_fin?: Date;
}

export class ActualizarSuscripcionDto {
  @ApiProperty({ example: 25, description: 'Nuevo monto de la suscripción', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'El monto debe ser mayor a 0' })
  @Type(() => Number)
  monto?: number;

  @ApiProperty({ 
    example: 'Trimestral', 
    description: 'Nueva frecuencia de la suscripción', 
    enum: ['Mensual', 'Trimestral', 'Anual'],
    required: false 
  })
  @IsOptional()
  @IsEnum(['Mensual', 'Trimestral', 'Anual'], { message: 'Frecuencia no válida' })
  frecuencia?: string;

  @ApiProperty({ example: 2, description: 'Nuevo ID del método de pago', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  id_metodo_pago?: number;

  @ApiProperty({ 
    example: 'Pausada', 
    description: 'Nuevo estado de la suscripción', 
    enum: ['Activa', 'Pausada', 'Cancelada'],
    required: false 
  })
  @IsOptional()
  @IsEnum(['Activa', 'Pausada', 'Cancelada'], { message: 'Estado no válido' })
  estado?: string;

  @ApiProperty({ example: '2024-06-01', description: 'Nueva fecha de fin', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fecha_fin?: Date;
}

export class CancelarSuscripcionDto {
  @ApiProperty({ example: 'Cambio a otra organización', description: 'Motivo de la cancelación', required: false })
  @IsOptional()
  @IsString()
  motivo?: string;
}