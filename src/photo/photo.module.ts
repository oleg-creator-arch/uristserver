import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Photo } from './entities/photo.entity';
import { PaymentModule } from 'src/payment/payment.module';
import { PhotoController } from './photo.controller';
import { PhotoService } from './photo.service';
import { User } from 'src/user/entities/user.entity';
import { Order } from 'src/order/entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Photo, Order]), PaymentModule],
  controllers: [PhotoController],
  providers: [PhotoService],
})
export class PhotoModule {}
