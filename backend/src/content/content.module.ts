import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BestPhoto } from './entities/best-photo.entity';
import { PortfolioCategory } from './entities/portfolio-category.entity';
import { PortfolioSession } from './entities/portfolio-session.entity';
import { PortfolioPhoto } from './entities/portfolio-photo.entity';
import { PriceItem } from './entities/price-item.entity';
import { Review } from './entities/review.entity';
import { About } from './entities/about.entity';
import { FullSession } from './entities/full-session.entity';
import { SessionOriginalFile } from './entities/session-original-file.entity';
import { SocialLink } from './entities/social-link.entity';

import { BestPhotosService } from './services/best-photos.service';
import { PortfolioCategoriesService } from './services/portfolio-categories.service';
import { PortfolioSessionsService } from './services/portfolio-sessions.service';
import { PortfolioPhotosService } from './services/portfolio-photos.service';
import { PriceItemsService } from './services/price-items.service';
import { ReviewsService } from './services/reviews.service';
import { AboutService } from './services/about.service';
import { FullSessionsService } from './services/full-sessions.service';
import { DownloadService } from './services/download.service';
import { SocialLinksService } from './services/social-links.service';

import { PublicContentController } from './controllers/public-content.controller';
import { AdminBestPhotosController } from './controllers/admin-best-photos.controller';
import { AdminPortfolioCategoriesController } from './controllers/admin-portfolio-categories.controller';
import { AdminPortfolioSessionsController } from './controllers/admin-portfolio-sessions.controller';
import { AdminPortfolioPhotosController } from './controllers/admin-portfolio-photos.controller';
import { AdminPriceItemsController } from './controllers/admin-price-items.controller';
import { AdminReviewsController } from './controllers/admin-reviews.controller';
import { AdminAboutController } from './controllers/admin-about.controller';
import { AdminFullSessionsController } from './controllers/admin-full-sessions.controller';
import { DownloadController } from './controllers/download.controller';
import { AdminSocialLinksController } from './controllers/admin-social-links.controller';

import { S3Module } from '../s3/s3.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BestPhoto,
      PortfolioCategory,
      PortfolioSession,
      PortfolioPhoto,
      PriceItem,
      Review,
      About,
      FullSession,
      SessionOriginalFile,
      SocialLink,
    ]),
    S3Module,
    UploadModule,
  ],
  providers: [
    BestPhotosService,
    PortfolioCategoriesService,
    PortfolioSessionsService,
    PortfolioPhotosService,
    PriceItemsService,
    ReviewsService,
    AboutService,
    FullSessionsService,
    DownloadService,
    SocialLinksService,
  ],
  controllers: [
    PublicContentController,
    AdminBestPhotosController,
    AdminPortfolioCategoriesController,
    AdminPortfolioSessionsController,
    AdminPortfolioPhotosController,
    AdminPriceItemsController,
    AdminReviewsController,
    AdminAboutController,
    AdminFullSessionsController,
    DownloadController,
    AdminSocialLinksController,
  ],
  exports: [
    BestPhotosService,
    PortfolioCategoriesService,
    PortfolioSessionsService,
    PortfolioPhotosService,
    PriceItemsService,
    ReviewsService,
    AboutService,
    SocialLinksService,
  ],
})
export class ContentModule {}
