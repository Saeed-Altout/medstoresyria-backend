import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../../common/enums/role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true, type: 'text' })
  password!: string | null;

  @Column({ unique: true, nullable: true, type: 'text' })
  google_id!: string | null;

  @Column({ nullable: true, type: 'text' })
  phone!: string | null;

  @Column()
  first_name!: string;

  @Column()
  last_name!: string;

  @Column({ type: 'enum', enum: Role, default: Role.CUSTOMER })
  role!: Role;

  @Column({ nullable: true, type: 'text' })
  refresh_token!: string | null;

  @Column({ type: 'varchar', length: 10, default: 'en' })
  locale!: string;

  @Column({ default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @OneToMany('UserAddress', 'user')
  addresses!: unknown[];

  @OneToMany('Order', 'user')
  orders!: unknown[];

  @OneToMany('MaintenanceRequest', 'user')
  maintenance_requests!: unknown[];

  @OneToMany('Notification', 'user')
  notifications!: unknown[];

  @OneToMany('InventoryLog', 'user')
  inventory_logs!: unknown[];
}
