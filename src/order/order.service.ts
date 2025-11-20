import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { User } from 'src/user/entities/user.entity';
import { Service } from 'src/service/entities/service.entity';
import { Photo } from 'src/photo/entities/photo.entity';
import { CreateOrderDto, DeliveryFormat } from './dto/create-order.dto';
import { PaymentService } from 'src/payment/payment.service';
import * as nodemailer from 'nodemailer';

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

  private async sendOrderEmail(order: Order) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const translateTypes = [
      { value: 'azerbaijani', label: 'азербайджанский' },
      { value: 'english', label: 'английский' },
      { value: 'armenian', label: 'армянский' },
      { value: 'georgian', label: 'грузинский' },
      { value: 'kazakh', label: 'казахский' },
      { value: 'kyrgyz', label: 'кыргызский' },
      { value: 'russian', label: 'русский' },
      { value: 'tajik', label: 'таджикский' },
      { value: 'turkish', label: 'турецкий' },
      { value: 'turkmen', label: 'туркменский' },
      { value: 'uzbek', label: 'узбекский' },
    ] as const;

    const attachments =
      order.photos?.map((photo) => ({
        filename: photo.filename,
        content: photo.data,
        contentType: photo.mimetype,
      })) ?? [];

    const getLanguageLabel = (value: string) =>
      translateTypes.find((t) => t.value === value)?.label ?? value;

    const html = `
        <h2>Новый заказ #${order.id}</h2>
        <p><b>Пользователь:</b> ${order.user.email}</p>
        <p><b>Услуга:</b> ${order.service.title}</p>
        <p><b>Страниц:</b> ${order.pages}</p>
        <p><b>Нотариат:</b> ${order.notary ? 'Да' : 'Нет'}</p>
        <p><b>Тип документа:</b> ${order.documentType}</p>
        <p><b>Оргинальный язык:</b> ${getLanguageLabel(order.fromLanguage)} на ${getLanguageLabel(order.toLanguage)}</p>
        <p><b>На какой перевести:</b> ${getLanguageLabel(order.fromLanguage)} на ${getLanguageLabel(order.toLanguage)}</p>
        <p><b>Доставка:</b> ${order.delivery ? 'Курьер' : 'Онлайн'}</p>
        <p><b>Адрес:</b> ${order.address ?? '-'}</p>
      `;

    const mailOptions = {
      from: `"Order Bot" <${process.env.SMTP_USER}>`,
      to: process.env.ORDER_EMAIL,
      subject: `Новый заказ #${order.id}`,
      html,
      attachments,
    };

    await transporter.sendMail(mailOptions);
  }

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

    const saved = await this.orderRepo.save(order);
    return saved;
  }

  async uploadPhotos(
    userId: number,
    orderId: number,
    files: Express.Multer.File[],
  ): Promise<Photo[]> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, user: { id: userId } },
      relations: ['photos'],
    });

    if (!order) throw new NotFoundException('Order not found');

    if (order.photos && order.photos.length > 0) {
      await this.photoRepo.remove(order.photos);
    }

    const photos = files.map((file) => {
      const photo = new Photo();
      photo.filename = file.originalname;
      photo.mimetype = file.mimetype;
      photo.data = file.buffer;
      photo.order = order;
      return photo;
    });

    const saved = await this.photoRepo.save(photos);

    const fullOrder = await this.getOrderById(userId, orderId);

    await this.sendOrderEmail(fullOrder);

    return saved;
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
      if (order.paymentId !== '' && order.paymentId !== null) {
        const payment = await this.paymentService.getPayment(order);

        if (payment.paid) {
          order.status = OrderStatus.PAID;
          await this.orderRepo.save(order);
        }
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

    return order.readyInDays;
  }
}
