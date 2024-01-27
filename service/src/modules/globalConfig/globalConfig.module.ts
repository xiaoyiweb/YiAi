import { Global, Module } from '@nestjs/common';
import { GlobalConfigController } from './globalConfig.controller';
import { GlobalConfigService } from './globalConfig.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigEntity } from './config.entity';
import { ChatLogEntity } from '../chatLog/chatLog.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([ConfigEntity, ChatLogEntity])],
  providers: [GlobalConfigService],
  controllers: [GlobalConfigController],
  exports: [GlobalConfigService],
})
export class GlobalConfigModule {}
