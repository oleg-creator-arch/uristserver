import { Controller } from '@nestjs/common';
// import { AnyFilesInterceptor } from '@nestjs/platform-express';
// import { UserService } from './user.service';
import { PaymentService } from 'src/payment/payment.service';

@Controller('photo')
export class PhotoController {
  constructor(
    // private readonly userService: UserService,
    private readonly paymentService: PaymentService,
  ) {}

  // @Post(':userId/orders/:orderId/upload')
  // @UseInterceptors(AnyFilesInterceptor())
  // async uploadFiles(
  //   @Param('userId') userId: number,
  //   @Param('orderId') orderId: number,
  //   @UploadedFiles() files: Express.Multer.File[],
  // ) {
  //   const photos = await this.userService.saveFiles(userId, orderId, files);
  //   return photos.map((p) => ({
  //     id: p.id,
  //     filename: p.filename,
  //     uploadedAt: p.uploadedAt,
  //   }));
  // }

  // @Get(':userId/orders/:orderId/photos')
  // async getOrderPhotos(
  //   @Param('userId') userId: number,
  //   @Param('orderId') orderId: number,
  // ) {
  //   const photos = await this.userService.getOrderPhotos(userId, orderId);
  //   return photos.map((p) => ({
  //     id: p.id,
  //     filename: p.filename,
  //     mimetype: p.mimetype,
  //     uploadedAt: p.uploadedAt,
  //     base64: `data:${p.mimetype};base64,${p.data.toString('base64')}`,
  //   }));
  // }

  // @Post(':userId/orders/:orderId/pay')
  // async payForOrder(
  //   @Param('userId') userId: number,
  //   @Param('orderId') orderId: number,
  //   @Body() body: { amount: string; returnUrl: string },
  // ) {
  //   return this.paymentService.createPayment(
  //     body.amount,
  //     body.returnUrl,
  //     userId,
  //     orderId,
  //   );
  // }
}
