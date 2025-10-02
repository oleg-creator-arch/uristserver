import { Photo } from 'src/photo/entities/photo.entity';
import { Service } from 'src/service/entities/service.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
export enum OrderStatus {
  FILLING = 'filling',
  PAID = 'paid',
  COMPLETED = 'completed',
}

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.orders, { onDelete: 'CASCADE' })
  user: User;

  @OneToMany(() => Photo, (photo) => photo.order)
  photos: Photo[];

  @ManyToOne(() => Service, { eager: true })
  service: Service;

  @Column({ type: 'int', default: 1 })
  pages: number;

  @Column({ type: 'boolean', default: false })
  notary: boolean;

  @Column({ type: 'numeric', default: 0 })
  notaryPrice: number;

  @Column({ type: 'boolean', default: false })
  delivery: boolean;

  @Column({ type: 'numeric', default: 0 })
  deliveryPrice: number;

  @Column({ type: 'numeric', default: 0 })
  servicePrice: number;

  @Column({ type: 'numeric', default: 0 })
  totalPrice: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.FILLING })
  status: OrderStatus;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'text' })
  documentType: string;

  @Column({ type: 'text' })
  fromLanguage: string;

  @Column({ type: 'text' })
  toLanguage: string;

  @Column({ type: 'int', default: 0 })
  readyInDays: number;

  @Column({ type: 'uuid', unique: true })
  idempotenceKey: string;

  @Column({ type: 'uuid', nullable: true })
  paymentId?: string;

  @BeforeInsert()
  @BeforeUpdate()
  calculateTotal() {
    const servicePrice = parseFloat(this.servicePrice as any) || 0;
    const notaryPrice = parseFloat(this.notaryPrice as any) || 0;
    const deliveryPrice = parseFloat(this.deliveryPrice as any) || 0;

    const base = servicePrice * this.pages;
    const notary = this.notary ? notaryPrice : 0;
    const delivery = this.delivery ? deliveryPrice : 0;

    this.totalPrice = base + notary + delivery;
  }
  @BeforeInsert()
  setDefaults() {
    if (!this.idempotenceKey) {
      this.idempotenceKey = uuidv4();
    }
  }
}
