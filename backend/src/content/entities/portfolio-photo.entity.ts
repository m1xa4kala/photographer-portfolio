import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PortfolioSession } from './portfolio-session.entity';

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
  @Index()
  sessionId!: number;

  @ManyToOne(() => PortfolioSession, (session) => session.photos)
  @JoinColumn({ name: 'sessionId' })
  session!: PortfolioSession;
}
