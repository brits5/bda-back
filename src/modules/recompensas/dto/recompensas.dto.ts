import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsEnum, IsOptional, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CrearRecompensaDto {
  @ApiProperty({ example: 'Insignia Donante Plata', description: 'Nombre de la recompensa' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: 'Reconocimiento por acumular 200 puntos de donación', description: 'Descripción de la recompensa' })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ example: 200, description: 'Puntos requeridos para obtener la recompensa' })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  puntos_requeridos: number;

  @ApiProperty({ 
    example: 'Insignia', 
    description: 'Tipo de recompensa', 
    enum: ['Insignia', 'Certificado', 'Experiencia', 'Descuento'] 
  })
  @IsEnum(['Insignia', 'Certificado', 'Experiencia', 'Descuento'])
  tipo: string;

  @ApiProperty({ example: '/img/recompensas/insignia-plata.png', description: 'URL de la imagen', required: false })
  @IsOptional()
  @IsString()
  imagen_url?: string;

  @ApiProperty({ example: true, description: 'Indica si la recompensa está activa', default: true })
  @IsOptional()
  @IsBoolean()
  activa?: boolean;

  @ApiProperty({ example: 50, description: 'Cantidad disponible (null = ilimitada)', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  cantidad_disponible?: number;
}

export class ActualizarRecompensaDto {
  @ApiProperty({ example: 'Insignia Donante Oro', description: 'Nuevo nombre de la recompensa', required: false })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiProperty({ example: 'Reconocimiento por acumular 500 puntos de donación', description: 'Nueva descripción', required: false })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ example: 500, description: 'Nuevos puntos requeridos', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  puntos_requeridos?: number;

  @ApiProperty({ 
    example: 'Certificado', 
    description: 'Nuevo tipo', 
    enum: ['Insignia', 'Certificado', 'Experiencia', 'Descuento'],
    required: false 
  })
  @IsOptional()
  @IsEnum(['Insignia', 'Certificado', 'Experiencia', 'Descuento'])
  tipo?: string;

  @ApiProperty({ example: '/img/recompensas/insignia-oro.png', description: 'Nueva URL de imagen', required: false })
  @IsOptional()
  @IsString()
  imagen_url?: string;

  @ApiProperty({ example: false, description: 'Nuevo estado', required: false })
  @IsOptional()
  @IsBoolean()
  activa?: boolean;

  @ApiProperty({ example: 25, description: 'Nueva cantidad disponible', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  cantidad_disponible?: number;
}

export class AsignarRecompensaDto {
  @ApiProperty({ example: 1, description: 'ID del usuario' })
  @IsNumber()
  @Type(() => Number)
  id_usuario: number;

  @ApiProperty({ example: 2, description: 'ID de la recompensa' })
  @IsNumber()
  @Type(() => Number)
  id_recompensa: number;

  @ApiProperty({ example: 'CERT-2023-00001', description: 'Código único para la recompensa (opcional)', required: false })
  @IsOptional()
  @IsString()
  codigo_unico?: string;

  @ApiProperty({ example: 'Entregada al usuario por email', description: 'Notas adicionales', required: false })
  @IsOptional()
  @IsString()
  notas?: string;
}