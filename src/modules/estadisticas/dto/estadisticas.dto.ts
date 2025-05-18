import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsDate, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ObtenerEstadisticasDto {
  @ApiProperty({ example: '2023-01-01', description: 'Fecha de inicio para el período', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fechaInicio?: Date;

  @ApiProperty({ example: '2023-12-31', description: 'Fecha de fin para el período', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fechaFin?: Date;

  @ApiProperty({ example: true, description: 'Incluir estadísticas por campaña', required: false })
  @IsOptional()
  @Type(() => Boolean)
  incluirCampanas?: boolean;

  @ApiProperty({ example: true, description: 'Incluir estadísticas de donantes', required: false })
  @IsOptional()
  @Type(() => Boolean)
  incluirDonantes?: boolean;
}