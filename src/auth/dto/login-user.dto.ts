import { IsEmail, IsString, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class LoginUserDto {
  @IsEmail({}, { message: 'Введите корректный email' })
  @Type(() => String)
  email: string;

  @IsString()
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
  @Type(() => String)
  password: string;
}
