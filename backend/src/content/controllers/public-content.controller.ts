import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { BestPhotosService } from '../services/best-photos.service';
import { PortfolioCategoriesService } from '../services/portfolio-categories.service';
import { PortfolioSessionsService } from '../services/portfolio-sessions.service';
import { PortfolioPhotosService } from '../services/portfolio-photos.service';
import { PriceItemsService } from '../services/price-items.service';
import { ReviewsService } from '../services/reviews.service';
import { AboutService } from '../services/about.service';

@Controller('content')
export class PublicContentController {
  constructor(
    private bestPhotosService: BestPhotosService,
    private portfolioCategoriesService: PortfolioCategoriesService,
    private portfolioSessionsService: PortfolioSessionsService,
    private portfolioPhotosService: PortfolioPhotosService,
    private priceItemsService: PriceItemsService,
    private reviewsService: ReviewsService,
    private aboutService: AboutService,
  ) {}

  @Get('best-photos')
  async getBestPhotos() {
    return this.bestPhotosService.findAll();
  }

  @Get('portfolio-categories')
  async getPortfolioCategories() {
    return this.portfolioCategoriesService.findAll();
  }

  @Get('portfolio-sessions')
  async getPortfolioSessions(@Query('categoryId') categoryId?: string) {
    if (categoryId) {
      const catId = parseInt(categoryId, 10);
      if (isNaN(catId)) {
        throw new BadRequestException('Invalid categoryId');
      }
      return this.portfolioSessionsService.findByCategory(catId);
    }
    return this.portfolioSessionsService.findAll();
  }

  @Get('portfolio-photos')
  async getPortfolioPhotos(@Query('sessionId') sessionId?: string) {
    if (sessionId) {
      const sId = parseInt(sessionId, 10);
      if (isNaN(sId)) {
        throw new BadRequestException('Invalid sessionId');
      }
      return this.portfolioPhotosService.findBySession(sId);
    }
    return this.portfolioPhotosService.findAll();
  }

  @Get('price-items')
  async getPriceItems() {
    return this.priceItemsService.findAll();
  }

  @Get('reviews')
  async getActiveReviews() {
    return this.reviewsService.findActive();
  }

  @Get('about')
  async getAbout() {
    return this.aboutService.get();
  }
}
