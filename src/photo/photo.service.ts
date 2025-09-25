import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Photo } from './entities/photo.entity';

@Injectable()
export class PhotoService {
  constructor(
    // @InjectRepository(User) private userRepo: Repository<User>,
    // @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Photo) private photoRepo: Repository<Photo>,
  ) {}

  // async saveFiles(
  //   userId: number,
  //   orderId: number,
  //   files: Express.Multer.File[],
  // ) {
  //   const user = await this.userRepo.findOneBy({ id: userId });
  //   if (!user) {
  //     throw new Error('User not found');
  //   }

  //   const order = await this.orderRepo.findOne({
  //     where: { id: orderId, user: { id: userId } },
  //     relations: ['user'],
  //   });
  //   if (!order) {
  //     throw new Error('Order not found for this user');
  //   }

  //   const photos = files.map((file) => {
  //     const photo = new Photo();
  //     photo.filename = file.originalname;
  //     photo.mimetype = file.mimetype;
  //     photo.data = file.buffer;
  //     photo.order = order;
  //     return photo;
  //   });

  //   return this.photoRepo.save(photos);
  // }

  // async getOrderPhotos(userId: number, orderId: number): Promise<Photo[]> {
  //   const order = await this.orderRepo.findOne({
  //     where: { id: orderId, user: { id: userId } },
  //     relations: ['photos', 'user'],
  //   });

  //   if (!order) {
  //     throw new Error('Order not found for this user');
  //   }

  //   return order.photos;
  // }
}
