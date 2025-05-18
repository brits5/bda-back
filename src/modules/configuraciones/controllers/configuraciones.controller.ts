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
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConfiguracionesService } from '../services/configuraciones.services';
import { ActualizarConfiguracionDto, CrearConfiguracionDto } from '../dto/configuracion.dto';


@ApiTags('configuraciones')
@Controller('configuraciones')
export class ConfiguracionesController {
  constructor(private readonly configuracionesService: ConfiguracionesService) {}

  @ApiOperation({ summary: 'Obtener todas las configuraciones (admin)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de configuraciones',
  })
  @ApiBearerAuth()
  @Get()
  async findAll() {
    return this.configuracionesService.findAll();
  }

  @ApiOperation({ summary: 'Obtener una configuración por su clave (admin)' })
  @ApiParam({ name: 'clave', description: 'Clave de la configuración' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Configuración encontrada',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Configuración no encontrada',
  })
  @ApiBearerAuth()
  @Get(':clave')
  async findOne(@Param('clave') clave: string) {
    return this.configuracionesService.findOne(clave);
  }

  @ApiOperation({ summary: 'Obtener el valor de una configuración pública' })
  @ApiQuery({ name: 'clave', description: 'Clave de la configuración' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Valor de la configuración',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Configuración no encontrada',
  })
  @Get('publicas/valor')
  async getValorPublico(@Query('clave') clave: string) {
    // Lista de configuraciones públicas permitidas
    const configuracionesPublicas = [
      'montos_predeterminados',
      'moneda_principal',
      'titulo_sitio',
      'meta_mensual',
      'mensaje_donacion',
      'puntos_por_dolar',
      'limite_intentos_pago',
      // Añadir aquí otras configuraciones públicas
    ];
    
    if (!configuracionesPublicas.includes(clave)) {
      throw new BadRequestException('La configuración solicitada no es pública');
    }
    
    try {
      const valor = await this.configuracionesService.obtenerValor(clave);
      return { clave, valor };
    } catch (error) {
      throw new BadRequestException(`Configuración no encontrada: ${error.message}`);
    }
  }

  @ApiOperation({ summary: 'Obtener múltiples configuraciones públicas' })
  @ApiQuery({ name: 'claves', description: 'Lista de claves separadas por coma' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Valores de las configuraciones',
  })
  @Get('publicas/valores')
  async getValoresPublicos(@Query('claves') claves: string) {
    // Lista de configuraciones públicas permitidas
    const configuracionesPublicas = [
      'montos_predeterminados',
      'moneda_principal',
      'titulo_sitio',
      'meta_mensual',
      'mensaje_donacion',
      'puntos_por_dolar',
      'limite_intentos_pago',
      // Añadir aquí otras configuraciones públicas
    ];
    
    if (!claves) {
      throw new BadRequestException('Debe especificar al menos una clave');
    }
    
    const clavesArray = claves.split(',').map(c => c.trim());
    
    // Verificar que todas las claves sean públicas
    for (const clave of clavesArray) {
      if (!configuracionesPublicas.includes(clave)) {
        throw new BadRequestException(`La configuración "${clave}" no es pública`);
      }
    }
    
    return this.configuracionesService.obtenerMultiples(clavesArray);
  }

  @ApiOperation({ summary: 'Crear una nueva configuración (admin)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Configuración creada exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Error al crear configuración',
  })
  @ApiBearerAuth()
  @Post()
  async create(@Body() createConfiguracionDto: CrearConfiguracionDto) {
    return this.configuracionesService.create(createConfiguracionDto);
  }

  @ApiOperation({ summary: 'Actualizar una configuración (admin)' })
  @ApiParam({ name: 'clave', description: 'Clave de la configuración' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Configuración actualizada exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Configuración no encontrada',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Error al actualizar configuración',
  })
  @ApiBearerAuth()
  @Put(':clave')
  async update(
    @Param('clave') clave: string,
    @Body() updateConfiguracionDto: ActualizarConfiguracionDto,
  ) {
    return this.configuracionesService.update(clave, updateConfiguracionDto);
  }

  @ApiOperation({ summary: 'Eliminar una configuración (admin)' })
  @ApiParam({ name: 'clave', description: 'Clave de la configuración' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Configuración eliminada exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Configuración no encontrada',
  })
  @ApiBearerAuth()
  @Delete(':clave')
  async remove(@Param('clave') clave: string) {
    const result = await this.configuracionesService.remove(clave);
    
    if (result) {
      return { mensaje: 'Configuración eliminada exitosamente' };
    } else {
      throw new BadRequestException('Error al eliminar configuración');
    }
  }
}