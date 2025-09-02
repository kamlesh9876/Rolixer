import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  CreateDateColumn, 
  UpdateDateColumn, 
  JoinColumn,
  Index
} from 'typeorm';
import { 
  IsInt, 
  Min, 
  Max, 
  IsString, 
  IsOptional, 
  IsUUID, 
  IsNumber,
  IsDateString,
  IsBoolean,
  Length
} from 'class-validator';
import { User } from '../../users/entities/user.entity';
import { Store } from '../../stores/entities/store.entity';

@Entity('ratings')
@Index(['userId', 'storeId'], { unique: true }) // Ensure one rating per user per store
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  @IsInt()
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating cannot be more than 5' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  @Length(0, 1000, { message: 'Comment cannot exceed 1000 characters' })
  comment?: string;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isEdited: boolean;

  @Column({ type: 'timestamp', nullable: true })
  @IsDateString()
  @IsOptional()
  editedAt: Date;

  @ManyToOne(() => User, user => user.ratings, { 
    onDelete: 'CASCADE',
    eager: false 
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  @IsUUID()
  userId: string;

  @ManyToOne(() => Store, store => store.ratings, { 
    onDelete: 'CASCADE',
    eager: false 
  })
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @Column({ type: 'uuid' })
  @IsUUID()
  storeId: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  /**
   * Updates the rating with new values
   * @param newRating New rating value (1-5)
   * @param newComment Optional new comment
   */
  public update(newRating: number, newComment?: string): void {
    if (newRating < 1 || newRating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    this.rating = newRating;
    
    if (newComment !== undefined) {
      this.comment = newComment;
    }
    
    this.isEdited = true;
    this.editedAt = new Date();
  }

  // Ensure rating is between 1 and 5
  public validateRating(): boolean {
    return this.rating >= 1 && this.rating <= 5;
  }
}
