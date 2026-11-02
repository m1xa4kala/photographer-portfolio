import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('wedding_faq_items')
export class WeddingFaqItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  question!: string;

  @Column('text')
  answer!: string;

  @Column({ default: 0 })
  orderIndex!: number;
}
