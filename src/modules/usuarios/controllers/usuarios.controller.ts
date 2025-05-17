import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    Query,
    UseGuards,
    Req,
    HttpStatus,
    DefaultValuePipe,
    ParseIntPipe,
    BadRequestException,
    NotFoundException,
    Patch,
  } from '@nestjs/common';
  import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
  import { UsuariosService } from '../services/usuarios.service';
  import { ActualizarUsuarioDto, CambiarPasswordDto, CrearNotificacionDto } from '../dto/usuarios.dto';
  import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
  import { RoleGuard } from '../../auth/guards/role.guard';
  import { Roles } from '../../auth/decorators/roles.decorators';
  
  @ApiTags('usuarios')
  @Controller('usuarios')
  export class UsuariosController {
    constructor(private readonly usuariosService: UsuariosService) {}
  
    @ApiOperation({ summary: 'Obtener todos los usuarios (admin)' })
    @ApiQuery({ name: 'page', required: false, description: 'Número de página', type: Number })
    @ApiQuery({ name: 'limit', required: false, description: 'Elementos por página', type: Number })
    @ApiQuery({ name: 'activo', required: false, description: 'Filtrar por estado', type: Boolean })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Lista paginada de usuarios' 
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('admin')
    @Get()
    async findAll(
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
      @Query('activo') activo?: boolean,
    ) {
      const options = {
        page,
        limit,
        route: 'usuarios',
      };
  
      const where = {};
      if (activo !== undefined) {
        where['activo'] = activo;
      }
  
      return this.usuariosService.findAll(options, where);
    }
  
    @ApiOperation({ summary: 'Obtener un usuario por su ID (admin)' })
    @ApiParam({ name: 'id', description: 'ID del usuario' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Detalles del usuario' 
    })
    @ApiResponse({ 
      status: HttpStatus.NOT_FOUND, 
      description: 'Usuario no encontrado' 
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('admin')
    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
      return this.usuariosService.findOne(id);
    }
  
    @ApiOperation({ summary: 'Obtener perfil del usuario actual' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Perfil del usuario' 
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('perfil')
    async getPerfil(@Req() req) {
      return this.usuariosService.findOne(req.user.userId);
    }
  
    @ApiOperation({ summary: 'Actualizar perfil del usuario' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Perfil actualizado exitosamente' 
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Put('perfil')
    async updatePerfil(@Body() updateUsuarioDto: ActualizarUsuarioDto, @Req() req) {
      return this.usuariosService.update(req.user.userId, updateUsuarioDto);
    }
  
    @ApiOperation({ summary: 'Cambiar contraseña del usuario' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Contraseña actualizada exitosamente' 
    })
    @ApiResponse({ 
      status: HttpStatus.BAD_REQUEST, 
      description: 'Error al cambiar contraseña' 
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('cambiar-password')
    async cambiarPassword(@Body() cambiarPasswordDto: CambiarPasswordDto, @Req() req) {
      const result = await this.usuariosService.changePassword(
        req.user.userId,
        cambiarPasswordDto,
      );
      
      if (result) {
        return { mensaje: 'Contraseña actualizada exitosamente' };
      } else {
        throw new BadRequestException('Error al cambiar contraseña');
      }
    }
  
    @ApiOperation({ summary: 'Desactivar cuenta del usuario' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Cuenta desactivada exitosamente' 
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('desactivar')
    async desactivarCuenta(@Req() req) {
      const result = await this.usuariosService.deactivate(req.user.userId);
      
      if (result) {
        return { mensaje: 'Cuenta desactivada exitosamente' };
      } else {
        throw new BadRequestException('Error al desactivar cuenta');
      }
    }
  
    @ApiOperation({ summary: 'Desactivar cuenta de usuario (admin)' })
    @ApiParam({ name: 'id', description: 'ID del usuario' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Cuenta desactivada exitosamente' 
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('admin')
    @Post(':id/desactivar')
    async desactivarCuentaAdmin(@Param('id', ParseIntPipe) id: number) {
      const result = await this.usuariosService.deactivate(id);
      
      if (result) {
        return { mensaje: 'Cuenta desactivada exitosamente' };
      } else {
        throw new BadRequestException('Error al desactivar cuenta');
      }
    }
  
    @ApiOperation({ summary: 'Obtener notificaciones del usuario' })
    @ApiQuery({ name: 'leidas', required: false, description: 'Filtrar por leídas/no leídas', type: Boolean })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Lista de notificaciones' 
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('notificaciones')
    async getNotificaciones(@Req() req, @Query('leidas') leidas?: boolean) {
      const leidasParam = leidas === undefined ? null : leidas === true;
      return this.usuariosService.getNotificaciones(req.user.userId, leidasParam);
    }
  
    @ApiOperation({ summary: 'Marcar notificación como leída' })
    @ApiParam({ name: 'id', description: 'ID de la notificación' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Notificación marcada como leída' 
    })
    @ApiResponse({ 
      status: HttpStatus.NOT_FOUND, 
      description: 'Notificación no encontrada' 
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Patch('notificaciones/:id/leer')
    async markNotificacionAsRead(@Param('id', ParseIntPipe) id: number, @Req() req) {
      const result = await this.usuariosService.markNotificacionAsRead(id, req.user.userId);
      
      if (result) {
        return { mensaje: 'Notificación marcada como leída' };
      } else {
        throw new BadRequestException('Error al marcar notificación como leída');
      }
    }
  
    @ApiOperation({ summary: 'Marcar todas las notificaciones como leídas' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Todas las notificaciones marcadas como leídas' 
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('notificaciones/leer-todas')
    async markAllNotificacionesAsRead(@Req() req) {
      const result = await this.usuariosService.markAllNotificacionesAsRead(req.user.userId);
      
      if (result) {
        return { mensaje: 'Todas las notificaciones marcadas como leídas' };
      } else {
        throw new BadRequestException('Error al marcar notificaciones como leídas');
      }
    }
  
    @ApiOperation({ summary: 'Crear notificación para un usuario (admin)' })
    @ApiResponse({ 
      status: HttpStatus.CREATED, 
      description: 'Notificación creada exitosamente' 
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('admin')
    @Post('notificaciones')
    async createNotificacion(@Body() createNotificacionDto: CrearNotificacionDto) {
      return this.usuariosService.createNotificacion(createNotificacionDto);
    }
  
    @ApiOperation({ summary: 'Obtener historial de donaciones del usuario' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Historial de donaciones' 
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('donaciones')
    async getDonaciones(@Req() req) {
      return this.usuariosService.getDonaciones(req.user.userId);
    }
  
    @ApiOperation({ summary: 'Obtener suscripciones del usuario' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Lista de suscripciones' 
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('suscripciones')
    async getSuscripciones(@Req() req) {
      return this.usuariosService.getSuscripciones(req.user.userId);
    }
  
    @ApiOperation({ summary: 'Obtener recompensas del usuario' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Lista de recompensas' 
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('recompensas')
    async getRecompensas(@Req() req) {
      return this.usuariosService.getRecompensas(req.user.userId);
    }
  
    @ApiOperation({ summary: 'Obtener estadísticas del usuario' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Estadísticas del usuario' 
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('estadisticas')
    async getEstadisticas(@Req() req) {
      return this.usuariosService.getEstadisticas(req.user.userId);
    }
  
    @ApiOperation({ summary: 'Buscar usuarios por texto (admin)' })
    @ApiQuery({ name: 'texto', required: true, description: 'Texto a buscar' })
    @ApiQuery({ name: 'page', required: false, description: 'Número de página', type: Number })
    @ApiQuery({ name: 'limit', required: false, description: 'Elementos por página', type: Number })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Resultados de la búsqueda' 
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('admin')
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
        route: 'usuarios/buscar',
      };
      
      return this.usuariosService.buscar(texto, options);
    }
  
    @ApiOperation({ summary: 'Enviar resumen mensual al usuario (admin)' })
    @ApiParam({ name: 'id', description: 'ID del usuario' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Resumen enviado exitosamente' 
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('admin')
    @Post(':id/enviar-resumen')
    async enviarResumen(@Param('id', ParseIntPipe) id: number) {
      const result = await this.usuariosService.enviarResumenMensual(id);
      
      if (result) {
        return { mensaje: 'Resumen mensual enviado exitosamente' };
      } else {
        throw new BadRequestException('No hay donaciones este mes para este usuario');
      }
    }
  }