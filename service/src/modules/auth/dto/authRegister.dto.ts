import { IsNotEmpty, MinLength, MaxLength, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UserRegisterDto {
  @ApiProperty({ example: 'cooper', description: '用户名称' })
  @IsNotEmpty({ message: '用户名不能为空！' })
  @MinLength(2, { message: '用户名最低需要大于2位数！' })
  @MaxLength(12, { message: '用户名不得超过12位！' })
  username?: string;

  @ApiProperty({ example: '123456', description: '用户密码' })
  @IsNotEmpty({ message: '用户密码不能为空' })
  @MinLength(6, { message: '用户密码最低需要大于6位数！' })
  @MaxLength(30, { message: '用户密码最长不能超过30位数！' })
  password: string;

  @ApiProperty({ example: 'J_longyan@163.com', description: '用户邮箱' })
  @IsEmail({}, { message: '请填写正确格式的邮箱！' })
  @IsNotEmpty({ message: '邮箱不能为空！' })
  email: string;

  @ApiProperty({ example: '5k3n', description: '图形验证码' })
  @IsNotEmpty({ message: '验证码为空！' })
  captchaCode: string;

  @ApiProperty({ example: '2313ko423ko', description: '图形验证码KEY' })
  @IsNotEmpty({ message: '验证ID不能为空！' })
  captchaId: string;

  @ApiProperty({ example: 'FRJDLJHFNV', description: '用户填写的别人邀请码', required: false })
  @IsOptional()
  invitedBy: string;

  @ApiProperty({
    example: 'https://public-1300678944.cos.ap-shanghai.myqcloud.com/blog/1682571295452image.png',
    description: '用户头像',
    required: false,
  })
  @IsOptional()
  avatar: string;

  @ApiProperty({ example: 'default', description: '用户注册来源', required: false })
  @IsOptional()
  client: string;
}
