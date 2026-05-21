import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Governorate } from '../../delivery/entities/governorate.entity';

@Entity('user_addresses')
export class UserAddress {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  label!: string;

  @Column({ type: 'text' })
  address_detail!: string;

  @Column({ default: false })
  is_default!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @ManyToOne(() => User, (user) => user.addresses, { onDelete: 'CASCADE' })
  user!: User;

  @ManyToOne(() => Governorate, (gov) => gov.user_addresses, { nullable: true, onDelete: 'SET NULL' })
  governorate!: Governorate | null;
}
