import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('price_items')
export class PriceItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column('text', { nullable: true })
  description!: string;

  @Column()
  price!: string; // e.g. "8 000"

  @Column({ default: 0 })
  orderIndex!: number;
}
