import { IsDefined } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class MjDrawDto {
  @ApiProperty({
    example:
      'close-up polaroid photo, of a little joyful cute panda, in the forest, sun rays coming, photographic, sharp focus, depth of field, soft lighting, heigh quality, 24mm, Nikon Z FX',
    description: '绘画提示词！',
    required: true,
  })
  @IsDefined({ message: '绘画提示词是必传参数！' })
  prompt: string;
}
