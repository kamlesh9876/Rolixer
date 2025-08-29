import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn, 
  BeforeInsert, 
  BeforeUpdate, 
  OneToMany,
  OneToOne,
  JoinColumn
} from 'typeorm';
import { IsEmail, IsEnum, IsString, Length, IsOptional, IsPhoneNumber, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { Store } from '../../stores/entities/store.entity';
import { Rating } from '../../ratings/entities/rating.entity';

export enum UserRole {
  USER = 'USER',
  CUSTOMER = 'CUSTOMER',
  STORE_OWNER = 'STORE_OWNER',
  ADMIN = 'ADMIN'
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
  @Length(2, 60)
  name: string;

  @Column({ unique: true })
  @IsEmail()
  email: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  @Length(10, 15)
  phone?: string;

  @Column()
  @IsString()
  password: string;

  @Column({ type: 'varchar', length: 400, nullable: true })
  @IsString()
  @IsOptional()
  @Length(0, 400)
  address?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER
  })
  @IsEnum(UserRole)
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SecurityQuestion)
  @IsOptional()
  securityQuestions?: SecurityQuestion[];

  @Column({ default: false })
  @IsBoolean()
  @IsOptional()
  enable2FA?: boolean;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  @IsPhoneNumber()
  phoneFor2FA?: string;

  @OneToMany(() => Store, store => store.owner)
  stores?: Store[];

  @OneToMany(() => Rating, rating => rating.user)
  ratings: Rating[];

  @OneToMany(() => Store, store => store.owner, { cascade: true })
  ownedStores: Store[];

  @OneToOne(() => Store, store => store.owner, { cascade: true })
  @JoinColumn()
  store: Store;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt();
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}
