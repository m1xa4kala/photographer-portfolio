import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('about')
export class About {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', nullable: true })
  photoUrl!: string | null;

  @Column()
  fullName!: string;

  @Column('text')
  bioText!: string;
}
