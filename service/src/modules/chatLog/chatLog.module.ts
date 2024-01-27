import { Global, Module } from '@nestjs/common';
import { ChatLogService } from './chatLog.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatLogEntity } from './chatLog.entity';
import { ChatLogController } from './chatLog.controller';
import { UserEntity } from '../user/user.entity';
import { BadWordsEntity } from '../badwords/badwords.entity';
import { ChatGroupEntity } from '../chatGroup/chatGroup.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([ChatLogEntity, UserEntity, BadWordsEntity, ChatGroupEntity])],
  controllers: [ChatLogController],
  providers: [ChatLogService],
  exports: [ChatLogService],
})
export class ChatLogModule {}
