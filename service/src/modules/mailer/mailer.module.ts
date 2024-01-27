import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from 'nestjs-config';
import { MailerModule as MModule, MailerOptions } from '@nestjs-modules/mailer';
import { MailerService } from './mailer.service';

@Module({
  imports: [
    ConfigModule,
    MModule.forRootAsync({
      useFactory: (config: ConfigService): MailerOptions => config.get('mailer'),
      inject: [ConfigService],
    }),
  ],
  exports: [MailerModule],
  providers: [MailerService],
})
export class MailerModule {}
