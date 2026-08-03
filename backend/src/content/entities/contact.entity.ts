import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('contacts')
export class Contact {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  type!: string; // 'phone' | 'social'

  @Column()
  value!: string; // phone number or URL

  @Column({ nullable: true })
  platform!: string | null;

  @Column({ nullable: true })
  iconName!: string | null;

  @Column({ nullable: true })
  label!: string | null;

  @Column({ default: 0 })
  orderIndex!: number;
}