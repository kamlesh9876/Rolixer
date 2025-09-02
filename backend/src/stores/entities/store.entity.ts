import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  OneToMany, 
  ManyToOne, 
  CreateDateColumn, 
  UpdateDateColumn, 
  JoinColumn,
  OneToOne
} from 'typeorm';
import { 
  IsString, 
  IsEmail, 
  IsEnum, 
  IsNumber, 
  IsOptional, 
  Length, 
  IsPhoneNumber,
  IsBoolean,
  IsUrl,
  IsArray,
  Min,
  Max,
  IsInt
} from 'class-validator';
import { User } from '../../users/entities/user.entity';
import { Rating } from '../../ratings/entities/rating.entity';

export enum StoreStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED'
}

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  @IsString()
  @Length(2, 100, { message: 'Name must be between 2 and 100 characters' })
  name: string;

  @Column({ length: 400, nullable: true })
  @IsString()
  @IsOptional()
  @Length(0, 400, { message: 'Address cannot exceed 400 characters' })
  address: string;

  @Column({ length: 100, unique: true })
  @IsEmail({}, { message: 'Please provide a valid email' })
  email: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  description: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  @IsString()
  @IsOptional()
  @Length(10, 15, { message: 'Phone number must be between 10 and 15 digits' })
  phone: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  @IsUrl({}, { message: 'Please provide a valid website URL' })
  @IsOptional()
  website: string;

  @Column({ type: 'jsonb', nullable: true })
  @IsArray()
  @IsOptional()
  businessHours: Record<string, { open: string; close: string }>;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(5)
  averageRating: number;

  @Column({ type: 'int', default: 0 })
  @IsInt()
  @Min(0)
  totalRatings: number;

  @Column({
    type: 'enum',
    enum: StoreStatus,
    default: StoreStatus.PENDING
  })
  @IsEnum(StoreStatus)
  status: StoreStatus;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isFeatured: boolean;

  @OneToMany(() => Rating, rating => rating.store, { cascade: true })
  ratings: Rating[];

  @OneToOne(() => User, user => user.store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column({ type: 'uuid' })
  ownerId: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  /**
   * Updates the average rating and total ratings count
   * Call this after adding/removing ratings
   */
  public updateRatingStats(): void {
    if (this.ratings && this.ratings.length > 0) {
      const sum = this.ratings.reduce((total, rating) => total + rating.rating, 0);
      this.averageRating = parseFloat((sum / this.ratings.length).toFixed(2));
      this.totalRatings = this.ratings.length;
    } else {
      this.averageRating = 0;
      this.totalRatings = 0;
    }
  }

  /**
   * Adds a new rating and updates the stats
   * @param rating The rating to add (1-5)
   * @param user The user who submitted the rating
   * @param comment Optional comment
   */
  public addRating(rating: number, user: User, comment?: string): Rating {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const newRating = new Rating();
    newRating.rating = rating;
    newRating.comment = comment;
    newRating.user = user;
    newRating.store = this;

    if (!this.ratings) {
      this.ratings = [];
    }
    
    this.ratings.push(newRating);
    this.updateRatingStats();
    
    return newRating;
  }
}
