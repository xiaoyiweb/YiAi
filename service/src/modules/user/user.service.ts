import { GlobalConfigService } from '../globalConfig/globalConfig.service';
import { UserStatusEnum, UserStatusErrMsg } from '../../common/constants/user.constant';
import { MailerService } from '@nestjs-modules/mailer';
import { VerifycationEntity } from '../verification/verifycation.entity';
import { VerificationService } from '../verification/verification.service';
import { Injectable, HttpException, HttpStatus, Global } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection, UpdateResult, Not, Like, In, MoreThan } from 'typeorm';
import { UserRegisterDto } from '../auth/dto/authRegister.dto';
import { UserEntity } from './user.entity';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

import * as _ from 'lodash';
import { UserLoginDto } from '../auth/dto/authLogin.dto';
import { VerificationEnum } from '@/common/constants/verification.constant';
import { UserBalanceService } from '../userBalance/userBalance.service';
import { UpdateUserDto } from './dto/updateUser.dto';
import { Request, Response } from 'express';
import {
  createRandomCode,
  createRandomUid,
  formatCreateOrUpdateDate,
  generateRandomString,
  getClientIp,
  maskEmail,
  maskIpAddress,
} from '@/common/utils';
import { UserRechargeDto } from './dto/userRecharge.dto';
import { RechargeType } from '@/common/constants/balance.constant';
import { QueryAllUserDto } from './dto/queryAllUser.dto';
import { UpdateUserStatusDto } from './dto/updateUserStatus.dto';
import { ResetUserPassDto } from './dto/resetUserPass.dto';
import { ConfigEntity } from '../globalConfig/config.entity';
import { WhiteListEntity } from '../chatgpt/whiteList.entity';
import { AuthService } from '../auth/auth.service';
import { UserRegisterByPhoneDto } from '../auth/dto/userRegisterByPhone.dto';
import { RetrieveUserDto } from './dto/retrieve.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userEntity: Repository<UserEntity>,
    @InjectRepository(WhiteListEntity)
    private readonly whiteListEntity: Repository<WhiteListEntity>,
    private readonly connection: Connection,
    private readonly verificationService: VerificationService,
    private readonly mailerService: MailerService,
    private readonly userBalanceService: UserBalanceService,
    private readonly globalConfigService: GlobalConfigService,
    @InjectRepository(ConfigEntity)
    private readonly configEntity: Repository<ConfigEntity>,
  ) {}

  /* create and verify */
  async createUserAndVerifycation(user: UserEntity | UserRegisterDto, req: Request): Promise<UserEntity> {
    const { username, email, password, invitedBy, client = 0 } = user;
    if (invitedBy) {
      const b = await this.userEntity.findOne({ where: { inviteCode: invitedBy } });
      if (!b) {
        throw new HttpException('无效的邀请码！', HttpStatus.BAD_REQUEST);
      }
    }

    /* 用户是否已经在系统中 */
    const where = [{ username }, { email }];
    const u: UserEntity = await this.userEntity.findOne({ where: where });

    if (u && u.status !== UserStatusEnum.PENDING) {
      throw new HttpException('用户名或者邮箱已被注册！', HttpStatus.BAD_REQUEST);
    }

    try {
      const userInput: any = _.cloneDeep(user);
      const hashedPassword = bcrypt.hashSync(password, 10);
      const ip = getClientIp(req);
      userInput.password = hashedPassword;
      userInput.registerIp = ip;
      userInput.client = client;

      let n: UserEntity;
      /* 如果没有注册用户则首次注册记录 如果注册了覆盖发送验证码即可 无需记录用户 */
      if (!u) {
        const userDefautlAvatar = await this.globalConfigService.getConfigs(['userDefautlAvatar']);
        userInput.avatar = userDefautlAvatar;
        n = await this.userEntity.save(userInput);
      } else {
        n = u;
      }
      const emailConfigs = await this.configEntity.find({
        where: {
          configKey: In([
            'isVerifyEmail',
            'registerBaseUrl',
            'registerVerifyEmailTitle',
            'registerVerifyEmailDesc',
            'registerVerifyEmailFrom',
            'registerVerifyExpir',
          ]),
        },
      });

      const configMap: any = emailConfigs.reduce((pre, cur: any) => {
        pre[cur.configKey] = cur.configVal;
        return pre;
      }, {});

      const isVerifyEmail = configMap['isVerifyEmail'] ? Number(configMap['isVerifyEmail']) : 1;
      if (isVerifyEmail) {
        const expir = configMap['registerVerifyExpir'] ? Number(configMap['registerVerifyExpir']) : 30 * 60;
        const v: VerifycationEntity = await this.verificationService.createVerification(n, VerificationEnum.Registration, expir);
        const { code, email, id } = v;
        const { registerVerifyEmailFrom } = configMap;
        console.log('configMap: ', configMap);
        /* 判断是否开启邮箱验证 */
        const res = await this.mailerService.sendMail({
          to: email,
          subject: `来自${registerVerifyEmailFrom}的账号激活`,
          template: 'register',
          context: { baseUrl: configMap['registerBaseUrl'], code, id, ...configMap },
        });
        console.log('email response  -> : ', res);
      } else {
        /* 如果没有邮箱验证则 则直接主动注册验证通过逻辑 */
        const { username, email, id, invitedBy } = n;
        await this.updateUserStatus(id, UserStatusEnum.ACTIVE);
        /* 如果用户填写了 invitedBy 邀请码 查到邀请人信息 */
        let inviteUser: UserEntity;
        if (invitedBy) {
          inviteUser = await this.qureyUserInfoByInviteCode(invitedBy);
        }
        await this.userBalanceService.addBalanceToNewUser(id, inviteUser?.id);
      }
      return n;
    } catch (error) {
      console.log('error: ', error);
      throw error;
    }
  }

  async getSuper() {
    const user = await this.userEntity.findOne({ where: { role: 'super' } });
    return user;
  }

  /* 账号登录验证密码 扫码登录则不用 */
  async verifyUserCredentials(user): Promise<UserEntity> {
    const { username, password, uid = 0, phone } = user;
    let u = null;

    /* 三方登录的 */
    if (uid > 0) {
      u = await this.userEntity.findOne({ where: { id: uid } });
      if (!u) {
        throw new HttpException('当前账户不存在！', HttpStatus.BAD_REQUEST);
      }
      if (u.password.startsWith('$2a$') || u.password.startsWith('$2b$') || u.password.startsWith('$2y$')) {
        // 如果是默认
        if (!bcrypt.compareSync(password, u.password)) {
          throw new HttpException('当前密码错误！', HttpStatus.BAD_REQUEST);
        }
      } else {
        //如果是md5加密
        console.log('----,');

        const md5 = crypto.createHash('md5').update(password).digest('hex');
        console.log('----,', md5);
        if (md5 !== u.password) {
          throw new HttpException('当前密码错误！', HttpStatus.BAD_REQUEST);
        }
      }
    }

    /* 邮箱登录的 */
    if (username && password) {
      const where: any = [{ username }, { email: username }];
      u = await this.userEntity.findOne({ where: where });
      if (!u) {
        throw new HttpException('当前账户不存在！', HttpStatus.BAD_REQUEST);
      }
      if (u.password.startsWith('$2a$') || u.password.startsWith('$2b$') || u.password.startsWith('$2y$')) {
        // 如果是默认
        if (!bcrypt.compareSync(password, u.password)) {
          throw new HttpException('当前密码错误！', HttpStatus.BAD_REQUEST);
        }
      } else {
        //如果是md5加密
        console.log('----,');

        const md5 = crypto.createHash('md5').update(password).digest('hex');
        console.log('----,', md5);

        if (md5 !== u.password) {
          throw new HttpException('当前密码错误！', HttpStatus.BAD_REQUEST);
        }
      }
    }

    /* 手机号登录的 */
    if (phone && password) {
      const where: any = [{ phone }];
      u = await this.userEntity.findOne({ where: where });
      if (!u) {
        throw new HttpException('当前账户不存在！', HttpStatus.BAD_REQUEST);
      }
      if (u.password.startsWith('$2a$') || u.password.startsWith('$2b$') || u.password.startsWith('$2y$')) {
        // 如果是默认
        if (!bcrypt.compareSync(password, u.password)) {
          throw new HttpException('当前密码错误！', HttpStatus.BAD_REQUEST);
        }
      } else {
        //如果是md5加密
        console.log('----,');

        const md5 = crypto.createHash('md5').update(password).digest('hex');
        console.log('----,', md5);

        if (md5 !== u.password) {
          throw new HttpException('当前密码错误！', HttpStatus.BAD_REQUEST);
        }
      }
    }

    if (!u) {
      throw new HttpException('当前账户不存在！', HttpStatus.BAD_REQUEST);
    }
    if (u.status !== UserStatusEnum.ACTIVE) {
      throw new HttpException(UserStatusErrMsg[u.status], HttpStatus.BAD_REQUEST);
    }

    return u;
  }

  async verifyUserPassword(userId, password) {
    const u = await this.userEntity.findOne({ where: { id: userId } });
    if (u.password.startsWith('$2a$') || u.password.startsWith('$2b$') || u.password.startsWith('$2y$')) {
      //非MD5加密
      return bcrypt.compareSync(password, u.password);
    } else {
      // 如果是md5加密
      const md5 = crypto.createHash('md5').update(password).digest('hex');
      console.log('----,', md5);

      return md5 === u.password;
    }
  }

  async updateUserStatus(id: number, status: UserStatusEnum) {
    const u: UpdateResult = await this.userEntity.update({ id }, { status });
    return u.affected > 0;
  }

  async getUserStatus(id: number): Promise<number> {
    const u: UserEntity = await this.userEntity.findOne({ where: { id } });
    return u.status;
  }

  async queryUserInfoById(id: number): Promise<UserEntity> {
    return await this.userEntity.findOne({ where: { id } });
  }

  async queryOneUserInfo(userId: number): Promise<UserEntity> {
    return await this.userEntity.findOne({ where: { id: userId } });
  }

  /* 检查用户状态 */
  async checkUserStatus(user) {
    const { id: userId, role } = user;
    if (role === 'visitor') return true;
    const u = await this.userEntity.findOne({ where: { id: userId } });
    if (!u) {
      throw new HttpException('当前用户信息失效、请重新登录！', HttpStatus.UNAUTHORIZED);
    }
    if (u.status === UserStatusEnum.BLACKLISTED) {
      throw new HttpException('您的账户已被永久加入黑名单、如有疑问、请联系管理员！', HttpStatus.BAD_REQUEST);
    }
    if (u.status === UserStatusEnum.LOCKED) {
      throw new HttpException('您的账户已被封禁、如有疑问、请联系管理员！', HttpStatus.BAD_REQUEST);
    }
  }

  /* 获取用户基础信息 */
  async getUserInfo(userId: number) {
    const userInfo: any = await this.userEntity.findOne({
      where: { id: userId },
      select: ['username', 'avatar', 'role', 'email', 'sign', 'inviteCode', 'openId', 'consecutiveDays'],
    });
    if (!userInfo) {
      throw new HttpException('当前用户信息失效、请重新登录！', HttpStatus.UNAUTHORIZED);
    }
    userInfo.isBindWx = !!userInfo?.openId;
    delete userInfo.openId;
    const userBalance = await this.userBalanceService.queryUserBalance(userId);
    return { userInfo, userBalance: { ...userBalance } };
  }

  /* 获取用户信息 */
  async getUserById(id: number) {
    return await this.userEntity.findOne({ where: { id } });
  }

  /* 通过openId获取用户信息 */
  async getUserOpenId(openId: string) {
    return await this.userEntity.findOne({ where: { openId } });
  }

  /* 修改用户信息 */
  async updateInfo(body: UpdateUserDto, req: Request) {
    const { id } = req.user;

    const u = await this.userEntity.findOne({ where: { id } });
    if (!u) {
      throw new HttpException('当前用户不存在！', HttpStatus.BAD_REQUEST);
    }
    if (body.username && u.username === body.username) {
      throw new HttpException('没有变更，无需更改！', HttpStatus.BAD_REQUEST);
    }

    if (body.username) {
      const u = await this.userEntity.findOne({ where: { username: body.username, id: Not(id) } });
      if (u) {
        throw new HttpException('用户名已存在！', HttpStatus.BAD_REQUEST);
      }
    }
    const r = await this.userEntity.update({ id }, body);
    if (r.affected <= 0) {
      throw new HttpException('修改用户信息失败！', HttpStatus.BAD_REQUEST);
    }
    return '修改用户信息成功！';
  }

  /* 修改用户密码 */
  async updateUserPassword(userId: number, password: string) {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const r = await this.userEntity.update({ id: userId }, { password: hashedPassword });
    if (r.affected <= 0) {
      throw new HttpException('修改密码失败、请重新试试吧。', HttpStatus.BAD_REQUEST);
    }
  }

  /* 生成用户邀请码  */
  async genInviteCode(req: Request) {
    const { id } = req.user;
    const u = await this.userEntity.findOne({ where: { id } });
    if (!u || u.inviteCode) {
      throw new HttpException('已生成过邀请码、请勿重复生成', HttpStatus.BAD_REQUEST);
    }
    const inviteCode = generateRandomString();
    const user = await this.userEntity.findOne({ where: { inviteCode } });
    if (user) {
      throw new HttpException('生成邀请码失败，请重新试一次吧！', HttpStatus.BAD_REQUEST);
    }
    const r = await this.userEntity.update({ id }, { inviteCode });
    if (r.affected <= 0) {
      throw new HttpException('生成邀请码失败，请重新试一次吧！', HttpStatus.BAD_REQUEST);
    }
    return inviteCode;
  }

  /* 获取我得邀请记录 */
  async getInviteRecord(req, query) {
    try {
      const { id } = req.user;
      const { page = 1, size = 10 } = query;
      const u = await this.userEntity.findOne({ where: { id } });
      const { inviteCode } = u;
      if (!inviteCode) return [];
      const [rows, count] = await this.userEntity.findAndCount({
        where: { inviteCode },
        order: { id: 'DESC' },
        select: ['username', 'email', 'createdAt', 'status', 'avatar'],
        take: size,
        skip: (page - 1) * size,
      });
      formatCreateOrUpdateDate(rows).map((t) => {
        t.email = maskEmail(t.email);
        return t;
      });
      return { rows, count };
    } catch (error) {
      console.log('error: ', error);
      throw new HttpException('获取邀请记录失败！', HttpStatus.BAD_REQUEST);
    }
  }

  /* 邀请链接被点击 */
  async inviteLink(code) {
    const u = await this.userEntity.findOne({ where: { inviteCode: code } });
    if (!u) return 1;
    const { inviteLinkCount = 0 } = u;
    const res = await this.userEntity.update({ inviteCode: code }, { inviteLinkCount: inviteLinkCount + 1 });
    if (res.affected) {
      return 1;
    } else {
      return 0;
    }
  }

  /* 通过邀请码查询邀请人信息 */
  async qureyUserInfoByInviteCode(inviteCode: string): Promise<UserEntity> {
    return await this.userEntity.findOne({ where: { inviteCode } });
  }

  /* 给用户充值 */
  async userRecharge(body: UserRechargeDto) {
    const { userId, model3Count = 0, model4Count = 0, drawMjCount = 0 } = body;
    await this.userBalanceService.addBalanceToUser(userId, { model3Count, model4Count, drawMjCount });
    const res = await this.userBalanceService.saveRecordRechargeLog({
      userId,
      rechargeType: RechargeType.ADMIN_GIFT,
      model3Count,
      model4Count,
      drawMjCount,
      extent: '',
    });
    return res;
  }

  /* 查询所有用户 */
  async queryAll(query: QueryAllUserDto, req: Request) {
    const { page = 1, size = 10, username, email, status, keyword, phone } = query;
    let where = {};
    username && Object.assign(where, { username: Like(`%${username}%`) });
    email && Object.assign(where, { email: Like(`%${email}%`) });
    phone && Object.assign(where, { phone: Like(`%${phone}%`) });
    status && Object.assign(where, { status });
    if (keyword) {
      where = [{ username: Like(`%${keyword}%`) }, { email: Like(`%${keyword}%`) }, { phone: Like(`%${keyword}%`) }];
    }
    const [rows, count] = await this.userEntity.findAndCount({
      skip: (page - 1) * size,
      where,
      take: size,
      order: { createdAt: 'DESC' },
      cache: true,
      select: ['username', 'avatar', 'inviteCode', 'role', 'sign', 'status', 'id', 'email', 'createdAt', 'lastLoginIp', 'phone'],
    });
    const ids = rows.map((t) => t.id);
    const data = await this.userBalanceService.queryUserBalanceByIds(ids);
    rows.forEach((user: any) => (user.balanceInfo = data.find((t) => t.userId === user.id)));
    req.user.role !== 'super' && rows.forEach((t) => (t.email = maskEmail(t.email)));
    req.user.role !== 'super' && rows.forEach((t) => (t.lastLoginIp = maskIpAddress(t.lastLoginIp)));
    req.user.role !== 'super' && rows.forEach((t) => (t.phone = maskIpAddress(t.phone)));
    return { rows, count };
  }

  /* 查询单个用户详情 */
  async queryOne({ id }) {
    return await this.userEntity.findOne({ where: { id }, select: ['username', 'avatar', 'inviteCode', 'role', 'sign', 'status'] });
  }

  /* 修改用户状态 */
  async updateStatus(body: UpdateUserStatusDto) {
    const { id, status } = body;
    const n = await this.userEntity.findOne({ where: { id } });
    if (!n) {
      throw new HttpException('用户不存在！', HttpStatus.BAD_REQUEST);
    }
    if (n.role === 'super') {
      throw new HttpException('超级管理员不可被操作！', HttpStatus.BAD_REQUEST);
    }

    if (n.status === UserStatusEnum.PENDING) {
      throw new HttpException('未激活用户不可手动变更状态！', HttpStatus.BAD_REQUEST);
    }
    if (n.role === 'super') {
      throw new HttpException('超级管理员不可被操作！', HttpStatus.BAD_REQUEST);
    }
    if (status === UserStatusEnum.PENDING) {
      throw new HttpException('不可将用户置为未激活状态！', HttpStatus.BAD_REQUEST);
    }
    const r = await this.userEntity.update({ id }, { status });
    if (r.affected <= 0) {
      throw new HttpException('修改用户状态失败！', HttpStatus.BAD_REQUEST);
    }
    return '修改用户状态成功！';
  }

  /* 重置用户密码 */
  async resetUserPass(body: ResetUserPassDto) {
    const { id } = body;
    const u = await this.userEntity.findOne({ where: { id } });
    if (!u) {
      throw new HttpException('用户不存在！', HttpStatus.BAD_REQUEST);
    }
    const defaultPassword = '123456';
    const hashPassword = bcrypt.hashSync(defaultPassword, 10);
    const raw = await this.userEntity.update({ id }, { password: hashPassword });
    if (raw.affected <= 0) {
      throw new HttpException('重置密码失败！', HttpStatus.BAD_REQUEST);
    }
    return `密码重置为[${defaultPassword}]成功!`;
  }

  /* 记录登录ip */
  async savaLoginIp(userId: number, ip: string) {
    return await this.userEntity.update({ id: userId }, { lastLoginIp: ip });
  }

  /* 通过openId 拿到或创建 */
  async getUserFromOpenId(openId: string, sceneStr?: string) {
    const user = await this.userEntity.findOne({ where: { openId } });
    if (!user) {
      const inviteCode = sceneStr ? sceneStr.split(':')[1] : '';
      const inviteUser = await this.qureyUserInfoByInviteCode(inviteCode);
      const user = await this.createUserFromOpenId(openId, inviteCode);
      await this.userBalanceService.addBalanceToNewUser(user.id, inviteCode ? inviteUser?.id : null);
      return user;
    }
    return user;
  }

  /* 通过openId创建一个用户, 传入邀请码 是邀请人的不是自己的 */
  async createUserFromOpenId(openId: string, invitedBy: string) {
    const userDefautlAvatar = await this.globalConfigService.getConfigs(['userDefautlAvatar']);
    const userInfo = {
      avatar: userDefautlAvatar,
      username: `用户${createRandomUid()}`,
      status: UserStatusEnum.ACTIVE,
      sex: 0,
      email: `${createRandomUid()}@default.com`,
      invitedBy,
      openId,
    };
    const user = await this.userEntity.save(userInfo);
    return user;
  }

  async bindWx(openId, userId) {
    try {
      const user = await this.userEntity.findOne({ where: { id: userId } });
      if (!user) return { status: false, msg: '当前绑定用户不存在！' };
      const bindU = await this.userEntity.findOne({ where: { openId } });
      if (bindU) return { status: false, msg: '该微信已绑定其他账号！' };
      const res = await this.userEntity.update({ id: userId }, { openId });
      if (res.affected <= 0) return { status: false, msg: '绑定微信失败、请联系管理员！' };
      return { status: true, msg: '恭喜您绑定成功、后续可直接扫码登录了！' };
    } catch (error) {
      return { status: false, msg: '绑定微信失败、请联系管理员！' };
    }
  }

  /* 通过userId获取用户的openId */
  async getOpenIdByUserId(userId: number) {
    const user = await this.userEntity.findOne({ where: { id: userId } });
    return user?.openId;
  }

  /* 校验手机号注册 */
  async verifyUserRegisterByPhone(params: UserRegisterByPhoneDto) {
    const { username, password, phone, phoneCode } = params;
    const user = await this.userEntity.findOne({ where: [{ username }, { phone }] });
    if (user && user.username === username) {
      throw new HttpException('用户名已存在、请更换用户名！', HttpStatus.BAD_REQUEST);
    }
    if (user && user.phone === phone) {
      throw new HttpException('当前手机号已注册、请勿重复注册！', HttpStatus.BAD_REQUEST);
    }
  }

  /* 创建基础用户 */
  async createUser(userInfo) {
    return await this.userEntity.save(userInfo);
  }
}
