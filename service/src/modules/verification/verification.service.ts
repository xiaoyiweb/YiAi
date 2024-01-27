import { GlobalConfigService } from '@/modules/globalConfig/globalConfig.service';
import { VerificationUseStatusEnum } from '../../common/constants/status.constant';
import { UserService } from '../user/user.service';
import { VerifyCodeDto } from './dto/verifyCode.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VerifycationEntity } from './verifycation.entity';
import { UserEntity } from '../user/user.entity';
import { VerificationEnum } from '../../common/constants/verification.constant';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { createRandomCode } from '@/common/utils';
import { UserStatusEnum } from '@/common/constants/user.constant';
import { RedisCacheService } from '../redisCache/redisCache.service';

import * as Core from '@alicloud/pop-core';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(VerifycationEntity)
    private readonly verifycationEntity: Repository<VerifycationEntity>,
    private readonly globalConfigService: GlobalConfigService,
    private readonly redisCacheService: RedisCacheService,
  ) {}

  // TODO Transaction failed and cannot be rolled back
  async createVerification(user: UserEntity, type: VerificationEnum, expir = 30 * 60): Promise<VerifycationEntity> {
    const historyVerify = await this.verifycationEntity.findOne({ where: { userId: user.id, type }, order: { createdAt: 'DESC' } });
    // 限制一分钟内不得重新发送
    if (historyVerify && historyVerify.createdAt.getTime() + 1 * 60 * 1000 > Date.now()) {
      const diffS = Math.ceil((historyVerify.createdAt.getTime() + 1 * 60 * 1000 - Date.now()) / 1000);
      throw new HttpException(`${diffS}S内不得重新发送`, HttpStatus.BAD_REQUEST);
    }
    const code = createRandomCode();
    const expiresAt = new Date(Date.now() + expir * 1000);
    const { id, email } = user;
    const verifycation = { userId: id, type, code, expiresAt, email };
    return await this.verifycationEntity.save(verifycation);
  }

  async verifyCode({ code, id }: VerifyCodeDto, type: VerificationEnum): Promise<VerifycationEntity> {
    const v: VerifycationEntity = await this.verifycationEntity.findOne({ where: { id, type }, order: { createdAt: 'DESC' } });
    if (!v) {
      throw new HttpException('验证码不存在', HttpStatus.BAD_REQUEST);
    }
    if (v.used === VerificationUseStatusEnum.USED) {
      throw new HttpException('当前验证码已被使用！', HttpStatus.BAD_REQUEST);
    } else {
      v.used = VerificationUseStatusEnum.USED;
      await this.verifycationEntity.update({ id }, v);
    }
    if (Number(v.code) !== Number(code)) {
      throw new HttpException('验证码错误', HttpStatus.BAD_REQUEST);
    }
    if (v.expiresAt < new Date()) {
      throw new HttpException('验证码已过期', HttpStatus.BAD_REQUEST);
    }
    return v;
  }

  /* 图形验证码校验 */
  async verifyCaptcha(body) {
    const { captchaId, captchaCode } = body;
    const nameSpace = await this.globalConfigService.getNamespace();
    const key = `${nameSpace}:CAPTCHA:${captchaId}`;
    const code = await this.redisCacheService.get({ key });
    await this.redisCacheService.del({ key });
    if (!code) {
      throw new HttpException('图形验证码已过期、请重新输入!', HttpStatus.BAD_REQUEST);
    }
    if (!code || code !== captchaCode) {
      throw new HttpException('图形验证码错误、请检查填写!', HttpStatus.BAD_REQUEST);
    }
  }

  async sendPhoneCode(messageInfo) {
    const { accessKeyId, accessKeySecret, SignName, TemplateCode } = await this.globalConfigService.getPhoneVerifyConfig();
    const { phone, code } = messageInfo;
    if (!phone || !code) {
      throw new HttpException('确实必要参数错误！', HttpStatus.BAD_REQUEST);
    }
    const client = new Core({ accessKeyId, accessKeySecret, endpoint: 'https://dysmsapi.aliyuncs.com', apiVersion: '2017-05-25' });
    const params = { PhoneNumbers: phone, SignName, TemplateCode, TemplateParam: JSON.stringify({ code }) };
    const requestOption = { method: 'POST', formatParams: false };
    try {
      const response: any = await client.request('SendSms', params, requestOption);
      if (response.Code === 'OK') {
        return true;
      } else {
        throw new HttpException(response.Message || '验证码发送失败！', HttpStatus.BAD_REQUEST);
      }
    } catch (error) {
      throw new HttpException(error?.data?.Message || '验证码发送失败！', HttpStatus.BAD_REQUEST);
    }
  }
}
