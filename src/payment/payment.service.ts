import { Inject, Injectable } from '@nestjs/common';
import { YooCheckout } from '@a2seven/yoo-checkout';
import { Order } from 'src/order/entities/order.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import * as fs from 'fs';
import * as path from 'path';
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
}
