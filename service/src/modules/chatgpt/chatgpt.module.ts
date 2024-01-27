import { Global, Module } from '@nestjs/common';
import { ChatgptController } from './chatgpt.controller';
import { ChatgptService } from './chatgpt.service';
import { UserBalanceService } from '../userBalance/userBalance.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BalanceEntity } from '../userBalance/balance.entity';
import { UserService } from '../user/user.service';
import { UserEntity } from '../user/user.entity';
import { VerificationService } from '../verification/verification.service';
import { VerifycationEntity } from '../verification/verifycation.entity';
import { ChatLogService } from '../chatLog/chatLog.service';
import { ChatLogEntity } from '../chatLog/chatLog.entity';
import { AccountLogEntity } from '../userBalance/accountLog.entity';
import { ConfigEntity } from '../globalConfig/config.entity';
import { GptKeysEntity } from './gptkeys.entity';
import { GlobalConfigService } from '../globalConfig/globalConfig.service';
import { WhiteListEntity } from './whiteList.entity';
import { CramiPackageEntity } from '../crami/cramiPackage.entity';
import { ChatGroupEntity } from '../chatGroup/chatGroup.entity';
import { AppEntity } from '../app/app.entity';
import { UserBalanceEntity } from '../userBalance/userBalance.entity';
import { SalesUsersEntity } from '../sales/salesUsers.entity';
import { RedisCacheService } from '../redisCache/redisCache.service';
import { FingerprintLogEntity } from '../userBalance/fingerprint.entity';
import { MidjourneyEntity } from '../midjourney/midjourney.entity';
import { ChatBoxTypeEntity } from './chatBoxType.entity';
import { ChatBoxEntity } from './chatBox.entity';
import { ChatPreTypeEntity } from './chatPreType.entity';
import { ChatPreEntity } from './chatPre.entity';
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      BalanceEntity,
      UserEntity,
      VerifycationEntity,
      ChatLogEntity,
      AccountLogEntity,
      ConfigEntity,
      GptKeysEntity,
      WhiteListEntity,
      UserEntity,
      CramiPackageEntity,
      ChatGroupEntity,
      AppEntity,
      UserBalanceEntity,
      SalesUsersEntity,
      FingerprintLogEntity,
      MidjourneyEntity,
      ChatBoxTypeEntity,
      ChatBoxEntity,
      ChatPreTypeEntity,
      ChatPreEntity
    ]),
  ],
  controllers: [ChatgptController],
  providers: [ChatgptService, UserBalanceService, UserService, VerificationService, ChatLogService, RedisCacheService],
  exports: [ChatgptService]
})
export class ChatgptModule {}
