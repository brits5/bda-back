import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Put,
    Delete,
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
  import { SuscripcionesService } from '../services/suscripciones.service';
  import { CrearSuscripcionDto, ActualizarSuscripcionDto, CancelarSuscripcionDto } from '../dto/suscripcion.dto';
  import { Roles } from '../../auth/decorators/roles.decorators';
  
  @ApiTags('suscripciones')
  @Controller('suscripciones')
  export class SuscripcionesController {
    constructor(private readonly suscripcionesService: SuscripcionesService) {}
  
    @ApiOperation({ summary: 'Obtener todas las suscripciones (admin)' })
    @ApiQuery({ name: 'page', required: false, description: 'Número de página', type: Number })
    @ApiQuery({ name: 'limit', required: false, description: 'Elementos por página', type: Number })
    @ApiQuery({ name: 'estado', required: false, description: 'Filtrar por estado', type: String })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Lista paginada de suscripciones' 
    })
    @ApiBearerAuth()
    @Roles('admin')
    @Get()
    async findAll(
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
      @Query('estado') estado?: string,
    ) {
      const options = {
        page,
        limit,
        route: 'suscripciones',
      };
  
      const where = {};
      if (estado) {
        where['estado'] = estado;
      }
  
      return this.suscripcionesService.findAll(options, where);
    }
  
    @ApiOperation({ summary: 'Obtener suscripciones del usuario actual' })
    @ApiQuery({ name: 'page', required: false, description: 'Número de página', type: Number })
    @ApiQuery({ name: 'limit', required: false, description: 'Elementos por página', type: Number })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Lista paginada de suscripciones del usuario' 
    })
    @ApiBearerAuth()
    @Get('mis-suscripciones')
    async findMisSuscripciones(
      @Req() req,
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    ) {
      const options = {
        page,
        limit,
        route: 'suscripciones/mis-suscripciones',
      };
  
      return this.suscripcionesService.findByUsuario(req.user.userId, options);
    }
  
    @ApiOperation({ summary: 'Obtener una suscripción por su ID' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Detalles de la suscripción' 
    })
    @ApiResponse({ 
      status: HttpStatus.NOT_FOUND, 
      description: 'Suscripción no encontrada' 
    })
    @ApiBearerAuth()
    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
      const suscripcion = await this.suscripcionesService.findOne(id);
      
      // Verificar que la suscripción pertenezca al usuario o sea un admin
      if (suscripcion.id_usuario !== req.user.userId && req.user.role !== 'admin') {
        throw new BadRequestException('No tienes permisos para ver esta suscripción');
      }
      
      return suscripcion;
    }
  
    @ApiOperation({ summary: 'Crear una nueva suscripción' })
    @ApiResponse({ 
      status: HttpStatus.CREATED, 
      description: 'Suscripción creada exitosamente' 
    })
    @ApiBearerAuth()
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createSuscripcionDto: CrearSuscripcionDto, @Req() req) {
      return this.suscripcionesService.create(createSuscripcionDto, req.user.userId);
    }
  
    @ApiOperation({ summary: 'Actualizar una suscripción' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Suscripción actualizada exitosamente' 
    })
    @ApiResponse({ 
      status: HttpStatus.NOT_FOUND, 
      description: 'Suscripción no encontrada' 
    })
    @ApiBearerAuth()
    @Put(':id')
    async update(
      @Param('id', ParseIntPipe) id: number, 
      @Body() updateSuscripcionDto: ActualizarSuscripcionDto, 
      @Req() req
    ) {
      return this.suscripcionesService.update(id, updateSuscripcionDto, req.user.userId);
    }
  
    @ApiOperation({ summary: 'Cancelar una suscripción' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Suscripción cancelada exitosamente' 
    })
    @ApiResponse({ 
      status: HttpStatus.NOT_FOUND, 
      description: 'Suscripción no encontrada' 
    })
    @ApiBearerAuth()
    @Delete(':id')
    async cancelar(
      @Param('id', ParseIntPipe) id: number, 
      @Body() cancelarDto: CancelarSuscripcionDto, 
      @Req() req
    ) {
      return this.suscripcionesService.cancelar(id, req.user.userId, cancelarDto.motivo);
    }
  
    @ApiOperation({ summary: 'Obtener estadísticas de suscripciones (admin)' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Estadísticas de suscripciones' 
    })
    @ApiBearerAuth()
    @Roles('admin')
    @Get('estadisticas')
    async obtenerEstadisticas() {
      return this.suscripcionesService.obtenerEstadisticas();
    }
  }