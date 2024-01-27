import { Module } from '@nestjs/common';
import { StatisticController } from './statistic.controller';
import { StatisticService } from './statistic.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../user/user.entity';
import { ChatLogEntity } from '../chatLog/chatLog.entity';
import { ConfigEntity } from '../globalConfig/config.entity';
import { OrderEntity } from '../order/order.entity';
import { MidjourneyEntity } from '../midjourney/midjourney.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, ChatLogEntity, ConfigEntity, OrderEntity, MidjourneyEntity])],
  controllers: [StatisticController],
  providers: [StatisticService],
})
export class StatisticModule {}
