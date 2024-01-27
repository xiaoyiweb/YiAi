import { ChatLogEntity } from '../chatLog/chatLog.entity';
import { Global, Module } from '@nestjs/common';
import { MjService } from './mj.service';
import { MjController } from './mj.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BalanceEntity } from '../userBalance/balance.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([ChatLogEntity, BalanceEntity])],
  providers: [MjService],
  controllers: [MjController],
  exports: [MjService],
})
export class MjModule {}
