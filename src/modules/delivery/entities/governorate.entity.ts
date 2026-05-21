import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('governorates')
export class Governorate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  name_local!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  delivery_fee_usd!: string;

  @Column({ default: true })
  is_active!: boolean;

  @OneToMany('Order', 'governorate')
  orders!: unknown[];

  @OneToMany('UserAddress', 'governorate')
  user_addresses!: unknown[];
}
