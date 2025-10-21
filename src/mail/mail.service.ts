import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer'

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly configService: ConfigService
  ){
    this.transporter = nodemailer.createTransport( {
    host: this.configService.get('MAIL_HOST'),
    port: this.configService.get('MAIL_PORT'),
    secure: false,
    tls: {
      rejectUnauthorized: false  // Ignore SSL certificate errors in development
    },
    auth: {
      user: this.configService.get('MAIL_USER'),
      pass: this.configService.get('MAIL_PASSWORD'),
    },
  })
  }

  async sendVerificationEmail(email:string, code:string){
    const mailOptions = {
    from: `"Unara" <${this.configService.get('MAIL_USER')}>`,
    to: email,
    subject: 'Verify Your Email - Unara',
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
          <h2>Welcome to Unara!</h2>
          <p>Please enter this verification code in the app to activate your account:</p>
          <div style="background-color: #f0f0f0; padding: 20px; margin: 20px 0; border-radius: 10px;">
            <h1 style="color: #007bff; font-size: 48px; letter-spacing: 10px; margin: 0;">${code}</h1>
          </div>
          <p style="color: #666;">This code expires in 24 hours.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
        </body>
      </html>
    `
  };
  await this.transporter.sendMail(mailOptions)
  }

    async sendForgottenPasswordEmail(email:string, token:string){
    const verificationUrl = `${this.configService.get('FRONTEND_URL')}/forgot-password-email?token=${token}`;
    const mailOptions = {
    from: `"Unara" <${this.configService.get('MAIL_USER')}>`,
    to: email,
    subject: 'Reset Your Password - Unara',
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Reset Your Password</h2>
          <p>Click the button below to reset your password. This link expires in 15 minutes.</p>
          <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset your password
          </a>
          <p>Or copy this link: ${verificationUrl}</p>
          <p>Link expires in 15 minutes.</p>
        </body>
      </html>
    `
  };
  await this.transporter.sendMail(mailOptions)
  }
}
