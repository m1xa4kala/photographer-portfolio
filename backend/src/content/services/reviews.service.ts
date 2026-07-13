import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../entities/review.entity';
import { CreateReviewDto } from '../dtos/create-review.dto';
import { UpdateReviewDto } from '../dtos/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private repo: Repository<Review>,
  ) {}

  async findAll(limit: number = 100, offset: number = 0): Promise<Review[]> {
    return this.repo.find({ order: { id: 'DESC' }, take: limit, skip: offset });
  }

  async findOne(id: number): Promise<Review> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Review with id ${id} not found`);
    }
    return item;
  }

  async create(dto: CreateReviewDto): Promise<Review> {
    const newItem = this.repo.create(dto);
    return this.repo.save(newItem);
  }

  async update(id: number, dto: UpdateReviewDto): Promise<Review> {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async delete(id: number): Promise<void> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Review with id ${id} not found`);
    }
  }
}
