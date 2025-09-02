import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '../../users/entities/user.entity';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtTwoFactorStrategy extends PassportStrategy(
  Strategy,
  'jwt-two-factor',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in configuration');
    }
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any): Promise<User> {
    const user = await this.authService.validateUserById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // If 2FA is enabled, check if the 2FA code is verified
    if (user.isTwoFactorEnabled && !payload.isSecondFactorAuthenticated) {
      throw new UnauthorizedException('2FA verification required');
    }

    return user;
  }
}
