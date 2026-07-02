import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PortfolioSession } from '../entities/portfolio-session.entity';
import { PortfolioPhoto } from '../entities/portfolio-photo.entity';
import { CreatePortfolioSessionDto } from '../dtos/create-portfolio-session.dto';
import { UpdatePortfolioSessionDto } from '../dtos/update-portfolio-session.dto';
import { ReorderDto } from '../dto/reorder.dto';

@Injectable()
export class PortfolioSessionsService {
  constructor(
    @InjectRepository(PortfolioSession)
    private repo: Repository<PortfolioSession>,
    @InjectRepository(PortfolioPhoto)
    private photoRepo: Repository<PortfolioPhoto>,
  ) {}

  async findAll(): Promise<PortfolioSession[]> {
    return this.repo.find({ order: { orderIndex: 'ASC' } });
  }

  async findOne(id: number): Promise<PortfolioSession> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Session with id ${id} not found`);
    }
    return item;
  }

  async findByCategory(categoryId: number): Promise<PortfolioSession[]> {
    return this.repo.find({
      where: { categoryId },
      order: { orderIndex: 'ASC' },
    });
  }

  async create(dto: CreatePortfolioSessionDto): Promise<PortfolioSession> {
    const max = await this.repo.maximum('orderIndex');
    const newItem = this.repo.create({ ...dto, orderIndex: (max ?? -1) + 1 });
    return this.repo.save(newItem);
  }

  async update(
    id: number,
    dto: UpdatePortfolioSessionDto,
  ): Promise<PortfolioSession> {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async delete(id: number): Promise<void> {
    // Удаляем все фото, принадлежащие этой сессии
    await this.photoRepo.delete({ sessionId: id });
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Session with id ${id} not found`);
    }
  }

  async reorder(dto: ReorderDto): Promise<void> {
    for (const { id, orderIndex } of dto.items) {
      await this.repo.update(id, { orderIndex });
    }
  }
}