import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PortfolioCategory } from '../entities/portfolio-category.entity';
import { PortfolioSession } from '../entities/portfolio-session.entity';
import { PortfolioPhoto } from '../entities/portfolio-photo.entity';
import { CreatePortfolioCategoryDto } from '../dtos/create-portfolio-category.dto';
import { UpdatePortfolioCategoryDto } from '../dtos/update-portfolio-category.dto';
import { ReorderDto } from '../dto/reorder.dto';

@Injectable()
export class PortfolioCategoriesService {
  constructor(
    @InjectRepository(PortfolioCategory)
    private repo: Repository<PortfolioCategory>,
    @InjectRepository(PortfolioSession)
    private sessionRepo: Repository<PortfolioSession>,
    @InjectRepository(PortfolioPhoto)
    private photoRepo: Repository<PortfolioPhoto>,
  ) {}

  async findAll(): Promise<PortfolioCategory[]> {
    return this.repo.find({ order: { orderIndex: 'ASC' } });
  }

  async findOne(id: number): Promise<PortfolioCategory> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    return item;
  }

  async findBySlug(slug: string): Promise<PortfolioCategory | null> {
    return this.repo.findOne({ where: { slug } });
  }

  async create(dto: CreatePortfolioCategoryDto): Promise<PortfolioCategory> {
    const max = await this.repo.maximum('orderIndex');
    const newItem = this.repo.create({ ...dto, orderIndex: (max ?? -1) + 1 });
    return this.repo.save(newItem);
  }

  async update(
    id: number,
    dto: UpdatePortfolioCategoryDto,
  ): Promise<PortfolioCategory> {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async delete(id: number): Promise<void> {
    // Удаляем все сессии и их фото, принадлежащие этой категории
    const sessions = await this.sessionRepo.find({ where: { categoryId: id } });
    for (const session of sessions) {
      await this.photoRepo.delete({ sessionId: session.id });
    }
    await this.sessionRepo.delete({ categoryId: id });
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
  }

  async reorder(dto: ReorderDto): Promise<void> {
    for (const { id, orderIndex } of dto.items) {
      await this.repo.update(id, { orderIndex });
    }
  }
}
