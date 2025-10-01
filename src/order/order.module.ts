import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { PaymentModule } from 'src/payment/payment.module';
import { OrderService } from './order.service';
import { Photo } from 'src/photo/entities/photo.entity';
import { User } from 'src/user/entities/user.entity';
import { OrderController } from './order.controller';
import { Service } from 'src/service/entities/service.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Photo, Order, Service]),
    PaymentModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
