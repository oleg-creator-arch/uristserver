import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  Min,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum DeliveryFormat {
  EMAIL = 'email',
  COURIER = 'courier',
}

export class CreateOrderDto {
  @IsNumber()
  @Type(() => Number)
  serviceId: number;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  pagesCount: number;

  @IsBoolean()
  @Type(() => Boolean)
  notarization: boolean;

  @IsEnum(DeliveryFormat)
  deliveryFormat: DeliveryFormat;

  @IsOptional()
  @IsString()
  address?: string;

  @IsString()
  documentType: string;

  @IsString()
  fromLanguage: string;

  @IsString()
  toLanguage: string;

  @IsOptional()
  @IsArray()
  photos?: Express.Multer.File[];
}
