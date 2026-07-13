import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  clientName!: string;

  @Column('text')
  text!: string;

  @Column({ type: 'varchar', nullable: true })
  clientPhotoUrl!: string | null;
}
