import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { About } from '../entities/about.entity';
import { UpdateAboutDto } from '../dtos/update-about.dto';

@Injectable()
export class AboutService {
  constructor(
    @InjectRepository(About)
    private repo: Repository<About>,
  ) {}

  private async ensureRecord(): Promise<About> {
    let about = await this.repo.findOne({ where: {} });
    if (!about) {
      about = this.repo.create({
        fullName: 'Анна Иванова',
        bioText:
          'Фотограф с 7-летним стажем. Запечатлеваю эмоции и моменты, которые останутся с вами навсегда.',
        equipmentText: 'Sony A7IV, объективы GM, студийный свет Profoto',
        experience: '7 лет',
      });
      about = await this.repo.save(about);
    }
    return about;
  }

  async get(): Promise<About> {
    return this.ensureRecord();
  }

  async update(dto: UpdateAboutDto): Promise<About> {
    const about = await this.ensureRecord();
    Object.assign(about, dto);
    return this.repo.save(about);
  }
}
