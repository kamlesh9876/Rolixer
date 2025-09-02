import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { create } from 'express-handlebars';
import * as hbs from 'handlebars';
import * as nodemailerHandlebars from 'nodemailer-express-handlebars';
import * as path from 'path';

@Injectable()
export class MailService {
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    this.transporter = createTransport({
      host: this.configService.get('MAIL_HOST'),
      port: this.configService.get('MAIL_PORT'),
      secure: this.configService.get('MAIL_SECURE') === 'true',
      auth: {
        user: this.configService.get('MAIL_USER'),
        pass: this.configService.get('MAIL_PASSWORD'),
      },
    });

    // Set up handlebars for email templates
    const handlebarOptions = {
      viewEngine: {
        extname: '.hbs',
        partialsDir: path.join(__dirname, 'templates/partials'),
        layoutsDir: path.join(__dirname, 'templates/layouts'),
        defaultLayout: 'main',
        handlebars: hbs
      },
      viewPath: path.join(__dirname, 'templates/emails'),
      extName: '.hbs',
    };

    // @ts-ignore - The types for nodemailer-express-handlebars are incorrect
    this.transporter.use('compile', nodemailerHandlebars.default(handlebarOptions));
  }

  async sendVerificationEmail(email: string, name: string, token: string) {
    const verificationUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${token}`;
    
    const mailOptions = {
      from: `"${this.configService.get('MAIL_FROM_NAME')}" <${this.configService.get('MAIL_FROM')}>`,
      to: email,
      subject: 'Verify Your Email Address',
      template: 'verify-email',
      context: {
        name,
        verificationUrl,
        supportEmail: this.configService.get('SUPPORT_EMAIL'),
        appName: this.configService.get('APP_NAME'),
      },
    };

    return this.transporter.sendMail(mailOptions);
  }

  async sendPasswordResetEmail(email: string, name: string, token: string) {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;
    
    const mailOptions = {
      from: `"${this.configService.get('MAIL_FROM_NAME')}" <${this.configService.get('MAIL_FROM')}>`,
      to: email,
      subject: 'Reset Your Password',
      template: 'reset-password',
      context: {
        name,
        resetUrl,
        supportEmail: this.configService.get('SUPPORT_EMAIL'),
        appName: this.configService.get('APP_NAME'),
      },
    };

    return this.transporter.sendMail(mailOptions);
  }
}
