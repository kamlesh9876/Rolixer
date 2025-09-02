import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../../users/entities/user.entity';
import { AuthService } from '../auth.service';

export type JwtPayload = {
  sub: string;
  email: string;
  role: string;
  isSecondFactorAuthenticated?: boolean;
  isEmailVerified: boolean;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
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

  async validate(payload: JwtPayload): Promise<Partial<User>> {
    const user = await this.authService.validateUserById(payload.sub);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // If 2FA is enabled but not verified in this request
    if (user.isTwoFactorEnabled && !payload.isSecondFactorAuthenticated) {
      throw new UnauthorizedException('2FA verification required');
    }

    // If email is not verified
    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Email not verified');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
      isEmailVerified: user.isEmailVerified,
    };
  }
}
