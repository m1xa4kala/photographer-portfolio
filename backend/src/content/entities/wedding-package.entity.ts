import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export interface PriceOption {
  label: string;
  amount: string;
}

@Entity('wedding_packages')
export class WeddingPackage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  duration!: string;

  @Column('text', { nullable: true })
  includes!: string | null;

  @Column({ type: 'varchar', nullable: true })
  imageUrl!: string | null;

  @Column('json', { default: [] })
  prices!: PriceOption[];

  @Column({ default: 0 })
  orderIndex!: number;
}
