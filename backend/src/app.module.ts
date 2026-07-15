import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { ContentModule } from './content/content.module';
import { UploadModule } from './upload/upload.module';
import { S3Module } from './s3/s3.module';
import configuration from './config/configuration';
import { AppConfig } from './config/config.interface';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'login',
        ttl: 60000,
        limit: 5,
      },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<AppConfig>) => {
        const db = configService.get<AppConfig['database']>('database');
        if (!db) {
          throw new Error('Database configuration is missing');
        }
        return {
          type: 'postgres',
          host: db.host,
          port: db.port,
          username: db.user,
          password: db.password,
          database: db.name,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          migrations: [__dirname + '/migrations/*{.ts,.js}'],
          synchronize: false,
          migrationsRun: true,
        };
      },
      inject: [ConfigService],
    }),
    // SPA fallback – serve index.html for client-side routes in production
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig>) => {
        const nodeEnv = configService.get<string>('nodeEnv') || 'development';
        const distPath = join(process.cwd(), 'frontend', 'dist');
        // In production serve the built frontend with SPA fallback
        // Otherwise disable the module (renderPath never matches)
        return [
          {
            rootPath: distPath,
            renderPath:
              nodeEnv === 'production' ? '{*path}' : '/__spa_disabled__',
            serveStaticOptions: {
              index: ['index.html'],
            },
            exclude:
              nodeEnv === 'production'
                ? ['/api/*path', '/uploads/*path']
                : ['/*path'],
          },
        ];
      },
    }),
    AuthModule,
    HealthModule,
    ContentModule,
    UploadModule,
    S3Module,
  ],
})
export class AppModule {}
