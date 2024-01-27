import { Global, Module } from '@nestjs/common';
import { AutoreplyController } from './autoreply.controller';
import { AutoreplyService } from './autoreply.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutoReplyEntity } from './autoreplay.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AutoReplyEntity])],
  controllers: [AutoreplyController],
  providers: [AutoreplyService],
  exports: [AutoreplyService],
})
export class AutoreplyModule {}
