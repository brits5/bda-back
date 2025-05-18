import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsEmail, IsOptional, IsBoolean, IsEnum, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';


export class CrearDatosFiscalesDto {
  @ApiProperty({ example: 'PEJM850615H01', description: 'RFC o identificación fiscal' })
  @IsString()
  @MinLength(3, { message: 'El RFC debe tener al menos 3 caracteres' })
  rfc: string;

  @ApiProperty({ example: 'Juan Pérez Molina', description: 'Razón social o nombre completo' })
  @IsString()
  @MinLength(3, { message: 'La razón social debe tener al menos 3 caracteres' })
  razon_social: string;

  @ApiProperty({ 
    example: 'Av. Principal 123, Quito', 
    description: 'Dirección fiscal', 
    required: false 
  })
  @IsOptional()
  @IsString()
  direccion_fiscal?: string;

  @ApiProperty({ 
    example: 'facturas.juan@ejemplo.com', 
    description: 'Correo para facturación', 
    required: false 
  })
  @IsOptional()
  @IsEmail({}, { message: 'Correo electrónico no válido' })
  correo_facturacion?: string;

  @ApiProperty({ 
    example: true, 
    description: 'Requiere CFDI o documento fiscal electrónico', 
    required: false 
  })
  @IsOptional()
  @IsBoolean()
  requiere_cfdi?: boolean;
}

export class SolicitarFacturaDto {
  @ApiProperty({ example: 1, description: 'ID de la donación a facturar' })
  @IsNumber()
  @Type(() => Number)
  id_donacion: number;

  @ApiProperty({ description: 'Datos fiscales para la factura' })
  @ValidateNested()  // Añade este decorador
  @Type(() => CrearDatosFiscalesDto)  // Añade este decorador
  datos_fiscales: CrearDatosFiscalesDto;
}

export class ConsultarFacturaDto {
  @ApiProperty({ example: 'FAC-2023-00001', description: 'Número de factura' })
  @IsString()
  numero_factura: string;

  @ApiProperty({ example: 'PEJM850615H01', description: 'RFC del receptor', required: false })
  @IsOptional()
  @IsString()
  rfc?: string;
}