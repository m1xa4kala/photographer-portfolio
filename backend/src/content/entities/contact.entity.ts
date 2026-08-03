import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('contacts')
export class Contact {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  type!: string; // 'phone' | 'social'

  @Column()
  value!: string; // phone number or URL

  @Column({ type: 'varchar', nullable: true })
  platform!: string | null;

  @Column({ type: 'varchar', nullable: true })
  iconName!: string | null;

  @Column({ type: 'varchar', nullable: true })
  label!: string | null;

  @Column({ default: 0 })
  orderIndex!: number;
}
