import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('verification_tokens')
export class VerificationToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  token: string;

  @Column({ type: 'timestamp with time zone' })
  expiresAt: Date;

  @Column({ type: 'boolean', default: false })
  isUsed: boolean;

  @Column({ type: 'varchar', length: 50 })
  type: 'email_verification' | 'password_reset';

  @ManyToOne(() => User, user => user.verificationTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
