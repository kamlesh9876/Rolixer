import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationToken } from './entities/verification-token.entity';
import { VerificationService } from './verification.service';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([VerificationToken, User]),
  ],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
