import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

@Module({
  imports: [
    ConfigModule, // Make sure ConfigModule is imported to use ConfigService
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
