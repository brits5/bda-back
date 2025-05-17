import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'usuario@ejemplo.com', description: 'Correo electrónico del usuario' })
  @IsEmail({}, { message: 'Debe proporcionar un correo electrónico válido' })
  correo: string;

  @ApiProperty({ example: 'password123', description: 'Contraseña del usuario' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'Juan', description: 'Nombres del usuario' })
  @IsString()
  nombres: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellidos del usuario' })
  @IsString()
  apellidos: string;

  @ApiProperty({ example: 'usuario@ejemplo.com', description: 'Correo electrónico del usuario' })
  @IsEmail({}, { message: 'Debe proporcionar un correo electrónico válido' })
  correo: string;

  @ApiProperty({ example: 'password123', description: 'Contraseña del usuario' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiProperty({ example: '0912345678', description: 'Cédula o identificación fiscal', required: false })
  @IsOptional()
  @IsString()
  cedula?: string;

  @ApiProperty({ example: '0991234567', description: 'Número telefónico', required: false })
  @IsOptional()
  @IsString()
  telefono?: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token válido' })
  @IsString()
  refreshToken: string;
}

export class ResetPasswordRequestDto {
  @ApiProperty({ example: 'usuario@ejemplo.com', description: 'Correo electrónico del usuario' })
  @IsEmail({}, { message: 'Debe proporcionar un correo electrónico válido' })
  correo: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token de recuperación de contraseña' })
  @IsString()
  token: string;

  @ApiProperty({ description: 'Nueva contraseña' })
  @IsString()
  @MinLength(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres' })
  password: string;
}