import { Global, Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { Type } from 'class-transformer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesUsersEntity } from './salesUsers.entity';
import { SalesRecordsEntity } from './salesRecords.entity';
import { UserEntity } from '../user/user.entity';
import { SalesOrderEntity } from './salesOrder.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([SalesUsersEntity, SalesRecordsEntity, UserEntity, SalesOrderEntity])],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
