import { IsNotEmpty, MinLength, MaxLength, IsString, IsIn, IsOptional, Max, Min, ValidateNested, IsNumber, IsDefined } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BaseEntity } from 'typeorm';

export class RecordsQueryDto {
  @ApiProperty({ example: 1, description: '查询页数', required: false })
  @IsOptional()
  page: number;

  @ApiProperty({ example: 10, description: '每页数量', required: false })
  @IsOptional()
  size: number;

  @ApiProperty({ example: 'c8c479601c1e11eea4c49fad2cbd3ccd', description: '订单ID', required: false })
  @IsOptional()
  orderId: string;

  @ApiProperty({ example: 10, description: '订单价格', required: false })
  @IsOptional()
  orderPrice: number;
}
