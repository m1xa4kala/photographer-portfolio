import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { PortfolioSession } from './portfolio-session.entity';

@Entity('portfolio_categories')
export class PortfolioCategory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @Column({ unique: true })
  slug!: string;

  @Column({ nullable: true })
  coverImageUrl?: string;

  @Column({ default: 0 })
  orderIndex!: number;

  @OneToMany(() => PortfolioSession, (session) => session.category)
  sessions!: PortfolioSession[];
}
