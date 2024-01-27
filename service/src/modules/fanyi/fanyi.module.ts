import { Global, Module } from '@nestjs/common';
import { FanyiService } from './fanyi.service';
import { FanyiController } from './fanyi.controller';

@Global()
@Module({
  providers: [FanyiService],
  controllers: [FanyiController],
  exports: [FanyiService],
})
export class FanyiModule {}
