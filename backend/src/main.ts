import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { AppConfig } from './config/config.interface';
import helmet from 'helmet';
import compression from 'compression';
import { json } from 'express';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  const configService = app.get(ConfigService<AppConfig>);

  const port = configService.get<number>('port') || 3000;
  const frontendUrl = configService.get<string>('frontendUrl');
  const nodeEnv = configService.get<string>('nodeEnv') || 'development';

  if (!frontendUrl && nodeEnv === 'production') {
    throw new Error(
      'FRONTEND_URL environment variable is required in production',
    );
  }
  const uploadsDir =
    nodeEnv === 'development'
      ? join(__dirname, '..', '..', 'uploads')
      : join(process.cwd(), 'uploads');
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Security headers
  app.use(helmet());

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Response compression (gzip)
  app.use(compression());

  // Parse JSON bodies with 1MB limit
  app.use(json({ limit: '1mb' }));

  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads/',
    maxAge: '7d',
    etag: true,
    lastModified: true,
    setHeaders: (res) =>
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable'),
  });

  await app.listen(port);
  console.log(`Application running on port ${port} (${nodeEnv})`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});
