import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Gender, Step } from '../types';

@Entity('users')
export class User {
  @PrimaryColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  username: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  name: string | null;

  @Column({ type: 'int', nullable: true })
  age: number | null;

  @Index()
  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender: Gender | null;

  @Index()
  @Column({ type: 'enum', enum: Gender, nullable: true })
  lookingFor: Gender | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  bio: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  photoFileId: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  phone: string | null;

  @Column({ type: 'enum', enum: Step, default: Step.NONE })
  step: Step;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
