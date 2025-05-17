import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional, IsBoolean, IsDate, Min, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CrearCampanaDto {
  @ApiProperty({ example: 'Ayuda a niños en situación de calle', description: 'Nombre de la campaña' })
  @IsString()
  @MinLength(5, { message: 'El nombre debe tener al menos 5 caracteres' })
  @MaxLength(255, { message: 'El nombre no puede exceder los 255 caracteres' })
  nombre: string;

  @ApiProperty({ 
    example: 'Proporcionar alimentos y educación a niños en situación de calle', 
    description: 'Descripción de la campaña', 
    required: false 
  })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ example: '/img/campanas/ninos.jpg', description: 'URL de la imagen', required: false })
  @IsOptional()
  @IsString()
  imagen_url?: string;

  @ApiProperty({ example: 50000, description: 'Meta de monto a recaudar' })
  @IsNumber()
  @Min(0, { message: 'La meta debe ser un valor positivo' })
  @Type(() => Number)
  meta_monto: number;

  @ApiProperty({ example: false, description: 'Indicador si es campaña de emergencia', required: false })
  @IsOptional()
  @IsBoolean()
  es_emergencia?: boolean;

  @ApiProperty({ example: '2023-06-01', description: 'Fecha de inicio de la campaña' })
  @IsDate()
  @Type(() => Date)
  fecha_inicio: Date;

  @ApiProperty({ example: '2023-12-31', description: 'Fecha de fin de la campaña', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fecha_fin?: Date;

  @ApiProperty({ 
    example: '$20 = Kit escolar completo para 1 niño', 
    description: 'Descripción del impacto de la donación', 
    required: false 
  })
  @IsOptional()
  @IsString()
  impacto_descripcion?: string;
}

export class ActualizarCampanaDto {
  @ApiProperty({ example: 'Ayuda a niños - URGENTE', description: 'Nuevo nombre', required: false })
  @IsOptional()
  @IsString()
  @MinLength(5, { message: 'El nombre debe tener al menos 5 caracteres' })
  @MaxLength(255, { message: 'El nombre no puede exceder los 255 caracteres' })
  nombre?: string;

  @ApiProperty({ example: 'Nueva descripción', description: 'Nueva descripción', required: false })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ example: '/img/campanas/nuevo.jpg', description: 'Nueva URL de imagen', required: false })
  @IsOptional()
  @IsString()
  imagen_url?: string;

  @ApiProperty({ example: 75000, description: 'Nueva meta de recaudación', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'La meta debe ser un valor positivo' })
  @Type(() => Number)
  meta_monto?: number;

  @ApiProperty({ example: true, description: 'Nuevo estado de emergencia', required: false })
  @IsOptional()
  @IsBoolean()
  es_emergencia?: boolean;

  @ApiProperty({ example: '2024-01-31', description: 'Nueva fecha de fin', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fecha_fin?: Date;

  @ApiProperty({ 
    example: 'Finalizada', 
    description: 'Nuevo estado de la campaña', 
    enum: ['Activa', 'Finalizada', 'Cancelada'],
    required: false 
  })
  @IsOptional()
  @IsString()
  estado?: string;

  @ApiProperty({ example: '$25 = Nuevo impacto', description: 'Nueva descripción de impacto', required: false })
  @IsOptional()
  @IsString()
  impacto_descripcion?: string;
}