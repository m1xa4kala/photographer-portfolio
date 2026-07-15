import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  AfterLoad,
} from 'typeorm';
import { FullSession } from './full-session.entity';

@Entity('session_original_files')
export class SessionOriginalFile {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @Index()
  fullSessionId!: number;

  @ManyToOne(() => FullSession, (session) => session.originalFiles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'fullSessionId' })
  fullSession!: FullSession;

  @Column()
  originalName!: string;

  @Column()
  s3Key!: string;

  @Column({ type: 'bigint', default: 0 })
  fileSize!: number;

  @AfterLoad()
  convertFileSize() {
    if (typeof this.fileSize === 'string') {
      this.fileSize = parseInt(this.fileSize, 10) || 0;
    }
  }

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  uploadedAt!: Date;
}
