import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialLink } from '../entities/social-link.entity';
import { CreateSocialLinkDto } from '../dtos/create-social-link.dto';
import { UpdateSocialLinkDto } from '../dtos/update-social-link.dto';
import { ReorderDto } from '../dtos/reorder.dto';

@Injectable()
export class SocialLinksService {
  constructor(
    @InjectRepository(SocialLink)
    private repo: Repository<SocialLink>,
  ) {}

  async findAll(
    limit: number = 100,
    offset: number = 0,
  ): Promise<SocialLink[]> {
    return this.repo.find({
      order: { orderIndex: 'ASC' },
      take: limit,
      skip: offset,
    });
  }

  async findOne(id: number): Promise<SocialLink> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Social link with id ${id} not found`);
    }
    return item;
  }

  async create(dto: CreateSocialLinkDto): Promise<SocialLink> {
    const max = await this.repo.maximum('orderIndex');
    const newItem = this.repo.create({ ...dto, orderIndex: (max ?? -1) + 1 });
    return this.repo.save(newItem);
  }

  async update(id: number, dto: UpdateSocialLinkDto): Promise<SocialLink> {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async delete(id: number): Promise<void> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Social link with id ${id} not found`);
    }
  }

  async reorder(dto: ReorderDto): Promise<void> {
    const queryRunner = this.repo.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      for (const { id, orderIndex } of dto.items) {
        await queryRunner.manager.update(this.repo.metadata.target, id, {
          orderIndex,
        });
      }
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
