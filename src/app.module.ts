import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosModule } from '../modules/usuarios/usuarios.module';

import { CampanasModule } from './modules/campanas/campanas.module';
import { DonacionesModule } from './modules/donaciones/donaciones.module';
import { SuscripcionesModule } from './modules/suscripciones/suscripciones.module';
import { ComprobantesModule } from './modules/comprobantes/comprobantes.module';
import { FacturasModule } from './modules/facturas/facturas.module';
import { RecompensasModule } from './modules/recompensas/recompensas.module';
import { EstadisticasModule } from './modules/estadisticas/estadisticas.module';
import { TestimoniosModule } from './modules/testimonios/testimonios.module';
import { ConfiguracionesModule } from './modules/configuraciones/configuraciones.module';
import { PagosModule } from './modules/pagos/pagos.module';
import { AuthModule } from './modules/auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import mailConfig from './config/mail.config';
import pluxConfig from './config/plux.config';
import storageConfig from './config/storage.config';

@Module({
  imports: [
    // Configuración global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [
        appConfig,
        databaseConfig,
        jwtConfig,
        mailConfig,
        pluxConfig,
        storageConfig,
      ],
    }),
    
    // Configuración de la base de datos
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        synchronize: configService.get('database.synchronize'),
        logging: configService.get('database.logging'),
        charset: 'utf8mb4',
      }),
    }),
    
    // Programación de tareas
    ScheduleModule.forRoot(),
    
    // Módulos de la aplicación
    AuthModule,
    UsuariosModule,
    CampanasModule,
    DonacionesModule,
    SuscripcionesModule,
    ComprobantesModule,
    FacturasModule,
    RecompensasModule,
    EstadisticasModule,
    TestimoniosModule,
    ConfiguracionesModule,
    PagosModule,
  ],
})
export class AppModule {}