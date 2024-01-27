import { Global, Module } from '@nestjs/common';
import { ConfigModule } from 'nestjs-config';
import { AbortInterceptor } from '@/common/interceptors/abort.interceptor';
import { DatabaseModule } from './modules/database/database.module';
import { resolve } from 'path';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { MailerModule } from './modules/mailer/mailer.module';
import { VerificationModule } from './modules/verification/verification.module';
import { ChatgptModule } from './modules/chatgpt/chatgpt.module';
import { CramiModule } from './modules/crami/crami.module';
import { UserBalanceModule } from './modules/userBalance/userBalance.module';
import { ChatLogModule } from './modules/chatLog/chatLog.module';
import { UploadModule } from './modules/upload/upload.module';
import { DrawModule } from './modules/draw/draw.module';
import { RedisCacheModule } from './modules/redisCache/redisCache.module';
import { GlobalConfigModule } from './modules/globalConfig/globalConfig.module';
import { StatisticModule } from './modules/statistic/statistic.module';
import { BadwordsModule } from './modules/badwords/badwords.module';
import { AutoreplyModule } from './modules/autoreply/autoreply.module';
import { AppModule as ApplicationModule } from './modules/app/app.module';
// import { MjModule } from './modules/mj/mj.module';
import { PayModule } from './modules/pay/pay.module';
import { OrderModule } from './modules/order/order.module';
import { FanyiModule } from './modules/fanyi/fanyi.module';
import { OfficialModule } from './modules/official/official.module';
import { TaskModule } from './modules/task/task.module';
import { QueueModule } from './modules/queue/queue.module';
import { MidjourneyModule } from './modules/midjourney/midjourney.module';
import { ChatGroupModule } from './modules/chatGroup/chatGroup.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as fetch from 'isomorphic-fetch';
import { join } from 'path';
global.fetch = fetch;
import { APP_INTERCEPTOR } from '@nestjs/core';
import { SalesModule } from './modules/sales/sales.module';
import { SigninModule } from './modules/signin/signin.module';
import { MenuModule } from './modules/menu/menu.module';
import { ModelsModule } from './modules/models/models.module';

@Global()
@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    ConfigModule.load(resolve(__dirname, 'config', '**/!(*.d).{ts,js}')),
    DatabaseModule,
    UserModule,
    AuthModule,
    MailerModule,
    VerificationModule,
    ChatgptModule,
    CramiModule,
    UserBalanceModule,
    ChatLogModule,
    UploadModule,
    DrawModule,
    RedisCacheModule,
    GlobalConfigModule,
    StatisticModule,
    BadwordsModule,
    AutoreplyModule,
    ApplicationModule,
    // MjModule,
    PayModule,
    OrderModule,
    FanyiModule,
    OfficialModule,
    TaskModule,
    QueueModule,
    MidjourneyModule,
    ChatGroupModule,
    SalesModule,
    SigninModule,
    MenuModule,
    ModelsModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AbortInterceptor,
    },
  ],
})
export class AppModule {}
