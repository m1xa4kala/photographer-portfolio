import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PortfolioPhoto } from '../entities/portfolio-photo.entity';
import { CreatePortfolioPhotoDto } from '../dtos/create-portfolio-photo.dto';
import { UpdatePortfolioPhotoDto } from '../dtos/update-portfolio-photo.dto';
import { ReorderDto } from '../dto/reorder.dto';

@Injectable()
export class PortfolioPhotosService {
  constructor(
    @InjectRepository(PortfolioPhoto)
    private repo: Repository<PortfolioPhoto>,
  ) {}

  async findAll(): Promise<PortfolioPhoto[]> {
    return this.repo.find({ order: { orderIndex: 'ASC' } });
  }

  async findOne(id: number): Promise<PortfolioPhoto> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Portfolio photo with id ${id} not found`);
    }
    return item;
  }

  async findBySession(sessionId: number): Promise<PortfolioPhoto[]> {
    return this.repo.find({
      where: { sessionId },
      order: { orderIndex: 'ASC' },
    });
  }

  async create(dto: CreatePortfolioPhotoDto): Promise<PortfolioPhoto> {
    const max = await this.repo.maximum('orderIndex');
    const newItem = this.repo.create({ ...dto, orderIndex: (max ?? -1) + 1 });
    return this.repo.save(newItem);
  }

  async update(
    id: number,
    dto: UpdatePortfolioPhotoDto,
  ): Promise<PortfolioPhoto> {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async delete(id: number): Promise<void> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Portfolio photo with id ${id} not found`);
    }
  }

  async reorder(dto: ReorderDto): Promise<void> {
    for (const { id, orderIndex } of dto.items) {
      await this.repo.update(id, { orderIndex });
    }
  }
}
