import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
} from 'typeorm';
import { SessionOriginalFile } from './session-original-file.entity';

@Entity('full_sessions')
export class FullSession {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ nullable: true, type: 'text' })
  description!: string | null;

  @Column({ nullable: true, unique: true, type: 'varchar' })
  @Index()
  downloadToken!: string | null;

  @Column({ default: false })
  downloadsEnabled!: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @OneToMany(() => SessionOriginalFile, (file) => file.fullSession)
  originalFiles!: SessionOriginalFile[];
}
