import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Service {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  shortTitle: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'numeric' })
  price: number;

  @Column({ type: 'numeric', default: 0 })
  notaryPrice: number;

  @Column({ type: 'numeric', default: 0 })
  deliveryPrice: number;

  @Column({ type: 'text' })
  iconSvg: string;

  @CreateDateColumn()
  createdAt: Date;
}
