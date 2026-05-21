import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export interface NotificationTranslation {
  locale: string;
  title: string;
  body: string;
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  type!: string;

  @Column({ type: 'simple-json' })
  translations!: NotificationTranslation[];

  @Column({ default: false })
  is_read!: boolean;

  @Column({ nullable: true, type: 'uuid' })
  reference_id!: string | null;

  @CreateDateColumn()
  created_at!: Date;

  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  user!: User;
}
