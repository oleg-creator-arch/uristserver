import {
  Controller,
  Get,
  Post,
  Body,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  Req,
  Param,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PaymentService } from 'src/payment/payment.service';
import { OrderStatus } from './entities/order.entity';

@Controller('order')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService,
  ) {}

  @Get('filling')
  async getFillingOrder(@Req() req) {
    return this.orderService.getFillingOrder(req.user.userId);
  }

  @Post()
  async createOrUpdateOrder(@Req() req, @Body() dto: CreateOrderDto) {
    return this.orderService.createOrUpdateOrder(req.user.userId, dto);
  }

  @Post(':orderId/upload')
  @UseInterceptors(AnyFilesInterceptor())
  async uploadFiles(
    @Req() req,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('orderId') orderId: number,
  ) {
    return this.orderService.uploadPhotos(req.user.userId, orderId, files);
  }

  @Get(':orderId/photos')
  async getOrderPhotos(@Req() req, @Body('orderId') orderId: number) {
    return this.orderService.getOrderPhotos(req.user.userId, orderId);
  }

  @Post('pay')
  async payForOrder(@Req() req, @Body('orderId') orderId: number) {
    const order = await this.orderService.getOrderById(
      req.user.userId,
      orderId,
    );

    if (!order) {
      throw new Error('Order not found');
    }

    const payment = await this.paymentService.createPayment(
      req.user.userId,
      orderId,
      order,
    );
    return payment;
  }

  @Post('updateStatus')
  async updateStatusOrders(@Req() req) {
    return await this.orderService.updateStatusOrders(
      req.user.userId,
      OrderStatus.FILLING,
    );
  }

  @Get('earliest-ready-date')
  async getEarliestReadyDate(@Req() req) {
    return this.orderService.getEarliestReadyDate(req.user.userId);
  }
}
