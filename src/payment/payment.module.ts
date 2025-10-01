import { Module } from '@nestjs/common';
import { YooCheckout } from '@a2seven/yoo-checkout';
import { PaymentService } from './payment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from 'src/order/entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order])],
  providers: [
    PaymentService,
    {
      provide: 'YOO_CHECKOUT',
      useFactory: () => {
        const shopId = process.env.SHOPID;
        const secretKey = process.env.SECRETYOUKASSA;

        if (!shopId || !secretKey) {
          throw new Error(
            'Missing SHOPID or SECRETYOUKASSA in environment variables',
          );
        }

        return new YooCheckout({
          shopId,
          secretKey,
        });
      },
    },
  ],
  exports: ['YOO_CHECKOUT', PaymentService],
})
export class PaymentModule {}
