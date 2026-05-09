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

  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  const uploadsDir = join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadsDir, { prefix: '/uploads/' });

  await app.listen(port);
  console.log(`Application running on port ${port}`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});
