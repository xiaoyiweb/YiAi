import { IsNotEmpty, MinLength, MaxLength, IsString, IsIn, IsOptional, Max, Min, ValidateNested, IsNumber, IsDefined } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BaseEntity } from 'typeorm';

export class UpdateUserSalesDto {
  @ApiProperty({ example: 10, description: '佣金比例', required: false })
  @IsOptional()
  @IsNumber({}, { message: '佣金比例必须是数字' })
  performanceRatio: number;

  @ApiProperty({ example: '超级合伙人', description: '自定义分销商名称', required: false })
  @IsOptional()
  salesOutletName: string;

  @ApiProperty({ example: 1, description: '用户ID' })
  @IsNumber({}, { message: '用户ID必须是数字' })
  userId: number;
}
