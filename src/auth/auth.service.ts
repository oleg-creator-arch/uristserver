import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/entities/user.entity';
import * as nodemailer from 'nodemailer';
import { RefreshToken } from './entities/refresh-token.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  private async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '1d',
    });

    await this.refreshTokenRepo.delete({ user: user });

    const hash = await bcrypt.hash(refreshToken, 10);
    const rtEntity = this.refreshTokenRepo.create({
      tokenHash: hash,
      user,
    });
    await this.refreshTokenRepo.save(rtEntity);

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.userService.findById(payload.sub);
      if (!user) throw new UnauthorizedException('Пользователь не найден');

      const tokens = await this.refreshTokenRepo.find({
        where: { user: { id: user.id } },
      });

      const match = await Promise.any(
        tokens.map((t) =>
          bcrypt
            .compare(refreshToken, t.tokenHash)
            .then((ok) => (ok ? t : null)),
        ),
      ).catch(() => null);

      if (!match) {
        throw new UnauthorizedException('Недействительный refresh токен');
      }

      await this.refreshTokenRepo.remove(match);

      return this.generateTokens(user);
    } catch (e) {
      throw new UnauthorizedException(
        'Недействительный или просроченный refresh токен',
      );
    }
  }

  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.userService.findByEmail(email);
    if (!user) return null;

    const passwordMatches = await bcrypt.compare(pass, user.password);
    if (!passwordMatches) return null;

    return user;
  }

  async logout(refreshToken: string) {
    const tokens = await this.refreshTokenRepo.find();

    const match = await Promise.any(
      tokens.map((t) =>
        bcrypt.compare(refreshToken, t.tokenHash).then((ok) => (ok ? t : null)),
      ),
    ).catch(() => null);

    if (match) {
      await this.refreshTokenRepo.remove(match);
      return { message: 'Токен удалён' };
    }

    return { message: 'Токен не найден или уже удалён' };
  }

  async login(user: User) {
    return this.generateTokens(user);
  }

  async register(user: User) {
    return this.generateTokens(user);
  }

  async requestPasswordReset(email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Пользователь с таким email не найден');
    }

    const token = await this.jwtService.signAsync(
      { sub: user.id, email: user.email },
      { secret: process.env.RESET_SECRET, expiresIn: '15m' },
    );

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      secure: true, // true для 465 порта
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const resetLink = `${process.env.RESET_PASSWORD_URL}?token=${token}`;

    const mailOptions = {
      from: `"Support" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Сброс пароля',
      html: `
      <p>Здравствуйте!</p>
      <p>Для сброса пароля перейдите по ссылке:</p>
      <a href="${resetLink}">Сменить пароль</a>
      <p>Ссылка действительна 15 минут.</p>
      `,
    };
    try {
      await Promise.race([
        transporter.sendMail(mailOptions),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Почта недоступна')), 5000),
        ),
      ]);
    } catch (err) {
      throw new Error(
        err.message === 'Почта недоступна'
          ? 'Почта недоступна или не действительна. Попробуйте позже.'
          : 'Ошибка при отправке письма',
      );
    }

    return {
      message: 'Ссылка для сброса отправлена на email',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.RESET_SECRET,
      });

      const user = await this.userService.findById(payload.sub);
      if (!user) throw new NotFoundException('Пользователь не найден');

      const hash = await bcrypt.hash(newPassword, 10);
      user.password = hash;

      await this.userService.save(user);

      return this.generateTokens(user);
    } catch (err) {
      throw new BadRequestException('Недействительный или просроченный токен');
    }
  }

  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Старый пароль неверный');
    }

    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    await this.userService.save(user);

    await this.refreshTokenRepo.delete({ user });

    const tokens = await this.generateTokens(user);

    return {
      message: 'Пароль успешно изменён',
      ...tokens,
    };
  }
}
