import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Photo } from './entities/photo.entity';
import { Order } from 'src/order/entities/order.entity';

@Injectable()
@Injectable()
export class PhotoService {
  constructor(
    @InjectRepository(Photo)
    private readonly photoRepo: Repository<Photo>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  async uploadPhotos(
    userId: number,
    orderId: number,
    files: Express.Multer.File[],
  ) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, user: { id: userId } },
      relations: ['user'],
    });
    if (!order) throw new NotFoundException('Order not found for this user');

    const photos = files.map((file) => {
      const photo = this.photoRepo.create({
        filename: file.originalname,
        mimetype: file.mimetype,
        data: file.buffer,
        order,
      });
      return photo;
    });

    return this.photoRepo.save(photos);
  }

  async getPhotos(userId: number, orderId: number): Promise<Photo[]> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, user: { id: userId } },
      relations: ['photos', 'user'],
    });
    if (!order) throw new NotFoundException('Order not found for this user');
    return order.photos;
  }

  async getPhotoById(userId: number, photoId: number): Promise<Photo | null> {
    const photo = await this.photoRepo.findOne({
      where: { id: photoId },
      relations: ['order', 'order.user'],
    });
    if (!photo || photo.order.user.id !== userId) return null;
    return photo;
  }

  async deletePhoto(
    userId: number,
    photoId: number,
  ): Promise<{ success: boolean }> {
    const photo = await this.photoRepo.findOne({
      where: { id: photoId },
      relations: ['order', 'order.user'],
    });
    if (!photo || photo.order.user.id !== userId) {
      throw new NotFoundException('Photo not found for this user');
    }

    await this.photoRepo.remove(photo);
    return { success: true };
  }
}
