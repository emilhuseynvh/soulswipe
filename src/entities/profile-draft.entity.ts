import { Column, Entity, PrimaryColumn } from 'typeorm';
import { Gender } from '../types';

@Entity('profile_drafts')
export class ProfileDraft {
  @PrimaryColumn({ type: 'bigint', unsigned: true })
  userId: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  name: string | null;

  @Column({ type: 'int', nullable: true })
  age: number | null;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender: Gender | null;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  lookingFor: Gender | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  bio: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  photoFileId: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  phone: string | null;
}
