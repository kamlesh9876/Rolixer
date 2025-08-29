import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  OneToMany, 
  ManyToOne, 
  CreateDateColumn, 
  UpdateDateColumn, 
  JoinColumn 
} from 'typeorm';
import { IsString, IsEmail, IsEnum, IsNumber, IsOptional, Length } from 'class-validator';
import { User, UserRole } from '../../users/entities/user.entity';
import { Rating } from '../../ratings/entities/rating.entity';

export enum StoreStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING'
}

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  @IsString()
  @Length(2, 100)
  name: string;

  @Column({ length: 400, nullable: true })
  @IsString()
  @IsOptional()
  @Length(0, 400)
  address?: string;

  @Column({ length: 100, unique: true })
  @IsEmail()
  email: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Column({
    type: 'enum',
    enum: StoreStatus,
    default: StoreStatus.PENDING
  })
  @IsEnum(StoreStatus)
  status: StoreStatus;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  @IsNumber()
  @IsOptional()
  averageRating: number;

  @Column({ default: 0 })
  @IsNumber()
  @IsOptional()
  totalRatings: number;

  @ManyToOne(() => User, user => user.stores, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column({ type: 'uuid' })
  ownerId: string;

  @OneToMany(() => Rating, rating => rating.store, { cascade: true })
  ratings: Rating[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual property to calculate average rating
  public updateAverageRating(): void {
    if (this.ratings && this.ratings.length > 0) {
      const sum = this.ratings.reduce((total, rating) => total + rating.rating, 0);
      this.averageRating = parseFloat((sum / this.ratings.length).toFixed(2));
      this.totalRatings = this.ratings.length;
    } else {
      this.averageRating = 0;
      this.totalRatings = 0;
    }
  }
}
