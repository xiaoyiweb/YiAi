import { IsIn, IsOptional, Max, Min, ValidateNested, IsNumber, IsDefined, isNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BaseEntity } from 'typeorm';

export class AppForMoneyDto {
  @ApiProperty({ example: 10, description: '提现金额', required: true })
  @IsNumber({}, { message: '提现金额必须为数字' })
  @Min(0, { message: '提现金额必须大于0' })
  withdrawalAmount: number;

  @ApiProperty({ example: 1, description: '提现渠道', required: true })
  @IsIn([1, 2], { message: '提现渠道非法' })
  withdrawalChannels: number;

  @ApiProperty({ example: 10, description: '提款联系方式', required: true })
  contactInformation: string;

  @ApiProperty({ example: 10, description: '提款备注', required: false })
  @IsOptional()
  remark: string;
}
