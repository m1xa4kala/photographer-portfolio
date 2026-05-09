import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('best_photos')
export class BestPhoto {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column()
  imageUrl!: string;

  @Column({ default: 0 })
  orderIndex!: number;
}
