import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { User } from 'src/user/entities/user.entity';
import { Service } from 'src/service/entities/service.entity';
import { Photo } from 'src/photo/entities/photo.entity';
import { CreateOrderDto, DeliveryFormat } from './dto/create-order.dto';
import { PaymentService } from 'src/payment/payment.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    @InjectRepository(Photo)
    private readonly photoRepo: Repository<Photo>,
    private readonly paymentService: PaymentService,
  ) {}

  async getFillingOrder(userId: number): Promise<Order> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');

    let order = await this.orderRepo.findOne({
      where: { user: { id: userId }, status: OrderStatus.FILLING },
      relations: ['service', 'photos'],
    });

    if (!order) {
      order = this.orderRepo.create({ user, status: OrderStatus.FILLING });
      await this.orderRepo.save(order);
    }

    return order;
  }

  async createOrUpdateOrder(
    userId: number,
    dto: CreateOrderDto,
  ): Promise<Order> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');

    let order = await this.orderRepo.findOne({
      where: { user: { id: userId }, status: OrderStatus.FILLING },
      relations: ['service', 'photos'],
    });

    const service = await this.serviceRepo.findOneBy({ id: dto.serviceId });
    if (!service) throw new NotFoundException('Service not found');

    if (!order) {
      order = this.orderRepo.create({ user, status: OrderStatus.FILLING });
    }

    order.service = service;
    order.pages = dto.pagesCount;
    order.notary = dto.notarization;
    order.delivery = dto.deliveryFormat === DeliveryFormat.COURIER;
    order.address = dto.address;
    order.documentType = dto.documentType;
    order.fromLanguage = dto.fromLanguage;
    order.toLanguage = dto.toLanguage;
    order.servicePrice = service.price;
    order.notaryPrice = service.notaryPrice ?? 0;
    order.deliveryPrice = service.deliveryPrice ?? 0;

    return this.orderRepo.save(order);
  }

  async uploadPhotos(
    userId: number,
    orderId: number,
    files: Express.Multer.File[],
  ): Promise<Photo[]> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, user: { id: userId } },
    });
    if (!order) throw new NotFoundException('Order not found');

    const photos = files.map((file) => {
      const photo = new Photo();
      photo.filename = file.originalname;
      photo.mimetype = file.mimetype;
      photo.data = file.buffer;
      photo.order = order;
      return photo;
    });

    return this.photoRepo.save(photos);
  }

  async getOrderPhotos(userId: number, orderId: number): Promise<Photo[]> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, user: { id: userId } },
      relations: ['photos'],
    });
    if (!order) throw new NotFoundException('Order not found');
    return order.photos;
  }

  async markOrderPaid(userId: number, orderId: number): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, user: { id: userId } },
    });
    if (!order) throw new NotFoundException('Order not found');

    order.status = OrderStatus.PAID;
    return this.orderRepo.save(order);
  }

  async getOrderById(userId: number, orderId: number): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, user: { id: userId } },
      relations: ['service', 'photos', 'user'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async getOrdersByUserAndStatus(
    userId: number,
    status: OrderStatus,
  ): Promise<Order[]> {
    const orders = await this.orderRepo.find({
      where: { user: { id: userId }, status },
      relations: ['service', 'photos', 'user'],
    });

    return orders;
  }

  async updateStatusOrders(userId: number, status: OrderStatus) {
    const orders = await this.getOrdersByUserAndStatus(userId, status);

    if (!orders || orders.length === 0) {
      return { message: 'No orders to update' };
    }

    for (const order of orders) {
      const payment = await this.paymentService.getPayment(order);

      console.log('paymentGet', payment);

      if (payment.paid) {
        order.status = OrderStatus.PAID;
        await this.orderRepo.save(order);
      }
    }

    return { message: 'Orders updated successfully' };
  }

  async getEarliestReadyDate(userId: number): Promise<number> {
    const order = await this.orderRepo.findOne({
      where: { user: { id: userId }, status: OrderStatus.PAID },
      order: {
        readyInDays: 'ASC',
      },
    });

    if (!order) {
      return 0;
    }

    console.log('order', order);

    return order.readyInDays;
  }
}
