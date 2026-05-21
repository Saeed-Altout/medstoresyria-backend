import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MaintenanceRequest } from './maintenance-request.entity';
import { User } from '../../users/entities/user.entity';
import { MaintenanceStatus } from '../../../common/enums/maintenance-status.enum';

@Entity('maintenance_status_logs')
export class MaintenanceStatusLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: MaintenanceStatus })
  status!: MaintenanceStatus;

  @Column({ nullable: true, type: 'text' })
  note!: string | null;

  @CreateDateColumn()
  created_at!: Date;

  @ManyToOne(() => MaintenanceRequest, (req) => req.status_logs, { onDelete: 'CASCADE' })
  maintenanceRequest!: MaintenanceRequest;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  user!: User | null;
}
