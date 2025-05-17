import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsEnum, IsBoolean, IsNumber, MinLength, IsDate, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class ActualizarUsuarioDto {
  @ApiProperty({ example: 'Juan', description: 'Nombres del usuario', required: false })
  @IsOptional()
  @IsString()
  nombres?: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellidos del usuario', required: false })
  @IsOptional()
  @IsString()
  apellidos?: string;

  @ApiProperty({ example: '0912345678', description: 'Cédula o identificación fiscal', required: false })
  @IsOptional()
  @IsString()
  cedula?: string;

  @ApiProperty({ example: '1985-06-15', description: 'Fecha de nacimiento', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fecha_nacimiento?: Date;

  @ApiProperty({ example: 'Av. Principal 123', description: 'Dirección', required: false })
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiProperty({ example: 'Quito', description: 'Ciudad', required: false })
  @IsOptional()
  @IsString()
  ciudad?: string;

  @ApiProperty({ example: 'Pichincha', description: 'Provincia', required: false })
  @IsOptional()
  @IsString()
  provincia?: string;

  @ApiProperty({ example: '0991234567', description: 'Número telefónico', required: false })
  @IsOptional()
  @IsString()
  telefono?: string;
}

export class CambiarPasswordDto {
  @ApiProperty({ example: 'password123', description: 'Contraseña actual' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password_actual: string;

  @ApiProperty({ example: 'newpassword456', description: 'Nueva contraseña' })
  @IsString()
  @MinLength(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres' })
  password_nueva: string;

  @ApiProperty({ example: 'newpassword456', description: 'Confirmación de nueva contraseña' })
  @IsString()
  password_confirmacion: string;
}

export class CrearNotificacionDto {
  @ApiProperty({ example: 1, description: 'ID del usuario destinatario' })
  @IsNumber()
  @Type(() => Number)
  id_usuario: number;

  @ApiProperty({ 
    example: 'Donacion', 
    description: 'Tipo de notificación',
    enum: ['Donacion', 'Suscripcion', 'Campana', 'Sistema'] 
  })
  @IsEnum(['Donacion', 'Suscripcion', 'Campana', 'Sistema'], { message: 'Tipo de notificación no válido' })
  tipo: string;

  @ApiProperty({ example: 'Donación procesada con éxito', description: 'Título de la notificación' })
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @ApiProperty({ 
    example: 'Tu donación de $50.00 a la campaña "Ayuda a niños en situación de calle" ha sido procesada exitosamente.', 
    description: 'Mensaje de la notificación' 
  })
  @IsString()
  @IsNotEmpty()
  mensaje: string;
}

export class EnviarResumenDto {
  @ApiProperty({ example: 'mayo', description: 'Mes para el resumen (opcional)', required: false })
  @IsOptional()
  @IsString()
  mes?: string;

  @ApiProperty({ example: 2024, description: 'Año para el resumen (opcional)', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  ano?: number;
}