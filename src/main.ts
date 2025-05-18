import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  // Configuración global de prefijo para la API
  app.setGlobalPrefix('api');
  
  const allowedOrigins = [
    'hackaton-banco-alimentos-production.up.railway.app',
    'http://localhost:3000/',
  ];
  // Configuración de CORS
  app.enableCors({
    origin: allowedOrigins, // TODO: Cambiar a URLs específicas en producción
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });
  
  // Pipes globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  
  // Filtros e interceptores globales
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  
  // Configuración de Swagger
  const options = new DocumentBuilder()
    .setTitle('Sistema de Donaciones API')
    .setDescription('API para el sistema de gestión de donaciones')
    .setVersion('1.0')
    .addTag('auth', 'Autenticación y autorización')
    .addTag('usuarios', 'Gestión de usuarios y donantes')
    .addTag('campanas', 'Gestión de campañas de donación')
    .addTag('donaciones', 'Procesamiento de donaciones')
    .addTag('suscripciones', 'Gestión de donaciones recurrentes')
    .addTag('comprobantes', 'Emisión de comprobantes')
    .addTag('facturas', 'Facturación para donaciones')
    .addTag('recompensas', 'Sistema de puntos y recompensas')
    .addTag('estadisticas', 'Reportes y estadísticas')
    .addTag('testimonios', 'Gestión de testimonios')
    .addTag('configuraciones', 'Configuraciones del sistema')
    .addTag('pagos', 'Integración con PLUX')
    .addBearerAuth()
    .build();
    
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api/docs', app, document);
  
  // Iniciar servidor
  const port = configService.get('app.port') || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api/docs`);
}

bootstrap();