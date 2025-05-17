import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
    Get,
    Req,
  } from '@nestjs/common';
  import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
  import { AuthService } from '../services/auth.service';
  import { 
    LoginDto, 
    RegisterDto, 
    RefreshTokenDto, 
    ResetPasswordRequestDto,
    ResetPasswordDto 
  } from '../dto/auth.dto';
  import { JwtAuthGuard } from '../guards/jwt-auth.guard';
  
  @ApiTags('auth')
  @Controller('auth')
  export class AuthController {
    constructor(private authService: AuthService) {}
  
    @ApiOperation({ summary: 'Iniciar sesión' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Inicio de sesión exitoso',
    })
    @ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Credenciales incorrectas',
    })
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto) {
      return this.authService.login(loginDto);
    }
  
    @ApiOperation({ summary: 'Registrar un nuevo usuario' })
    @ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Usuario registrado exitosamente',
    })
    @ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Datos inválidos o usuario ya existe',
    })
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() registerDto: RegisterDto) {
      return this.authService.register(registerDto);
    }
  
    @ApiOperation({ summary: 'Refrescar token JWT' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Token refrescado exitosamente',
    })
    @ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Token inválido o expirado',
    })
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
      return this.authService.refreshToken(refreshTokenDto.refreshToken);
    }
  
    @ApiOperation({ summary: 'Solicitar restablecimiento de contraseña' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Solicitud procesada',
    })
    @Post('reset-password-request')
    @HttpCode(HttpStatus.OK)
    async resetPasswordRequest(@Body() resetPasswordRequestDto: ResetPasswordRequestDto) {
      return this.authService.requestPasswordReset(resetPasswordRequestDto);
    }
  
    @ApiOperation({ summary: 'Restablecer contraseña con token' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Contraseña restablecida exitosamente',
    })
    @ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Token inválido o expirado',
    })
    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
      return this.authService.resetPassword(resetPasswordDto);
    }
  
    @ApiOperation({ summary: 'Obtener información del usuario actual' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Información del usuario',
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('me')
    @HttpCode(HttpStatus.OK)
    async me(@Req() req) {
      // El usuario ya está disponible en req.user gracias a JwtAuthGuard
      return { user: req.user };
    }
  }