import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailerOptions } from '@nestjs-modules/mailer';

const mailConfig: MailerOptions = {
  transport: {
    host: process.env.MAILER_HOST || 'smtpdm.aliyun.com',
    port: process.env.MAILER_PORT || '80',
    auth: {
      user: process.env.MAILER_USER,
      pass: process.env.MAILER_PASS,
    },
  },
  defaults: {
    from: process.env.MAILER_FROM,
  },
  template: {
    dir: 'templates/mail',
    adapter: new HandlebarsAdapter(),
    options: {
      strict: true,
    },
  },
};

export default mailConfig;
