import { Inject, Injectable } from '@nestjs/common';
import { YooCheckout } from '@a2seven/yoo-checkout';

@Injectable()
export class PaymentService {
  constructor(
    @Inject('YOO_CHECKOUT') private readonly yooCheckout: YooCheckout,
  ) {}

  async createPayment(
    amount: string,
    returnUrl: string,
    userId: number,
    orderId: number,
  ) {
    return this.yooCheckout.createPayment({
      amount: { value: amount, currency: 'RUB' },
      confirmation: { type: 'redirect', return_url: returnUrl },
      capture: true,
      description: `Оплата заказа #${orderId} пользователя ${userId}`,
    });
  }
}
