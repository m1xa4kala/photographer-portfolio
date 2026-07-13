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
        fullName: 'Влада Хайбуллина',
        bioText:
          'Привет! Меня зовут Влада. Я — фотограф, который любит живые кадры, эмоции и атмосферу момента. Уже 3 года я помогаю людям видеть себя красивыми, настоящими и особенными через фотографию. Особенно мне близки индивидуальные и репортажные съёмки: люблю ловить искренние эмоции, движение и детали, которые невозможно повторить дважды. Но также с удовольствием снимаю love story и семейные истории — про тепло, близость и чувства.',
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
