import { IsArray, ArrayNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

interface KeyValue {
	configKey: string;
	configVal: any;
	infoKey: string
}

export class SetConfigCustomDto {
	@ApiProperty({ example: { configKey: 'siteName', configVal: 'NineAI', infoKey: 'NineAI' }, description: '设置更新配置信息' })
	@ValidateNested({ each: true })
	@Type(() => Object)
	settings: KeyValue;
}
