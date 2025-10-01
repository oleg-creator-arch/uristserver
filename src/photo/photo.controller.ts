import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UploadedFiles,
  UseInterceptors,
  Res,
  NotFoundException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { PhotoService } from './photo.service';
import type { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('photos')
@UseGuards(JwtAuthGuard)
export class PhotoController {
  constructor(private readonly photoService: PhotoService) {}

  @Post(':orderId/upload')
  @UseInterceptors(AnyFilesInterceptor())
  async uploadPhotos(
    @Param('orderId') orderId: number,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req,
  ) {
    return this.photoService.uploadPhotos(req.user.userId, orderId, files);
  }

  @Get(':orderId')
  async getPhotos(@Param('orderId') orderId: number, @Req() req) {
    return this.photoService.getPhotos(req.user.userId, orderId);
  }

  @Get('file/:photoId')
  async getPhoto(
    @Param('photoId') photoId: number,
    @Req() req,
    @Res() res: Response,
  ) {
    const photo = await this.photoService.getPhotoById(
      req.user.userId,
      photoId,
    );
    if (!photo) throw new NotFoundException('Photo not found');

    res.setHeader('Content-Type', photo.mimetype);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${photo.filename}"`,
    );
    res.send(photo.data);
  }

  @Delete(':photoId')
  async deletePhoto(@Param('photoId') photoId: number, @Req() req) {
    return this.photoService.deletePhoto(req.user.userId, photoId);
  }
}
