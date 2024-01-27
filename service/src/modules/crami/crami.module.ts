import { Global, Module } from '@nestjs/common';
import { CramiService } from './crami.service';
import { CramiController } from './crami.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CramiEntity } from './crami.entity';
import { CramiPackageEntity } from './cramiPackage.entity';
import { UserEntity } from '../user/user.entity';
import { UserBalanceService } from '../userBalance/userBalance.service';
import { BalanceEntity } from '../userBalance/balance.entity';
import { AccountLogEntity } from '../userBalance/accountLog.entity';
import { ConfigEntity } from '../globalConfig/config.entity';
import { UserBalanceEntity } from '../userBalance/userBalance.entity';
import { SalesUsersEntity } from '../sales/salesUsers.entity';
import { WhiteListEntity } from '../chatgpt/whiteList.entity';
import { FingerprintLogEntity } from '../userBalance/fingerprint.entity';
import { ChatLogEntity } from '../chatLog/chatLog.entity';
import { ChatGroupEntity } from '../chatGroup/chatGroup.entity';
import { MidjourneyEntity } from '../midjourney/midjourney.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalesUsersEntity,
      CramiEntity,
      CramiPackageEntity,
      UserEntity,
      BalanceEntity,
      AccountLogEntity,
      ConfigEntity,
      UserBalanceEntity,
      WhiteListEntity,
      FingerprintLogEntity,
      ChatLogEntity,
      ChatGroupEntity,
      MidjourneyEntity
    ]),
  ],
  providers: [CramiService, UserBalanceService],
  controllers: [CramiController],
  exports: [CramiService],
})
export class CramiModule {}
