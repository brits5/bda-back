import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    Req,
    Res,
    HttpStatus,
    BadRequestException,
    NotFoundException,
    StreamableFile,
    ParseIntPipe,
  } from '@nestjs/common';
  import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
  import { Response } from 'express';
  import { createReadStream } from 'fs';
  import { join } from 'path';
  import { FacturasService } from '../services/facturas.services';
  import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
  import { CrearDatosFiscalesDto, SolicitarFacturaDto } from '../dto/factura.dto';
  import { ConfigService } from '@nestjs/config';
  
  @ApiTags('facturas')
  @Controller('facturas')
  export class FacturasController {
    constructor(
      private readonly facturasService: FacturasService,
      private readonly configService: ConfigService,
    ) {}
  
    @ApiOperation({ summary: 'Obtener una factura por ID' })
    @ApiParam({ name: 'id', description: 'ID de la factura' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Factura encontrada',
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Factura no encontrada',
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async findOne(@Param('id') id: number, @Req() req) {
      const factura = await this.facturasService.findOne(id);
      
      // Verificar si la factura pertenece al usuario
      if (
        factura.donacion.id_usuario &&
        factura.donacion.id_usuario !== req.user.userId &&
        req.user.role !== 'admin'
      ) {
        throw new BadRequestException('No tienes permisos para ver esta factura');
      }
      
      return factura;
    }
  
    @ApiOperation({ summary: 'Obtener una factura por número' })
    @ApiQuery({ name: 'numero', description: 'Número de factura' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Factura encontrada',
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Factura no encontrada',
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('buscar')
    async findByNumero(@Query('numero') numero: string, @Req() req) {
      const factura = await this.facturasService.findByNumero(numero);
      
      // Verificar si la factura pertenece al usuario
      if (
        factura.donacion.id_usuario &&
        factura.donacion.id_usuario !== req.user.userId &&
        req.user.role !== 'admin'
      ) {
        throw new BadRequestException('No tienes permisos para ver esta factura');
      }
      
      return factura;
    }
  
    @ApiOperation({ summary: 'Obtener las facturas del usuario actual' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Lista de facturas del usuario',
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('mis-facturas')
    async findUserFacturas(@Req() req) {
      return this.facturasService.findByUsuario(req.user.userId);
    }
  
    @ApiOperation({ summary: 'Descargar una factura en PDF' })
    @ApiParam({ name: 'id', description: 'ID de la factura' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Archivo PDF de la factura',
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Factura no encontrada',
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get(':id/pdf')
    async downloadPdf(@Param('id') id: number, @Res({ passthrough: true }) res: Response, @Req() req) {
      const factura = await this.facturasService.findOne(id);
      
      // Verificar si la factura pertenece al usuario
      if (
        factura.donacion.id_usuario &&
        factura.donacion.id_usuario !== req.user.userId &&
        req.user.role !== 'admin'
      ) {
        throw new BadRequestException('No tienes permisos para descargar esta factura');
      }
      
      // Construir ruta al archivo PDF
      const storagePath = this.configService.get<string>('storage.path');
      //const filePath = join(storagePath, factura.url_pdf.substring(1));
      
      try {
        //const fileStream = createReadStream(filePath);
        
        // Configurar headers para descarga
        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${factura.numero_factura}.pdf"`,
        });
        
        //return new StreamableFile(fileStream);
      } catch (error) {
        throw new NotFoundException('Archivo de factura no encontrado');
      }
    }
  
    @ApiOperation({ summary: 'Reenviar una factura por email' })
    @ApiParam({ name: 'id', description: 'ID de la factura' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Factura reenviada exitosamente',
    })
    @ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Error al reenviar la factura',
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post(':id/reenviar')
    async resendFactura(
      @Param('id') id: number,
      @Body() data: { correo: string },
      @Req() req,
    ) {
      const factura = await this.facturasService.findOne(id);
      
      // Verificar si la factura pertenece al usuario
      if (
        factura.donacion.id_usuario &&
        factura.donacion.id_usuario !== req.user.userId &&
        req.user.role !== 'admin'
      ) {
        throw new BadRequestException('No tienes permisos para reenviar esta factura');
      }
      
      const resultado = await this.facturasService.reenviarFactura(id, data.correo);
      
      if (resultado) {
        return { mensaje: 'Factura reenviada exitosamente' };
      } else {
        throw new BadRequestException('Error al reenviar la factura');
      }
    }
  
    @ApiOperation({ summary: 'Obtener los datos fiscales del usuario' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Datos fiscales del usuario',
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('datos-fiscales')
    async getDatosFiscales(@Req() req) {
      return this.facturasService.findDatosFiscalesByUsuario(req.user.userId);
    }
  
    @ApiOperation({ summary: 'Crear o actualizar datos fiscales' })
    @ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Datos fiscales creados o actualizados exitosamente',
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('datos-fiscales')
    async createDatosFiscales(@Body() datosFiscalesDto: CrearDatosFiscalesDto, @Req() req) {
      const datosFiscales = await this.facturasService.createOrUpdateDatosFiscales(
        datosFiscalesDto,
        req.user.userId,
      );
      
      return {
        mensaje: 'Datos fiscales guardados exitosamente',
        datosFiscales,
      };
    }
  
    @ApiOperation({ summary: 'Solicitar factura para una donación' })
    @ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Factura generada exitosamente',
    })
    @ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Error al generar la factura',
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('solicitar')
    async solicitarFactura(@Body() solicitarFacturaDto: SolicitarFacturaDto, @Req() req) {
      const factura = await this.facturasService.generarFacturaManual(
        solicitarFacturaDto.id_donacion,
        solicitarFacturaDto.datos_fiscales,
        req.user.userId,
      );
      
      return {
        mensaje: 'Factura generada exitosamente',
        factura,
      };
    }
  
    @ApiOperation({ summary: 'Generar factura manualmente para una donación (anónima)' })
    @ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Factura generada exitosamente',
    })
    @ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Error al generar la factura',
    })
    @Post('generar')
    async generarFacturaAnonima(@Body() solicitarFacturaDto: SolicitarFacturaDto) {
      // Para donaciones anónimas o usuarios no registrados
      const factura = await this.facturasService.generarFacturaManual(
        solicitarFacturaDto.id_donacion,
        solicitarFacturaDto.datos_fiscales,
      );
      
      return {
        mensaje: 'Factura generada exitosamente',
        factura,
      };
    }
  }