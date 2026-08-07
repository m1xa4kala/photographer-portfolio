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
  // CORS: in development allow localhost + any local network IP
  const corsOrigin =
    nodeEnv === 'development'
      ? (
          origin: string | undefined,
          callback: (err: Error | null, allow?: boolean) => void,
        ) => {
          // Allow requests with no origin (server-to-server, curl, etc.)
          if (!origin) return callback(null, true);
          // Allow localhost (any port)
          if (/^https?:\/\/localhost(:\d+)?$/.test(origin))
            return callback(null, true);
          // Allow local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
          if (
            /^https?:\/\/(127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(
              origin,
            )
          )
            return callback(null, true);
          callback(null, false);
        }
      : frontendUrl;

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://fonts.googleapis.com',
          ],
          fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
          connectSrc: ["'self'"],
        },
      },
    }),
  );

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
