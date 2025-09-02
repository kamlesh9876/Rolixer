import { Exclude, Expose, Type } from 'class-transformer';
import { UserRole } from '../entities/user.entity';

export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  phone: string;

  @Expose()
  role: UserRole;

  @Expose()
  address: string;

  @Expose()
  isActive: boolean;

  @Expose()
  emailVerified: boolean;

  @Expose()
  twoFactorEnabled: boolean;

  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @Expose()
  @Type(() => Date)
  updatedAt: Date;

  @Expose()
  @Type(() => Date)
  lastLogin: Date;

  @Expose()
  profilePicture: string;

  @Expose()
  profileBio: string;

  @Expose()
  storeId: string;

  @Exclude()
  password: string;

  @Exclude()
  twoFactorSecret: string;

  @Exclude()
  resetPasswordToken: string;

  @Exclude()
  resetPasswordExpires: Date;

  @Exclude()
  securityQuestions: any[];

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }

  static fromUser(user: any): UserResponseDto {
    return new UserResponseDto({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      address: user.address,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
      profilePicture: user.profilePicture,
      profileBio: user.profileBio,
      storeId: user.store?.id,
      password: user.password,
      twoFactorSecret: user.twoFactorSecret,
      resetPasswordToken: user.resetPasswordToken,
      resetPasswordExpires: user.resetPasswordExpires,
      securityQuestions: user.securityQuestions,
    });
  }
}

export class UserProfileResponseDto extends UserResponseDto {
  @Expose()
  @Type(() => Date)
  lastLogin: Date;

  @Expose()
  securityQuestions: Array<{ id?: string; question: string }>;

  static fromUser(user: any): UserProfileResponseDto {
    const base = super.fromUser(user);
    const dto = new UserProfileResponseDto({
      ...base,
      securityQuestions: user.securityQuestions?.map((q: any) => ({
        id: q.id,
        question: q.question,
      })),
    });
    return dto;
  }
}

export class AdminUserResponseDto extends UserResponseDto {
  @Expose()
  twoFactorEnabled: boolean;

  @Expose()
  @Type(() => Date)
  lastLogin: Date;

  @Expose()
  storeId: string;

  @Expose()
  storeName: string;

  static fromUser(user: any): AdminUserResponseDto {
    const base = super.fromUser(user);
    return new AdminUserResponseDto({
      ...base,
      storeName: user.store?.name,
    });
  }
}
