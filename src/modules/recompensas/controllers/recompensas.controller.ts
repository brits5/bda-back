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
import { RecompensasService } from '../services/recompensas.service';
import { CrearRecompensaDto, ActualizarRecompensaDto, AsignarRecompensaDto } from '../dto/recompensas.dto';
import { Roles } from '../../auth/decorators/roles.decorators';

@ApiTags('recompensas')
@Controller('recompensas')
export class RecompensasController {
  constructor(private readonly recompensasService: RecompensasService) {}

  @ApiOperation({ summary: 'Obtener todas las recompensas' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Elementos por página', type: Number })
  @ApiQuery({ name: 'activa', required: false, description: 'Filtrar por estado', type: Boolean })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Lista paginada de recompensas' 
  })
  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('activa') activa?: boolean,
  ) {
    const options = {
      page,
      limit,
      route: 'recompensas',
    };

    const where = {};
    if (activa !== undefined) {
      where['activa'] = activa;
    }

    return this.recompensasService.findAll(options, where);
  }

  @ApiOperation({ summary: 'Obtener una recompensa por su ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Detalles de la recompensa' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Recompensa no encontrada' 
  })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.recompensasService.findOne(id);
  }

  @ApiOperation({ summary: 'Obtener recompensas disponibles para el usuario actual' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Lista de recompensas disponibles' 
  })
  @ApiBearerAuth()
  @Get('disponibles/usuario')
  async findAvailableForCurrentUser(@Req() req) {
    return this.recompensasService.findAvailableForUser(req.user.userId);
  }

  @ApiOperation({ summary: 'Crear una nueva recompensa (admin)' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Recompensa creada exitosamente' 
  })
  @ApiBearerAuth()
  @Roles('admin')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createRecompensaDto: CrearRecompensaDto) {
    return this.recompensasService.create(createRecompensaDto);
  }

  @ApiOperation({ summary: 'Actualizar una recompensa (admin)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Recompensa actualizada exitosamente' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Recompensa no encontrada' 
  })
  @ApiBearerAuth()
  @Roles('admin')
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateRecompensaDto: ActualizarRecompensaDto
  ) {
    return this.recompensasService.update(id, updateRecompensaDto);
  }

  @ApiOperation({ summary: 'Eliminar una recompensa (admin)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Recompensa eliminada exitosamente' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Recompensa no encontrada' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'No se puede eliminar la recompensa porque ya ha sido asignada a usuarios' 
  })
  @ApiBearerAuth()
  @Roles('admin')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.recompensasService.remove(id);
    
    if (result) {
      return { mensaje: 'Recompensa eliminada exitosamente' };
    } else {
      throw new BadRequestException('Error al eliminar recompensa');
    }
  }

  @ApiOperation({ summary: 'Asignar una recompensa a un usuario (admin)' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Recompensa asignada exitosamente' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Error al asignar recompensa' 
  })
  @ApiBearerAuth()
  @Roles('admin')
  @Post('asignar')
  @HttpCode(HttpStatus.CREATED)
  async asignarRecompensa(@Body() asignarRecompensaDto: AsignarRecompensaDto) {
    return this.recompensasService.asignarRecompensa(asignarRecompensaDto);
  }

  @ApiOperation({ summary: 'Canjear una recompensa (usuario)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Recompensa canjeada exitosamente' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Recompensa no encontrada' 
  })
  @ApiBearerAuth()
  @Post(':id/canjear')
  async canjearRecompensa(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const resultado = await this.recompensasService.actualizarEstado(
      req.user.userId,
      id,
      'Canjeada'
    );
    
    return {
      mensaje: 'Recompensa canjeada exitosamente',
      recompensa: resultado
    };
  }

  /*
  @ApiOperation({ summary: 'Verificar si el usuario ha alcanzado nuevas recompensas' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Nuevas recompensas verificadas' 
  })
  @ApiBearerAuth()
  @Post('verificar-automaticas')
  async verificarRecompensasAutomaticas(@Req() req) {
    const nuevasRecompensas = await this.recompensasService.verificarRecompensasAutomaticas(
      req.user.userId
    );
    
    return {
      mensaje: `Se han verificado ${nuevasRecompensas.length} nuevas recompensas`,
      recompensas: nuevasRecompensas
    };
  }
*/

  @ApiOperation({ summary: 'Actualizar estado de una recompensa (admin)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Estado actualizado exitosamente' 
  })
  @ApiBearerAuth()
  @Roles('admin')
  @Put('usuario/:idUsuario/recompensa/:idRecompensa/estado')
  async actualizarEstado(
    @Param('idUsuario', ParseIntPipe) idUsuario: number,
    @Param('idRecompensa', ParseIntPipe) idRecompensa: number,
    @Body() data: { estado: 'Pendiente' | 'Entregada' | 'Canjeada' | 'Expirada' }
  ) {
    const resultado = await this.recompensasService.actualizarEstado(
      idUsuario,
      idRecompensa,
      data.estado
    );
    
    return {
      mensaje: `Estado actualizado a ${data.estado}`,
      recompensa: resultado
    };
  }
}