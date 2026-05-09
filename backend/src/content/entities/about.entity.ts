import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('about')
export class About {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  photoUrl!: string;

  @Column()
  fullName!: string;

  @Column('text')
  bioText!: string;

  @Column('text', { nullable: true })
  equipmentText!: string;

  @Column({ nullable: true })
  experience!: string;

  @Column({ nullable: true })
  email!: string;

  @Column({ nullable: true })
  phone!: string;

  @Column({ type: 'json', nullable: true })
  socialLinks!: { instagram?: string; telegram?: string; vk?: string };
}
