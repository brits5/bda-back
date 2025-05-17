import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Put,
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
  import { CampanasService } from '../services/campanas.service';
  import { CrearCampanaDto, ActualizarCampanaDto } from '../dto/campana.dto';
  import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
  import { RoleGuard } from '../../auth/guards/role.guard';
  import { Roles } from '../../auth/decorators/roles.decorators';
  
  @ApiTags('campanas')
  @Controller('campanas')
  export class CampanasController {
    constructor(private readonly campanasService: CampanasService) {}
  
    @ApiOperation({ summary: 'Obtener todas las campañas' })
    @ApiQuery({ name: 'page', required: false, description: 'Número de página', type: Number })
    @ApiQuery({ name: 'limit', required: false, description: 'Elementos por página', type: Number })
    @ApiQuery({ name: 'estado', required: false, description: 'Filtrar por estado', type: String })
    @ApiQuery({ name: 'emergencia', required: false, description: 'Filtrar por emergencia', type: Boolean })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Lista paginada de campañas' 
    })
    @Get()
    async findAll(
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
      @Query('estado') estado?: string,
      @Query('emergencia') emergencia?: boolean,
    ) {
      const options = {
        page,
        limit,
        route: 'campanas',
      };
  
      const where = {};
      if (estado) {
        where['estado'] = estado;
      }
      if (emergencia !== undefined) {
        where['es_emergencia'] = emergencia;
      }
  
      return this.campanasService.findAll(options, where);
    }
  
    @ApiOperation({ summary: 'Obtener una campaña por su ID' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Detalles de la campaña' 
    })
    @ApiResponse({ 
      status: HttpStatus.NOT_FOUND, 
      description: 'Campaña no encontrada' 
    })
    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
      return this.campanasService.findOne(id);
    }
  
    @ApiOperation({ summary: 'Crear una nueva campaña (admin)' })
    @ApiResponse({ 
      status: HttpStatus.CREATED, 
      description: 'Campaña creada exitosamente' 
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('admin')
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createCampanaDto: CrearCampanaDto) {
      return this.campanasService.create(createCampanaDto);
    }
  
    @ApiOperation({ summary: 'Actualizar una campaña (admin)' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Campaña actualizada exitosamente' 
    })
    @ApiResponse({ 
      status: HttpStatus.NOT_FOUND, 
      description: 'Campaña no encontrada' 
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('admin')
    @Put(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateCampanaDto: ActualizarCampanaDto) {
      return this.campanasService.update(id, updateCampanaDto);
    }
  
    @ApiOperation({ summary: 'Cambiar el estado de una campaña (admin)' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Estado actualizado exitosamente' 
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('admin')
    @Put(':id/estado')
    async cambiarEstado(
      @Param('id', ParseIntPipe) id: number,
      @Body() data: { estado: 'Activa' | 'Finalizada' | 'Cancelada' },
    ) {
      return this.campanasService.cambiarEstado(id, data.estado);
    }
  
    @ApiOperation({ summary: 'Buscar campañas por texto' })
    @ApiQuery({ name: 'texto', required: true, description: 'Texto a buscar', type: String })
    @ApiQuery({ name: 'page', required: false, description: 'Número de página', type: Number })
    @ApiQuery({ name: 'limit', required: false, description: 'Elementos por página', type: Number })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Resultados de la búsqueda' 
    })
    @Get('buscar')
    async buscar(
      @Query('texto') texto: string,
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    ) {
      if (!texto || texto.trim().length < 3) {
        throw new BadRequestException('El texto de búsqueda debe tener al menos 3 caracteres');
      }
      
      const options = {
        page,
        limit,
        route: 'campanas/buscar',
      };
      
      return this.campanasService.buscarCampanas(texto, options);
    }
  
    @ApiOperation({ summary: 'Obtener campañas destacadas para el home' })
    @ApiQuery({ name: 'limit', required: false, description: 'Número de campañas a retornar', type: Number })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Campañas destacadas' 
    })
    @Get('destacadas')
    async obtenerDestacadas(@Query('limit', new DefaultValuePipe(4), ParseIntPipe) limit: number) {
      return this.campanasService.obtenerCampanasDestacadas(limit);
    }
  
    @ApiOperation({ summary: 'Obtener estadísticas de campañas (admin)' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Estadísticas de campañas' 
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('admin')
    @Get('estadisticas')
    async obtenerEstadisticas() {
      return this.campanasService.obtenerEstadisticas();
    }
  
    @ApiOperation({ summary: 'Seguir/dejar de seguir una campaña' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Operación exitosa' 
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post(':id/seguir')
    async seguirCampana(
      @Param('id', ParseIntPipe) id: number,
      @Body() data: { seguir: boolean },
      @Req() req,
    ) {
      // Esta funcionalidad requeriría implementación adicional en el servicio
      // para manejar la relación many-to-many entre usuarios y campañas
      return { 
        message: data.seguir 
          ? 'Ahora estás siguiendo esta campaña' 
          : 'Has dejado de seguir esta campaña' 
      };
    }
}