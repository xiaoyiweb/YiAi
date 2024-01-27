import { Global, Module } from '@nestjs/common';
import { BadwordsService } from './badwords.service';
import { BadwordsController } from './badwords.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BadWordsEntity } from './badwords.entity';
import { ViolationLogEntity } from './violationLog.entity';
import { UserEntity } from '../user/user.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([BadWordsEntity, ViolationLogEntity, UserEntity])],
  providers: [BadwordsService],
  controllers: [BadwordsController],
  exports: [BadwordsService],
})
export class BadwordsModule {}
