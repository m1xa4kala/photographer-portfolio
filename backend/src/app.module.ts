import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ContentModule } from './content/content.module';
import { UploadModule } from './upload/upload.module';
import configuration from './config/configuration';
import { AppConfig } from './config/config.interface';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
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
    AuthModule,
    ContentModule,
    UploadModule,
  ],
})
export class AppModule {}
