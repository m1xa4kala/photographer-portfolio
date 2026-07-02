import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BestPhoto } from './entities/best-photo.entity';
import { PortfolioCategory } from './entities/portfolio-category.entity';
import { PortfolioSession } from './entities/portfolio-session.entity';
import { PortfolioPhoto } from './entities/portfolio-photo.entity';
import { PriceItem } from './entities/price-item.entity';
import { Review } from './entities/review.entity';
import { About } from './entities/about.entity';

import { BestPhotosService } from './services/best-photos.service';
import { PortfolioCategoriesService } from './services/portfolio-categories.service';
import { PortfolioSessionsService } from './services/portfolio-sessions.service';
import { PortfolioPhotosService } from './services/portfolio-photos.service';
import { PriceItemsService } from './services/price-items.service';
import { ReviewsService } from './services/reviews.service';
import { AboutService } from './services/about.service';

import { PublicContentController } from './controllers/public-content.controller';
import { AdminBestPhotosController } from './controllers/admin-best-photos.controller';
import { AdminPortfolioCategoriesController } from './controllers/admin-portfolio-categories.controller';
import { AdminPortfolioSessionsController } from './controllers/admin-portfolio-sessions.controller';
import { AdminPortfolioPhotosController } from './controllers/admin-portfolio-photos.controller';
import { AdminPriceItemsController } from './controllers/admin-price-items.controller';
import { AdminReviewsController } from './controllers/admin-reviews.controller';
import { AdminAboutController } from './controllers/admin-about.controller';

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
    ]),
  ],
  providers: [
    BestPhotosService,
    PortfolioCategoriesService,
    PortfolioSessionsService,
    PortfolioPhotosService,
    PriceItemsService,
    ReviewsService,
    AboutService,
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
  ],
  exports: [
    BestPhotosService,
    PortfolioCategoriesService,
    PortfolioSessionsService,
    PortfolioPhotosService,
    PriceItemsService,
    ReviewsService,
    AboutService,
  ],
})
export class ContentModule {}
