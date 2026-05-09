import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { PortfolioPhoto } from './portfolio-photo.entity';

@Entity('portfolio_categories')
export class PortfolioCategory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @Column({ unique: true })
  slug!: string;

  @Column({ default: 0 })
  orderIndex!: number;

  @OneToMany(() => PortfolioPhoto, (photo) => photo.category)
  photos!: PortfolioPhoto[];
}
