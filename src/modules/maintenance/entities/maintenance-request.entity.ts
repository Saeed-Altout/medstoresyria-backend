import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { MaintenanceStatusLog } from './maintenance-status-log.entity';
import { MaintenanceStatus, VisitType } from '../../../common/enums/maintenance-status.enum';

export { MaintenanceStatus, VisitType };

@Entity('maintenance_requests')
export class MaintenanceRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  request_number!: string;

  @Column()
  customer_name!: string;

  @Column()
  customer_email!: string;

  @Column()
  customer_phone!: string;

  @Column()
  device_type!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'simple-json', default: '[]' })
  images!: string[];

  @Column({ type: 'varchar', length: 10, default: 'en' })
  locale!: string;

  @Column({ type: 'enum', enum: MaintenanceStatus, default: MaintenanceStatus.PENDING })
  status!: MaintenanceStatus;

  @Column({ type: 'enum', enum: VisitType })
  visit_type!: VisitType;

  @Column({ nullable: true, type: 'timestamp' })
  scheduled_at!: Date | null;

  @Column({ nullable: true, type: 'text' })
  notes!: string | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => User, (user) => user.maintenance_requests, { nullable: true, onDelete: 'SET NULL' })
  user!: User | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  technician!: User | null;

  @OneToMany(() => MaintenanceStatusLog, (log) => log.maintenanceRequest, { cascade: true })
  status_logs!: MaintenanceStatusLog[];
}
