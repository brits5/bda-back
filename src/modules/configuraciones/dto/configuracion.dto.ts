import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';

export class CrearConfiguracionDto {
  @ApiProperty({ example: 'montos_predeterminados', description: 'Clave única de la configuración' })
  @IsString()
  @IsNotEmpty()
  clave: string;

  @ApiProperty({ example: '5,10,20,50,100,200', description: 'Valor de la configuración' })
  @IsString()
  @IsNotEmpty()
  valor: string;

  @ApiProperty({ example: 'Montos predeterminados para donaciones', description: 'Descripción de la configuración', required: false })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({
    example: 'texto',
    description: 'Tipo de valor de la configuración',
    enum: ['texto', 'numero', 'booleano', 'json'],
    default: 'texto',
  })
  @IsEnum(['texto', 'numero', 'booleano', 'json'], { message: 'Tipo de valor no válido' })
  @IsOptional()
  tipo?: string;

  @ApiProperty({ example: true, description: 'Indica si la configuración es editable', default: true, required: false })
  @IsOptional()
  @IsBoolean()
  editable?: boolean;
}

export class ActualizarConfiguracionDto {
  @ApiProperty({ example: '5,10,20,50,100,200', description: 'Nuevo valor de la configuración', required: false })
  @IsOptional()
  @IsString()
  valor?: string;

  @ApiProperty({ example: 'Montos predeterminados para donaciones', description: 'Nueva descripción de la configuración', required: false })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({
    example: 'texto',
    description: 'Nuevo tipo de valor de la configuración',
    enum: ['texto', 'numero', 'booleano', 'json'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['texto', 'numero', 'booleano', 'json'], { message: 'Tipo de valor no válido' })
  tipo?: string;

  @ApiProperty({ example: true, description: 'Indica si la configuración es editable', required: false })
  @IsOptional()
  @IsBoolean()
  editable?: boolean;
}

export class ObtenerValorDto {
  @ApiProperty({ example: 'montos_predeterminados', description: 'Clave de la configuración' })
  @IsString()
  @IsNotEmpty()
  clave: string;
}

export class ObtenerMultiplesDto {
  @ApiProperty({ example: 'montos_predeterminados,moneda_principal,titulo_sitio', description: 'Lista de claves separadas por coma' })
  @IsString()
  @IsNotEmpty()
  claves: string;
}