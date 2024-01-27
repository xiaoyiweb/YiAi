import { Module } from '@nestjs/common';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuEntity } from './menu.entity';

@Module({
  imports:[TypeOrmModule.forFeature([MenuEntity])],
  controllers: [MenuController],
  providers: [MenuService]
})
export class MenuModule {}
