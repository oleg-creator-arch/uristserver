import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: number;
}

type JwtFromRequestFunction = (req: Request) => string | null;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const extractor: JwtFromRequestFunction = (req) =>
      ExtractJwt.fromAuthHeaderAsBearerToken()(req);

    super({
      jwtFromRequest: extractor,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET,
    });
  }

  validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
    };
  }
}
