import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { AppConfig } from './config/config.interface';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService<AppConfig>);

  const port = configService.get<number>('port') || 3000;
  const frontendUrl = configService.get<string>('frontendUrl');
  const nodeEnv = configService.get<string>('nodeEnv') || 'development';
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

  app.useStaticAssets(uploadsDir, { prefix: '/uploads/' });

  await app.listen(port);
  console.log(
    `Application running on port ${port} (${nodeEnv}, uploadsDir - ${uploadsDir})`,
  );
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});
