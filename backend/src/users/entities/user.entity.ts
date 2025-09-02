import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn, 
  BeforeInsert, 
  BeforeUpdate,
  AfterLoad,
  OneToMany,
  OneToOne,
  JoinColumn
} from 'typeorm';
import { 
  IsEmail, 
  IsEnum, 
  IsString, 
  Length, 
  IsOptional, 
  IsPhoneNumber, 
  IsArray, 
  ValidateNested, 
  IsBoolean
} from 'class-validator';
import { Type } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { Store } from '../../stores/entities/store.entity';
import { Rating } from '../../ratings/entities/rating.entity';
import { VerificationToken } from '../../auth/entities/verification-token.entity';

export enum UserRole {
  CUSTOMER = 'customer',
  STORE_OWNER = 'store_owner',
  ADMIN = 'admin'
}

export class SecurityQuestion {
  @IsString()
  question: string;

  @IsString()
  answer: string;
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 60 })
  @IsString()
  @Length(2, 60, { message: 'Name must be between 2 and 60 characters' })
  name: string;

  @Column({ unique: true })
  @IsEmail({}, { message: 'Please provide a valid email' })
  email: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  @Length(10, 15, { message: 'Phone number must be between 10 and 15 digits' })
  phone?: string;

  @Column({ select: false })
  @IsString()
  @Length(8, 100, { message: 'Password must be at least 8 characters' })
  password: string;

  @Column({ 
    type: 'enum', 
    enum: UserRole, 
    default: UserRole.CUSTOMER 
  })
  @IsEnum(UserRole, { message: 'Invalid role' })
  role: UserRole;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_email_verified' })
  isEmailVerified: boolean;

  @Column({ name: 'two_factor_secret', type: 'varchar', nullable: true, select: false })
  twoFactorSecret: string | null;

  @Column({ name: 'is_two_factor_enabled', type: 'boolean', default: false })
  isTwoFactorEnabled: boolean;

  @Column({ name: 'refresh_token', type: 'varchar', nullable: true, select: false })
  refreshToken: string | null;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  address?: string;

  @Column({ default: true })
  @IsBoolean()
  emailVerified: boolean = false;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  lastLogin?: Date;

  @Column({ type: 'jsonb', nullable: true })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SecurityQuestion)
  securityQuestions?: SecurityQuestion[];

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  resetPasswordToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  resetPasswordExpires?: Date;

  @OneToMany(() => Rating, rating => rating.user, { 
    cascade: true,
    onDelete: 'CASCADE' 
  })
  @IsOptional()
  ratings?: Rating[];

  @OneToMany(() => VerificationToken, token => token.user)
  verificationTokens: VerificationToken[];

  @OneToOne(() => Store, store => store.owner, { 
    nullable: true,
    onDelete: 'SET NULL'
  })
  @JoinColumn()
  @IsOptional()
  store?: Store;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Store, store => store.owner, { 
    cascade: true,
    onDelete: 'CASCADE' 
  })
  @IsOptional()
  ownedStores?: Store[];

  private tempPassword: string;

  @AfterLoad()
  private loadTempPassword(): void {
    this.tempPassword = this.password;
  }

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password && this.password !== this.tempPassword) {
      const salt = await bcrypt.genSalt();
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(password, this.password);
  }
}
