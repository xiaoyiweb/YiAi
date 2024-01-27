import { IsNotEmpty, MinLength, MaxLength, IsEmail, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QueryMenuDto {
  @ApiProperty({ example: 1, description: '菜单平台 0:移动端 1：pc端', required: true })
  @IsOptional()
  menuPlatform: number;
}
