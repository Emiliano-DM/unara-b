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
    auth: {
      user: this.configService.get('MAIL_USER'),        
      pass: this.configService.get('MAIL_PASSWORD'),    
    },
  })
  }

  async sendVerificationEmail(email:string, token:string){
    const verificationUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${token}`;
    const mailOptions = {
    from: `"Unara" <${this.configService.get('MAIL_USER')}>`,
    to: email,
    subject: 'Verify Your Email - Unara',
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Welcome to Unara!</h2>
          <p>Please verify your email to activate your account.</p>
          <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email
          </a>
          <p>Or copy this link: ${verificationUrl}</p>
          <p>Link expires in 24 hours.</p>
        </body>
      </html>
    `
  };
  await this.transporter.sendMail(mailOptions)
  }
}
