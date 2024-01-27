import { IsIn, IsOptional, Max, Min, ValidateNested, IsNumber, IsDefined, isNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BaseEntity } from 'typeorm';

export class AuditOrderDto {
  @ApiProperty({ example: 1, description: '审核工单状态', required: true })
  @IsIn([1, -1], { message: '非法工单状态' })
  status: number;

  @ApiProperty({ example: 1, description: '工单id', required: true })
  @IsNumber({}, { message: '工单id必须为数字' })
  id: number;
}
