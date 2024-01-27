import { Global, Module } from '@nestjs/common';
import { UserBalanceService } from './userBalance.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BalanceEntity } from './balance.entity';
import { VerificationService } from '../verification/verification.service';
import { VerifycationEntity } from '../verification/verifycation.entity';
import { AccountLogEntity } from './accountLog.entity';
import { UserBalanceController } from './userBalance.controller';
import { ConfigEntity } from '../globalConfig/config.entity';
import { CramiPackageEntity } from '../crami/cramiPackage.entity';
import { UserBalanceEntity } from './userBalance.entity';
import { UserEntity } from '../user/user.entity';
import { SalesUsersEntity } from '../sales/salesUsers.entity';
import { WhiteListEntity } from '../chatgpt/whiteList.entity';
import { RedisCacheService } from '../redisCache/redisCache.service';
import { FingerprintLogEntity } from './fingerprint.entity';
import { ChatLogEntity } from '../chatLog/chatLog.entity';
import { ChatGroupEntity } from '../chatGroup/chatGroup.entity';
import { MidjourneyEntity } from '../midjourney/midjourney.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      BalanceEntity,
      UserBalanceEntity,
      VerifycationEntity,
      AccountLogEntity,
      ConfigEntity,
      CramiPackageEntity,
      UserEntity,
      SalesUsersEntity,
      WhiteListEntity,
      FingerprintLogEntity,
      ChatLogEntity,
      ChatGroupEntity,
      MidjourneyEntity
    ]),
  ],
  controllers: [UserBalanceController],
  providers: [UserBalanceService, VerificationService, RedisCacheService],
  exports: [UserBalanceService],
})
export class UserBalanceModule {}
