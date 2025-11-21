import { Inject, Injectable } from '@nestjs/common';
import { YooCheckout } from '@a2seven/yoo-checkout';
import { Order, OrderStatus } from 'src/order/entities/order.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as nodemailer from 'nodemailer';

import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentService {
  constructor(
    @Inject('YOO_CHECKOUT') private readonly yooCheckout: YooCheckout,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  async createPayment(userId, orderId, order) {
    const amount = order.totalPrice.toString();

    const returnUrl = process.env.PAYMENT_RETURN_URL;
    if (!returnUrl) {
      throw new Error('PAYMENT_RETURN_URL is not set in environment');
    }

    const idempotenceKey = uuidv4();
    order.idempotenceKey = idempotenceKey;

    const payment = await this.yooCheckout.createPayment(
      {
        amount: { value: amount, currency: 'RUB' },
        confirmation: { type: 'redirect', return_url: returnUrl },
        capture: true,
        description: `Оплата заказа #${orderId} пользователя ${userId}`,
        receipt: {
          customer: {
            email: order.user.email,
          },
          items: [
            {
              description: order.service?.name || 'Услуга',
              quantity: order.pages ? order.pages.toString() : '1.00',
              amount: {
                value: amount,
                currency: 'RUB',
              },
              vat_code: 1,
              payment_mode: 'full_prepayment',
              payment_subject: 'service',
            },
          ],
        },
      },
      idempotenceKey,
    );
    order.paymentId = payment.id;
    await this.orderRepo.save(order);
    return payment;
  }

  async getPayment(order) {
    return await this.yooCheckout.getPayment(order.paymentId);
  }

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
        <p><b>Оргинальный язык:</b> ${getLanguageLabel(order.fromLanguage)}</p>
        <p><b>На какой перевести:</b> ${getLanguageLabel(order.toLanguage)}</p>
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

  async handleWebhook(data: any) {
    const event = data.event;
    const object = data.object;

    const paymentId = object?.id;

    if (!paymentId) return { message: 'No payment ID' };

    const order = await this.orderRepo.findOne({
      where: { paymentId },
    });

    if (!order) return { message: 'Order not found' };

    if (event === 'payment.succeeded') {
      order.status = OrderStatus.PAID;
      await this.orderRepo.save(order);
      await this.sendOrderEmail(order);
      return { message: 'Order updated to PAID' };
    }

    if (event === 'payment.canceled') {
      return { message: 'Payment canceled' };
    }

    return {
      message: 'Unhandled event',
      event,
    };
  }
}
