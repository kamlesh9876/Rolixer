import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { User } from '../../users/entities/user.entity';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const refreshSecret = configService.get<string>('JWT_REFRESH_SECRET');
    if (!refreshSecret) {
      throw new Error('JWT_REFRESH_SECRET is not defined in configuration');
    }
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: refreshSecret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any): Promise<User> {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    const refreshToken = authHeader.split(' ')[1];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    try {
      const user = await this.authService.getUserIfRefreshTokenMatches(
        payload.sub,
        refreshToken,
      );

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
