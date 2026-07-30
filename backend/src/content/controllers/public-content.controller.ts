import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { BestPhotosService } from '../services/best-photos.service';
import { PortfolioCategoriesService } from '../services/portfolio-categories.service';
import { PortfolioSessionsService } from '../services/portfolio-sessions.service';
import { PortfolioPhotosService } from '../services/portfolio-photos.service';
import { PriceItemsService } from '../services/price-items.service';
import { ReviewsService } from '../services/reviews.service';
import { AboutService } from '../services/about.service';
import { SocialLinksService } from '../services/social-links.service';

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
    private socialLinksService: SocialLinksService,
  ) {}

  @Get('best-photos')
  async getBestPhotos(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.bestPhotosService.findAll(limit ?? 100, offset ?? 0);
  }

  @Get('portfolio-home')
  async getHomePortfolio(@Query('limit') limit?: number) {
    const take = limit ?? 6;
    const sessions = await this.portfolioSessionsService.findAll(take, 0);
    const sessionsWithCover = await Promise.all(
      sessions.map(async (session) => {
        const [photo] = await this.portfolioPhotosService.findBySession(
          session.id,
          1,
          0,
        );
        return {
          id: session.id,
          name: session.name,
          orderIndex: session.orderIndex,
          categoryId: session.categoryId,
          coverImageUrl: photo?.imageUrl ?? null,
        };
      }),
    );
    return sessionsWithCover;
  }

  @Get('portfolio-sessions-with-covers')
  async getPortfolioSessionsWithCovers(
    @Query('categoryId') categoryId?: string,
  ) {
    const catId = categoryId ? parseInt(categoryId, 10) : undefined;
    if (catId !== undefined && isNaN(catId)) {
      throw new BadRequestException('Invalid categoryId');
    }
    const sessions =
      catId !== undefined
        ? await this.portfolioSessionsService.findByCategory(catId, 100, 0)
        : await this.portfolioSessionsService.findAll(100, 0);
    const sessionsWithCover = await Promise.all(
      sessions.map(async (session) => {
        const [photo] = await this.portfolioPhotosService.findBySession(
          session.id,
          1,
          0,
        );
        return {
          id: session.id,
          name: session.name,
          orderIndex: session.orderIndex,
          categoryId: session.categoryId,
          coverImageUrl: photo?.imageUrl ?? null,
        };
      }),
    );
    return sessionsWithCover;
  }

  @Get('portfolio-categories')
  async getPortfolioCategories(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.portfolioCategoriesService.findAll(limit ?? 100, offset ?? 0);
  }

  @Get('portfolio-sessions')
  async getPortfolioSessions(
    @Query('categoryId') categoryId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    if (categoryId) {
      const catId = parseInt(categoryId, 10);
      if (isNaN(catId)) {
        throw new BadRequestException('Invalid categoryId');
      }
      return this.portfolioSessionsService.findByCategory(
        catId,
        limit ?? 100,
        offset ?? 0,
      );
    }
    return this.portfolioSessionsService.findAll(limit ?? 100, offset ?? 0);
  }

  @Get('portfolio-photos')
  async getPortfolioPhotos(
    @Query('sessionId') sessionId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    if (sessionId) {
      const sId = parseInt(sessionId, 10);
      if (isNaN(sId)) {
        throw new BadRequestException('Invalid sessionId');
      }
      return this.portfolioPhotosService.findBySession(
        sId,
        limit ?? 10000,
        offset ?? 0,
      );
    }
    return this.portfolioPhotosService.findAll(limit ?? 10000, offset ?? 0);
  }

  @Get('price-items')
  async getPriceItems(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.priceItemsService.findAll(limit ?? 100, offset ?? 0);
  }

  @Get('reviews')
  async getActiveReviews(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.reviewsService.findAll(limit ?? 100, offset ?? 0);
  }

  @Get('about')
  async getAbout() {
    return this.aboutService.get();
  }

  @Get('social-links')
  async getSocialLinks(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.socialLinksService.findAll(limit ?? 100, offset ?? 0);
  }
}
