import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { ReactionType } from '../types';

@Entity('reactions')
@Unique(['fromId', 'toId'])
@Index(['toId', 'type'])
export class Reaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', unsigned: true })
  fromId: string;

  @Column({ type: 'bigint', unsigned: true })
  toId: string;

  @Column({ type: 'enum', enum: ReactionType })
  type: ReactionType;

  @ManyToOne(() => User, (u) => u.id)
  from: User;

  @ManyToOne(() => User, (u) => u.id)
  to: User;

  @CreateDateColumn()
  createdAt: Date;
}
