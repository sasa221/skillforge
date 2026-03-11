import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';

import { AUTH_COOKIE_REFRESH } from '../auth.constants';
import { JwtUser } from '../auth.types';

function extractRefreshToken(req: any): string | null {
  if (!req?.cookies) return null;
  const token = req.cookies[AUTH_COOKIE_REFRESH];
  return typeof token === 'string' ? token : null;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: extractRefreshToken,
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: JwtUser) {
    const refreshToken = extractRefreshToken(req);
    return { ...payload, refreshToken };
  }
}

