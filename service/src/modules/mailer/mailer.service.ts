import { MailerService as MService, ISendMailOptions } from '@nestjs-modules/mailer';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { SentMessageInfo } from 'nodemailer';

@Injectable()
export class MailerService {
  constructor(private mailerService: MService) {}

  async sendMail(options: ISendMailOptions): Promise<void> {
    try {
      await this.mailerService.sendMail(options);
    } catch (error) {
      console.log('error: ', error);
      throw new HttpException('邮件发送失败！', HttpStatus.BAD_REQUEST);
    }
  }
}
