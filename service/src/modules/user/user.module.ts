import { VerifycationEntity } from '../verification/verifycation.entity';
import { VerificationService } from '../verification/verification.service';
import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserEntity } from './user.entity';
import { UserBalanceService } from '../userBalance/userBalance.service';
import { BalanceEntity } from '../userBalance/balance.entity';
import { AccountLogEntity } from '../userBalance/accountLog.entity';
import { ConfigEntity } from '../globalConfig/config.entity';
import { CramiPackageEntity } from '../crami/cramiPackage.entity';
import { WhiteListEntity } from '../chatgpt/whiteList.entity';
import { UserBalanceEntity } from '../userBalance/userBalance.entity';
import { SalesUsersEntity } from '../sales/salesUsers.entity';
import { RedisCacheService } from '../redisCache/redisCache.service';
import { FingerprintLogEntity } from '../userBalance/fingerprint.entity';
import { ChatLogEntity } from '../chatLog/chatLog.entity';
import { ChatGroupEntity } from '../chatGroup/chatGroup.entity';
import { MidjourneyEntity } from '../midjourney/midjourney.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      VerifycationEntity,
      BalanceEntity,
      AccountLogEntity,
      ConfigEntity,
      CramiPackageEntity,
      WhiteListEntity,
      UserBalanceEntity,
      SalesUsersEntity,
      FingerprintLogEntity,
      ChatLogEntity,
      ChatGroupEntity,
      MidjourneyEntity
    ]),
  ],
  controllers: [UserController],
  providers: [UserService, VerificationService, UserBalanceService, RedisCacheService],
  exports: [UserService],
})
export class UserModule {}
