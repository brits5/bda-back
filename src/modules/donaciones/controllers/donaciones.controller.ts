import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    Req,
    DefaultValuePipe,
    ParseIntPipe,
    HttpStatus,
    HttpCode,
    BadRequestException,
  } from '@nestjs/common';
  import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
  import { DonacionesService } from '../services/donaciones.service';
  import { CrearDonacionDto } from '../dto/donacion.dto';
  
  import { Request } from 'express';
  
  @ApiTags('donaciones')
  @Controller('donaciones')
  export class DonacionesController {
    constructor(private readonly donacionesService: DonacionesService) {}
  
    @ApiOperation({ summary: 'Obtener todas las donaciones (admin)' })
    @ApiQuery({ name: 'page', required: false, description: 'Número de página', type: Number })
    @ApiQuery({ name: 'limit', required: false, description: 'Elementos por página', type: Number })
    @ApiQuery({ name: 'estado', required: false, description: 'Filtrar por estado', type: String })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Lista paginada de donaciones' 
    })
    @ApiBearerAuth()
    @Get()
    async findAll(
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
      @Query('estado') estado?: string,
    ) {
      const options = {
        page,
        limit,
        route: 'donaciones',
      };
  
      const where = {};
      if (estado) {
        where['estado'] = estado;
      }
  
      return this.donacionesService.findAll(options, where);
    }
  
    @ApiOperation({ summary: 'Obtener donaciones del usuario actual' })
    @ApiQuery({ name: 'page', required: false, description: 'Número de página', type: Number })
    @ApiQuery({ name: 'limit', required: false, description: 'Elementos por página', type: Number })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Lista paginada de donaciones del usuario' 
    })
    @ApiBearerAuth()
    @Get('mis-donaciones')
    async findMisDonaciones(
      @Req() req,
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    ) {
      const options = {
        page,
        limit,
        route: 'donaciones/mis-donaciones',
      };
  
      const where = { id_usuario: req.user.userId };
  
      return this.donacionesService.findAll(options, where);
    }
  
    @ApiOperation({ summary: 'Obtener una donación por su ID' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Detalles de la donación' 
    })
    @ApiResponse({ 
      status: HttpStatus.NOT_FOUND, 
      description: 'Donación no encontrada' 
    })
    @ApiBearerAuth()
    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
      const donacion = await this.donacionesService.findOne(id);
      
      // Si la donación pertenece a un usuario, verificar que sea el usuario actual o un admin
      if (donacion.id_usuario && 
          (!req.user || (donacion.id_usuario !== req.user.userId && req.user.role !== 'admin'))) {
        throw new BadRequestException('No tienes permisos para ver esta donación');
      }
      
      return donacion;
    }
  
    @ApiOperation({ summary: 'Crear una nueva donación' })
    @ApiResponse({ 
      status: HttpStatus.CREATED, 
      description: 'Donación creada exitosamente' 
    })
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createDonacionDto: CrearDonacionDto, @Req() req: Request) {
      // Si el usuario está autenticado, usar su ID
      if (req.user) {
        createDonacionDto.id_usuario = req.user['userId'];
      }
      
      // Obtener IP del cliente
      const clientIp = this.getClientIp(req);
      
      return this.donacionesService.create({
        ...createDonacionDto,
        // id_usuario should be a number; clientIp can be stored elsewhere if needed
        id_usuario: createDonacionDto.id_usuario,
      });
    }
  
    @ApiOperation({ summary: 'Actualizar el estado de una donación (admin/webhook)' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Estado actualizado exitosamente' 
    })
    @Post(':id/estado')
    @HttpCode(HttpStatus.OK)
    async actualizarEstado(
      @Param('id', ParseIntPipe) id: number,
      @Body() data: { estado: string; referencia_externa?: string },
    ) {
      // Aquí iría verificación del webhook o autenticación admin
      return this.donacionesService.actualizarEstado(
        id, 
        data.estado, 
        data.referencia_externa
      );
    }
  
    @ApiOperation({ summary: 'Obtener estadísticas de donaciones (admin)' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Estadísticas de donaciones' 
    })
    @ApiBearerAuth()
    
    @Get('estadisticas/dashboard')
    async obtenerEstadisticas(
      @Query('fechaInicio') fechaInicio?: string,
      @Query('fechaFin') fechaFin?: string,
    ) {
      const inicio = fechaInicio ? new Date(fechaInicio) : new Date('1970-01-01');
      const fin = fechaFin ? new Date(fechaFin) : new Date();

      return this.donacionesService.obtenerEstadisticas(inicio, fin);
    }
  
    /**
     * Obtiene la IP del cliente
     */
    private getClientIp(request: Request): string {
      let ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
      
      // Si es un array, tomamos la primera IP (la del cliente original)
      if (Array.isArray(ip)) {
        ip = ip[0];
      } else if (typeof ip === 'string') {
        // Si es string con formato "IP, proxy1, proxy2...", tomamos la primera
        ip = ip.split(',')[0].trim();
      }
      
      // Remover el prefijo ::ffff: que aparece para IPv4 cuando el servidor está en modo dual stack
      if (typeof ip === 'string' && ip.startsWith('::ffff:')) {
        ip = ip.substring(7);
      }
      
      return ip as string;
    }
  }