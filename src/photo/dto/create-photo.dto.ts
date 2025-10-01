import { IsString, IsNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePhotoDto {
  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsString()
  @IsNotEmpty()
  mimetype: string;

  @IsNotEmpty()
  data: Buffer;

  @IsNumber()
  @Type(() => Number)
  orderId: number;
}
