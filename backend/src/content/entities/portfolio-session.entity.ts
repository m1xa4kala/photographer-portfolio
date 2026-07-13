import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { PortfolioCategory } from './portfolio-category.entity';
import { PortfolioPhoto } from './portfolio-photo.entity';

@Entity('portfolio_sessions')
export class PortfolioSession {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ default: 0 })
  orderIndex!: number;

  @Column()
  @Index()
  categoryId!: number;

  @ManyToOne(() => PortfolioCategory, (category) => category.sessions)
  @JoinColumn({ name: 'categoryId' })
  category!: PortfolioCategory;

  @OneToMany(() => PortfolioPhoto, (photo) => photo.session)
  photos!: PortfolioPhoto[];
}
