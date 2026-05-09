import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PortfolioCategory } from '../entities/portfolio-category.entity';
import { CreatePortfolioCategoryDto } from '../dtos/create-portfolio-category.dto';
import { UpdatePortfolioCategoryDto } from '../dtos/update-portfolio-category.dto';

@Injectable()
export class PortfolioCategoriesService {
  constructor(
    @InjectRepository(PortfolioCategory)
    private repo: Repository<PortfolioCategory>,
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
    const newItem = this.repo.create(dto);
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
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
  }
}
