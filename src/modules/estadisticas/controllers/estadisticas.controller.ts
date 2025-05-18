import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EstadisticasService } from '../services/estadisticas.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/decorators/roles.decorators';
import { ObtenerEstadisticasDto } from '../dto/estadisticas.dto';

@ApiTags('estadisticas')
@Controller('estadisticas')
export class EstadisticasController {
  constructor(private readonly estadisticasService: EstadisticasService) {}

  @ApiOperation({ summary: 'Obtener dashboard principal de estadísticas (admin)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard de estadísticas',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @Get('dashboard')
  async obtenerDashboard() {
    return this.estadisticasService.obtenerDashboard();
  }

  @ApiOperation({ summary: 'Obtener estadísticas del mes actual (admin)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estadísticas del mes actual',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @Get('mes-actual')
  async obtenerEstadisticasMesActual() {
    return this.estadisticasService.obtenerEstadisticasMesActual();
  }

  @ApiOperation({ summary: 'Obtener estadísticas mensuales por período (admin)' })
  @ApiQuery({
    name: 'fechaInicio',
    required: false,
    description: 'Fecha de inicio (YYYY-MM-DD)',
    type: Date,
  })
  @ApiQuery({
    name: 'fechaFin',
    required: false,
    description: 'Fecha de fin (YYYY-MM-DD)',
    type: Date,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estadísticas mensuales por período',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @Get('mensuales')
  async obtenerEstadisticasMensuales(
    @Query() query: ObtenerEstadisticasDto,
  ) {
    const fechaInicio = query.fechaInicio ? new Date(query.fechaInicio) : undefined;
    const fechaFin = query.fechaFin ? new Date(query.fechaFin) : undefined;
    
    return this.estadisticasService.obtenerEstadisticasMensuales(fechaInicio, fechaFin);
  }

  @ApiOperation({ summary: 'Obtener estadísticas por campaña (admin)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estadísticas por campaña',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @Get('campanas/:id')
  async obtenerEstadisticasPorCampana(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ObtenerEstadisticasDto,
  ) {
    const fechaInicio = query.fechaInicio ? new Date(query.fechaInicio) : undefined;
    const fechaFin = query.fechaFin ? new Date(query.fechaFin) : undefined;
    
    // Este método necesitaría ser implementado en el servicio de estadísticas
    // return this.estadisticasService.obtenerEstadisticasPorCampana(id, fechaInicio, fechaFin);
    
    // Implementación provisional
    return {
      campana_id: id,
      periodo: {
        inicio: fechaInicio || 'hace 12 meses',
        fin: fechaFin || 'hoy',
      },
      total_donaciones: 0,
      contador_donaciones: 0,
      donantes_unicos: 0,
      crecimiento_mensual: '0%',
      promedio_donacion: 0,
    };
  }

  @ApiOperation({ summary: 'Obtener estadísticas de donantes (admin)' })
  @ApiQuery({
    name: 'fechaInicio',
    required: false,
    description: 'Fecha de inicio (YYYY-MM-DD)',
    type: Date,
  })
  @ApiQuery({
    name: 'fechaFin',
    required: false,
    description: 'Fecha de fin (YYYY-MM-DD)',
    type: Date,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estadísticas de donantes',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @Get('donantes')
  async obtenerEstadisticasDonantes(
    @Query() query: ObtenerEstadisticasDto,
  ) {
    const fechaInicio = query.fechaInicio ? new Date(query.fechaInicio) : undefined;
    const fechaFin = query.fechaFin ? new Date(query.fechaFin) : undefined;
    
    // Este método necesitaría ser implementado en el servicio de estadísticas
    // return this.estadisticasService.obtenerEstadisticasDonantes(fechaInicio, fechaFin);
    
    // Implementación provisional
    return {
      periodo: {
        inicio: fechaInicio || 'hace 12 meses',
        fin: fechaFin || 'hoy',
      },
      total_donantes: 0,
      nuevos_donantes: 0,
      donantes_recurrentes: 0,
      donantes_por_nivel: {
        bronce: 0,
        plata: 0,
        oro: 0,
        platino: 0,
      },
      donante_principal: null,
    };
  }

  @ApiOperation({ summary: 'Obtener estadísticas de suscripciones (admin)' })
  @ApiQuery({
    name: 'fechaInicio',
    required: false,
    description: 'Fecha de inicio (YYYY-MM-DD)',
    type: Date,
  })
  @ApiQuery({
    name: 'fechaFin',
    required: false,
    description: 'Fecha de fin (YYYY-MM-DD)',
    type: Date,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estadísticas de suscripciones',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @Get('suscripciones')
  async obtenerEstadisticasSuscripciones(
    @Query() query: ObtenerEstadisticasDto,
  ) {
    const fechaInicio = query.fechaInicio ? new Date(query.fechaInicio) : undefined;
    const fechaFin = query.fechaFin ? new Date(query.fechaFin) : undefined;
    
    // Este método necesitaría ser implementado en el servicio de estadísticas
    // return this.estadisticasService.obtenerEstadisticasSuscripciones(fechaInicio, fechaFin);
    
    // Implementación provisional
    return {
      periodo: {
        inicio: fechaInicio || 'hace 12 meses',
        fin: fechaFin || 'hoy',
      },
      total_suscripciones: 0,
      suscripciones_activas: 0,
      suscripciones_canceladas: 0,
      ingreso_mensual_recurrente: 0,
      suscripciones_por_frecuencia: {
        mensual: 0,
        trimestral: 0,
        anual: 0,
      },
    };
  }

  @ApiOperation({ summary: 'Obtener estadísticas públicas (limitadas)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estadísticas públicas',
  })
  @Get('publicas')
  async obtenerEstadisticasPublicas() {
    // Este método necesitaría ser implementado en el servicio de estadísticas
    // return this.estadisticasService.obtenerEstadisticasPublicas();
    
    // Implementación provisional - versión limitada para público general
    return {
      total_donaciones: 0,
      donantes_unicos: 0,
      beneficiarios_impactados: 0,
      campana_destacada: null,
      porcentaje_meta_mensual: 0,
    };
  }

  @ApiOperation({ summary: 'Obtener estadísticas de usuario (perfil)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estadísticas del usuario',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('perfil')
  async obtenerEstadisticasPerfil(@Query() query: ObtenerEstadisticasDto) {
    // Este método debería obtener las estadísticas del usuario autenticado
    // return this.estadisticasService.obtenerEstadisticasUsuario(req.user.userId, fechaInicio, fechaFin);
    
    // Implementación provisional
    return {
      total_donado: 0,
      donaciones_realizadas: 0,
      puntos_acumulados: 0,
      nivel_donante: 'Bronce',
      campanas_apoyadas: 0,
      recompensas_obtenidas: 0,
    };
  }
}