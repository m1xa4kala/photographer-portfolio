import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PortfolioCategory } from './portfolio-category.entity';

@Entity('portfolio_photos')
export class PortfolioPhoto {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column()
  imageUrl!: string;

  @Column({ default: 0 })
  orderIndex!: number;

  @Column()
  categoryId!: number;

  @ManyToOne(() => PortfolioCategory)
  @JoinColumn({ name: 'categoryId' })
  category!: PortfolioCategory;
}
