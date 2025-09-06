import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity()
export class Photo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  filename: string;

  @Column()
  mimetype: string;

  @Column({ type: 'bytea' })
  data: Buffer;

  @CreateDateColumn()
  uploadedAt: Date;

  @ManyToOne(() => Order, (order) => order.photos, { onDelete: 'CASCADE' })
  order: Order;
}
