import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BestPhoto } from '../entities/best-photo.entity';
import { CreateBestPhotoDto } from '../dtos/create-best-photo.dto';
import { UpdateBestPhotoDto } from '../dtos/update-best-photo.dto';

@Injectable()
export class BestPhotosService {
  constructor(
    @InjectRepository(BestPhoto)
    private repo: Repository<BestPhoto>,
  ) {}

  async findAll(): Promise<BestPhoto[]> {
    return this.repo.find({ order: { orderIndex: 'ASC' } });
  }

  async findOne(id: number): Promise<BestPhoto> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Best photo with id ${id} not found`);
    }
    return item;
  }

  async create(dto: CreateBestPhotoDto): Promise<BestPhoto> {
    const newItem = this.repo.create(dto);
    return this.repo.save(newItem);
  }

  async update(id: number, dto: UpdateBestPhotoDto): Promise<BestPhoto> {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async delete(id: number): Promise<void> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Best photo with id ${id} not found`);
    }
  }
}
