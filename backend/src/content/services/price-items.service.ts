import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PriceItem } from '../entities/price-item.entity';
import { CreatePriceItemDto } from '../dtos/create-price-item.dto';
import { UpdatePriceItemDto } from '../dtos/update-price-item.dto';
import { ReorderDto } from '../dto/reorder.dto';

@Injectable()
export class PriceItemsService {
  constructor(
    @InjectRepository(PriceItem)
    private repo: Repository<PriceItem>,
  ) {}

  async findAll(): Promise<PriceItem[]> {
    return this.repo.find({ order: { orderIndex: 'ASC' } });
  }

  async findOne(id: number): Promise<PriceItem> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Price item with id ${id} not found`);
    }
    return item;
  }

  async create(dto: CreatePriceItemDto): Promise<PriceItem> {
    const max = await this.repo.maximum('orderIndex');
    const newItem = this.repo.create({ ...dto, orderIndex: (max ?? -1) + 1 });
    return this.repo.save(newItem);
  }

  async update(id: number, dto: UpdatePriceItemDto): Promise<PriceItem> {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async delete(id: number): Promise<void> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Price item with id ${id} not found`);
    }
  }

  async reorder(dto: ReorderDto): Promise<void> {
    for (const { id, orderIndex } of dto.items) {
      await this.repo.update(id, { orderIndex });
    }
  }
}
