import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('social_links')
export class SocialLink {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  platform!: string;

  @Column()
  url!: string;

  @Column()
  iconName!: string;

  @Column({ default: 0 })
  orderIndex!: number;
}
