import { Module } from '@nestjs/common';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';
import { BullModule } from '@nestjs/bull';
import { QueueProcessor } from './queue.process';

@Module({
  imports: [
    BullModule.registerQueueAsync({
      name: 'MJDRAW',
      useFactory: () => {
        const config: any = {
          port: +process.env.REDIS_PORT,
          host: process.env.REDIS_HOST,
        };
        process.env.REDIS_PASSWORD && (config.password = process.env.REDIS_PASSWORD);
        return {
          redis: config,
        };
      },
    }),
  ],
  controllers: [QueueController],
  providers: [QueueService, QueueProcessor],
})
export class QueueModule {}
