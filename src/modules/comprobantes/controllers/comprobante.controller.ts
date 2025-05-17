import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    Res,
    Query,
    UseGuards,
    Req,
    HttpStatus,
    BadRequestException,
    NotFoundException,
    StreamableFile,
  } from '@nestjs/common';
  import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
  import { Response } from 'express';
  import { createReadStream } from 'fs';
  import { join } from 'path';
  import { ComprobantesService } from '../services/comprobantes.service';
  import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
  import { RoleGuard } from '../../auth/guards/role.guard';
  import { ConfigService } from '@nestjs/config';
  
  @ApiTags('comprobantes')
  @Controller('comprobantes')
  export class ComprobantesController {
    constructor(
      private readonly comprobantesService: ComprobantesService,
      private readonly configService: ConfigService,
    ) {}
  
    @ApiOperation({ summary: 'Obtener un comprobante por ID' })
    @ApiParam({ name: 'id', description: 'ID del comprobante' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Comprobante encontrado',
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Comprobante no encontrado',
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async findOne(@Param('id') id: number, @Req() req) {
      const comprobante = await this.comprobantesService.findOne(id);
      
      // Verificar si el comprobante pertenece al usuario
      if (
        comprobante.donacion.id_usuario &&
        comprobante.donacion.id_usuario !== req.user.userId &&
        req.user.role !== 'admin'
      ) {
        throw new BadRequestException('No tienes permisos para ver este comprobante');
      }
      
      return comprobante;
    }
  
    @ApiOperation({ summary: 'Obtener un comprobante por código único' })
    @ApiParam({ name: 'codigo', description: 'Código único del comprobante' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Comprobante encontrado',
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Comprobante no encontrado',
    })
    @Get('codigo/:codigo')
    async findByCode(@Param('codigo') codigo: string) {
      return this.comprobantesService.findByCodigoUnico(codigo);
    }
    /*
    @ApiOperation({ summary: 'Descargar un comprobante en PDF' })
    @ApiParam({ name: 'id', description: 'ID del comprobante' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Archivo PDF del comprobante',
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Comprobante no encontrado',
    })
    @Get(':id/pdf')
    async downloadPdf(@Param('id') id: number, @Res({ passthrough: true }) res: Response) {
      const comprobante = await this.comprobantesService.findOne(id);
      
      // Construir ruta al archivo PDF
      const storagePath = this.configService.get<string>('storage.path');
      const filePath = join(storagePath, comprobante.url_pdf.substring(1));
      
      try {
        const fileStream = createReadStream(filePath);
        
        // Configurar headers para descarga
        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${comprobante.codigo_unico}.pdf"`,
        });
        
        return new StreamableFile(fileStream);
      } catch (error) {
        throw new NotFoundException('Archivo de comprobante no encontrado');
      }
    }
  
    @ApiOperation({ summary: 'Reenviar un comprobante por email' })
    @ApiParam({ name: 'id', description: 'ID del comprobante' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Comprobante reenviado exitosamente',
    })
    @ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Error al reenviar el comprobante',
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post(':id/reenviar')
    async resendComprobante(
      @Param('id') id: number,
      @Body() data: { correo: string },
      @Req() req,
    ) {
      const comprobante = await this.comprobantesService.findOne(id);
      
      // Verificar si el comprobante pertenece al usuario
      if (
        comprobante.donacion.id_usuario &&
        comprobante.donacion.id_usuario !== req.user.userId &&
        req.user.role !== 'admin'
      ) {
        throw new BadRequestException('No tienes permisos para reenviar este comprobante');
      }
      
      const resultado = await this.comprobantesService.reenviarComprobante(id, data.correo);
      
      if (resultado) {
        return { mensaje: 'Comprobante reenviado exitosamente' };
      } else {
        throw new BadRequestException('Error al reenviar el comprobante');
      }
    }
  
    @ApiOperation({ summary: 'Verificar un comprobante (público)' })
    @ApiQuery({ name: 'codigo', description: 'Código único del comprobante' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Resultado de la verificación',
    })
    @Get('verificar')
    async verificarComprobante(@Query('codigo') codigo: string) {
      try {
        const comprobante = await this.comprobantesService.findByCodigoUnico(codigo);
        
        return {
          verificado: true,
          comprobante: {
            codigo: comprobante.codigo_unico,
            fecha: comprobante.fecha_emision,
            monto: comprobante.donacion.monto,
            campana: comprobante.donacion.campana?.nombre || 'Donación general',
          },
        };
      } catch (error) {
        return {
          verificado: false,
          mensaje: 'Comprobante no encontrado o inválido',
        };
      }
    }
  
    @ApiOperation({ summary: 'Generar comprobante manualmente (admin)' })
    @ApiParam({ name: 'idDonacion', description: 'ID de la donación' })
    @ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Comprobante generado exitosamente',
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Post('generar/:idDonacion')
    async generarComprobante(@Param('idDonacion') idDonacion: number) {
      const comprobante = await this.comprobantesService.generarComprobante(idDonacion);
      
      return {
        mensaje: 'Comprobante generado exitosamente',
        comprobante,
      };
    }
      */
  }