import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  clientName!: string;

  @Column('text')
  text!: string;

  @Column({ type: 'int', default: 5 })
  rating!: number;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  date!: Date;
}
