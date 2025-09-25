import {
  IsString,
  MinLength,
  IsEmail,
  IsOptional,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @IsString()
  @Type(() => String)
  lastName: string;

  @IsString()
  @Type(() => String)
  firstName: string;

  @IsOptional()
  @IsString()
  @Type(() => String)
  middleName?: string;

  @IsString()
  @Matches(/^(\+?\d{10,15})$/, {
    message: 'Введите корректный номер телефона',
  })
  @Type(() => String)
  phone: string;

  @IsEmail({}, { message: 'Введите корректный email' })
  @Type(() => String)
  email: string;

  @IsString()
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
  @Type(() => String)
  password: string;
}
