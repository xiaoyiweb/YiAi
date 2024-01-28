import { GlobalConfigService } from '../globalConfig/globalConfig.service';
import { InjectRepository } from '@nestjs/typeorm';
import { BalanceEntity } from './balance.entity';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { In, LessThan, Repository } from 'typeorm';
import { RechargeType } from '@/common/constants/balance.constant';
import { AccountLogEntity } from './accountLog.entity';
import { Request } from 'express';
import { createRandomUid, hideString } from '@/common/utils';
import { ConfigEntity } from '../globalConfig/config.entity';
import { CramiPackageEntity } from '../crami/cramiPackage.entity';
import { UserBalanceEntity } from './userBalance.entity';
// import * as dayjs from 'dayjs';
import dayjs, { formatCreateOrUpdateDate, formatDate } from '@/common/utils/date';
import { UserEntity } from '../user/user.entity';
import { SalesUsersEntity } from '../sales/salesUsers.entity';
import { SalesService } from '../sales/sales.service';
import { WhiteListEntity } from '../chatgpt/whiteList.entity';
import { FingerprintLogEntity } from './fingerprint.entity';
import { ChatLogEntity } from '../chatLog/chatLog.entity';
import { ChatGroupEntity } from '../chatGroup/chatGroup.entity';
import { MidjourneyEntity } from '../midjourney/midjourney.entity';

interface LogInfo {
  userId: number;
  rechargeType: number;
  model3Count?: number;
  model4Count?: number;
  drawMjCount?: number;
  days?: number;
  pkgName?: string;
  extent?: string;
}

interface UserBalanceInfo {
  model3Count?: number;
  model4Count?: number;
  drawMjCount?: number;
}

@Injectable()
export class UserBalanceService {
  constructor(
    @InjectRepository(BalanceEntity)
    private readonly balanceEntity: Repository<BalanceEntity>,
    @InjectRepository(UserBalanceEntity)
    private readonly userBalanceEntity: Repository<UserBalanceEntity>,
    @InjectRepository(AccountLogEntity)
    private readonly accountLogEntity: Repository<AccountLogEntity>,
    @InjectRepository(CramiPackageEntity)
    private readonly cramiPackageEntity: Repository<CramiPackageEntity>,
    @InjectRepository(ConfigEntity)
    private readonly configEntity: Repository<ConfigEntity>,
    @InjectRepository(UserEntity)
    private readonly userEntity: Repository<UserEntity>,
    @InjectRepository(SalesUsersEntity)
    private readonly salesUsersEntity: Repository<SalesUsersEntity>,
    @InjectRepository(WhiteListEntity)
    private readonly whiteListEntity: Repository<WhiteListEntity>,
    @InjectRepository(FingerprintLogEntity)
    private readonly fingerprintLogEntity: Repository<FingerprintLogEntity>,
    @InjectRepository(ChatGroupEntity)
    private readonly chatGroupEntity: Repository<ChatGroupEntity>,
    @InjectRepository(ChatLogEntity)
    private readonly chatLogEntity: Repository<ChatLogEntity>,
    @InjectRepository(MidjourneyEntity)
    private readonly midjourneyEntity: Repository<MidjourneyEntity>,
    private readonly salesService: SalesService,
    private readonly globalConfigService: GlobalConfigService,
  ) {}

  /* 新注册用户赠送消费 */
  async addBalanceToNewUser(userId: number, invitedId: number) {
    try {
      // TODO 直接从globalConfig中获取配置
      const registerConfigs = await this.configEntity.find({
        where: {
          configKey: In([
            'registerSendStatus', // 开启注册赠送
            'registerSendModel3Count', // 注册赠送模型3聊天次数
            'registerSendModel4Count', // 注册赠送模型4聊天次数
            'registerSendDrawMjCount', // 注册赠送MJ绘画次数
            'firstRegisterSendStatus', // 开启优先注册赠送
            'firstRegisterSendRank', // 优先注册赠送名次
            'firstRregisterSendModel3Count', // 优先注册赠送模型3聊天次数
            'firstRregisterSendModel4Count', // 优先注册赠送模型4聊天次数
            'firstRregisterSendDrawMjCount', // 优先注册赠送MJ绘画次数
            'inviteSendStatus', // 开启邀请赠送
            'inviteGiveSendModel3Count', // 邀请赠送模型3聊天次数
            'inviteGiveSendModel4Count', // 邀请赠送模型4聊天次数
            'inviteGiveSendDrawMjCount', // 邀请赠送MJ绘画次数
            'invitedGuestSendModel3Count', // 被邀请人赠送模型3聊天次数
            'invitedGuestSendDrawMjCount', // 被邀请人赠送模型4聊天次数
            'invitedGuestSendModel4Count', // 被邀请人赠送MJ绘画次数
          ]),
        },
      });
      const configMap: any = registerConfigs.reduce((pre, cur: any) => {
        const num = Number(cur.configVal);
        const n = Number.isInteger(num) && num > 0 ? num : 0;
        pre[cur.configKey] = n;
        return pre;
      }, {});
      let model3Count = 0;
      let model4Count = 0;
      let drawMjCount = 0;

      /* 开启注册增送 */
      if (configMap.registerSendStatus === 1) {
        model3Count = model3Count + configMap.registerSendModel3Count;
        model4Count = model4Count + configMap.registerSendModel4Count;
        drawMjCount = drawMjCount + configMap.registerSendDrawMjCount;
      }

      /* 开启优先注册赠送并且在赠送范围内 */
      if (configMap.registerSendStatus === 1 && configMap.firstRegisterSendStatus === 1 && userId <= configMap.firstRegisterSendRank) {
        model3Count = model3Count + configMap.firstRregisterSendModel3Count;
        model4Count = model4Count + configMap.firstRregisterSendModel4Count;
        drawMjCount = drawMjCount + configMap.firstRregisterSendDrawMjCount;
      }

      /* 受邀人注册赠送日志 */
      await this.saveRecordRechargeLog({ userId, rechargeType: RechargeType.REG_GIFT, model3Count, drawMjCount, model4Count });
      /* 如果有被邀请人 */
      if (invitedId) {
        /* 如果开启邀请赠送 */
        if (Number(configMap.inviteSendStatus) === 1) {
          /* 被邀请人赠送 10次余额+1次绘画  */
          model3Count = model3Count + Number(configMap.invitedGuestSendModel3Count);
          model4Count = model4Count + Number(configMap.invitedGuestSendModel4Count);
          drawMjCount = drawMjCount + Number(configMap.invitedGuestSendDrawMjCount);
          /* 受邀人填写验证码的赠送 */
          await this.saveRecordRechargeLog({
            userId,
            rechargeType: RechargeType.INVITE_GIFT,
            model3Count: configMap.invitedGuestSendModel3Count,
            model4Count: configMap.invitedGuestSendModel4Count,
            drawMjCount: configMap.invitedGuestSendDrawMjCount,
          });

          /* 邀请人赠送30次余额加3次绘画  充值 */
          await this.addBalanceToUser(invitedId, {
            model3Count: configMap.inviteGiveSendModel3Count,
            model4Count: configMap.inviteGiveSendModel4Count,
            drawMjCount: configMap.inviteGiveSendDrawMjCount,
          });
          /* 邀请人充值日志 */
          await this.saveRecordRechargeLog({
            userId: invitedId,
            rechargeType: RechargeType.REFER_GIFT,
            model3Count: configMap.inviteGiveSendModel3Count,
            model4Count: configMap.inviteGiveSendModel4Count,
            drawMjCount: configMap.inviteGiveSendDrawMjCount,
          });
        }
      }
      /* 受邀人初次注册 一次领取所有额度 */
      await this.userBalanceEntity.save({ userId, model3Count, model4Count, drawMjCount, useTokens: 0 });
    } catch (error) {
      console.log('error: ', error);
      throw new HttpException('注册赠送失败,请联系管理员！', HttpStatus.BAD_REQUEST);
    }
  }

  /* 检查余额 */
  async validateBalance(req, type, amount) {
    const { id: userId, role } = req.user;
    let b = await this.userBalanceEntity.findOne({ where: { userId } });
    if (!b) {
      b = await this.createBaseUserBalance(userId);
    }
    if (role === 'visitor') {
      return this.validateVisitorBalance(req, type, amount);
    }
    const res: ConfigEntity = await this.configEntity.findOne({ where: { configKey: 'vxNumber' } });
    const vxNumber = res ? res.configVal : '---';
    /* 会员扣费key */
    const memberKey =
      type === 'model3' ? 'memberModel3Count' : type === 'model4' ? 'memberModel4Count' : type === 'mjDraw' ? 'memberDrawMjCount' : null;
    /* 非会员扣费key */
    const baseKey = type === 'model3' ? 'model3Count' : type === 'model4' ? 'model4Count' : type === 'mjDraw' ? 'drawMjCount' : null;
    /* 如果是会员 */
    if (b.packageId && b[memberKey] < amount) {
      if (b[baseKey] < amount) {
        throw new HttpException(`您的账户余额不足,如果想继续体验服务,请联系管理员 <VX: ${vxNumber}> 或购买专属套餐 ！`, HttpStatus.PAYMENT_REQUIRED);
      }
    }
    /* 如果不是会员 */
    if (!b.packageId && b[baseKey] < amount) {
      throw new HttpException(`您的账户余额不足,如果想继续体验服务,请联系管理员 <VX: ${vxNumber}> 或购买专属套餐 ！`, HttpStatus.PAYMENT_REQUIRED);
    }
    return b;
  }

  /* 检查游客的余额 */
  async validateVisitorBalance(req, type, amount) {
    const { id } = req.user;
    const baseKey = type === 'model3' ? 'model3Count' : type === 'model4' ? 'model4Count' : type === 'mjDraw' ? 'drawMjCount' : null;
    const now = new Date();
    const log = await this.fingerprintLogEntity.findOne({ where: { fingerprint: id } });
    /* 判断余额 */
    const { visitorModel3Num, visitorModel4Num, visitorMJNum } = await this.globalConfigService.getConfigs([
      'visitorModel3Num',
      'visitorModel4Num',
      'visitorMJNum',
    ]);
    const settings = {
      model3Count: visitorModel3Num ? Number(visitorModel3Num) : 0,
      model4Count: visitorModel4Num ? Number(visitorModel4Num) : 0,
      drawMjCount: visitorMJNum ? Number(visitorMJNum) : 0,
    };
    /* 如果没有 */
    if (!log) {
      const data = {
        fingerprint: id,
        model3Count: 0,
        model4Count: 0,
        drawMjCount: 0,
      };
      data[baseKey] = data[baseKey] + amount;
      /* 判断余额 */
      if (data[baseKey] > settings[baseKey]) {
        throw new HttpException(`今日当前类型免费额度已经使用完毕、建议您注册账户体验更加完整的服务内容！`, HttpStatus.PAYMENT_REQUIRED);
      } else {
        await this.fingerprintLogEntity.save(data);
        return true;
      }
    } else {
      const { model3Count, model4Count, drawMjCount } = log;
      let data = {
        model3Count,
        model4Count,
        drawMjCount,
      };
      /* 判断是否是昨天 */
      // const isUpdateLastDay = this.isUpdatedToday(log.updatedAt)
      // const date = Number(new Date(log.updatedAt)) + 8 * 60 * 60 * 1000
      const date = Number(new Date(log.updatedAt));
      const isUpdateLastDay = this.isUpdatedToday(date);
      if (isUpdateLastDay) {
        data[baseKey] = data[baseKey] + amount;
      } else {
        data = {
          model3Count: 0,
          model4Count: 0,
          drawMjCount: 0,
        };
        data[baseKey] = data[baseKey] + amount;
      }
      if (data[baseKey] > settings[baseKey]) {
        throw new HttpException(`今日当前类型免费额度已经使用完毕、建议您注册账户体验更加完整的服务内容！`, HttpStatus.PAYMENT_REQUIRED);
      } else {
        await this.fingerprintLogEntity.update({ fingerprint: id }, data);
        return true;
      }
    }
  }

  /* 判读上次更新是不是今天  */
  isUpdatedToday(date) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return date >= todayStart;
  }

  /* 消费  UseAmount是使用的token */
  async deductFromBalance(userId, deductionType, amount, UseAmount = 0) {
    const b = await this.userBalanceEntity.findOne({ where: { userId } });
    if (!b) {
      throw new HttpException('缺失当前用户账户记录！', HttpStatus.BAD_REQUEST);
    }

    /* 如果是会员 */
    const memberKey =
      deductionType === 'model3'
        ? 'memberModel3Count'
        : deductionType === 'model4'
        ? 'memberModel4Count'
        : deductionType === 'mjDraw'
        ? 'memberDrawMjCount'
        : null;

    /* 如果不是会员 */
    const baseKey =
      deductionType === 'model3' ? 'model3Count' : deductionType === 'model4' ? 'model4Count' : deductionType === 'mjDraw' ? 'drawMjCount' : null;
    /* 记录需要扣费的key */
    const updateKey = b.packageId && b[memberKey] < amount ? baseKey : b.packageId ? memberKey : baseKey;

    /* 记录使用值的key */
    let useKey = null;
    if (updateKey.includes('odel3')) {
      useKey = 'useModel3Token';
    }
    if (updateKey.includes('odel4')) {
      useKey = 'useModel4Token';
    }
    if (updateKey.includes('MjCount')) {
      useKey = 'useDrawMjToken';
    }
    /* 记录修改使用的token */
    const updateBalance = { [updateKey]: b[updateKey] - amount < 0 ? 0 : b[updateKey] - amount, [useKey]: b[useKey] + UseAmount };
    /* 记录修改使用的次数 mj不需要 */
    useKey === 'useModel3Token' && (updateBalance['useModel3Count'] = b['useModel3Count'] + amount);
    useKey === 'useModel4Token' && (updateBalance['useModel4Count'] = b['useModel4Count'] + amount);
    const result = await this.userBalanceEntity.update({ userId }, updateBalance);
    if (result.affected === 0) {
      throw new HttpException('消费余额失败！', HttpStatus.BAD_REQUEST);
    }
  }

  /* 查询用户余额 */
  async queryUserBalance(userId: number) {
    try {
      const res: any = await this.userBalanceEntity.findOne({
        where: { userId },
        select: [
          'packageId',
          'model3Count',
          'model4Count',
          'drawMjCount',
          'memberModel3Count',
          'memberModel4Count',
          'memberDrawMjCount',
          'useModel3Count',
          'useModel4Count',
          'useModel3Token',
          'useModel4Token',
          'useDrawMjToken',
          'expirationTime',
        ],
      });
      if (!res) {
        const user = await this.createBaseUserBalance(userId);
        if (user) {
          return await this.queryUserBalance(userId);
        } else {
          throw new HttpException('查询当前用户余额失败！', HttpStatus.BAD_REQUEST);
        }
      }
      res.sumModel3Count = res.packageId ? res.model3Count + res.memberModel3Count : res.model3Count;
      res.sumModel4Count = res.packageId ? res.model4Count + res.memberModel4Count : res.model4Count;
      res.sumDrawMjCount = res.packageId ? res.drawMjCount + res.memberDrawMjCount : res.drawMjCount;
      res.expirationTime = res.expirationTime ? formatDate(res.expirationTime, 'YYYY-MM-DD') : null;
      return res;
    } catch (error) {
      console.log('error: ', error);
    }
  }

  /* 记录充值日志 */
  async saveRecordRechargeLog(logInfo: LogInfo) {
    const { userId, rechargeType, model3Count, model4Count, drawMjCount, days = -1, pkgName = '', extent = '' } = logInfo;
    if (!userId) {
      throw new HttpException('当前用户不存在,记录充值日志异常', HttpStatus.BAD_REQUEST);
    }
    const uid = createRandomUid();
    return await this.accountLogEntity.save({ userId, rechargeType, model3Count, model4Count, drawMjCount, days, extent, uid, pkgName });
  }

  /* 创建一条基础的用户余额记录 */
  async createBaseUserBalance(userId: number, userBalanceInfo: UserBalanceInfo = {}) {
    const { model3Count = 0, model4Count = 0, drawMjCount = 0 } = userBalanceInfo;
    const balance = await this.userBalanceEntity.findOne({ where: { userId } });
    if (balance) {
      throw new HttpException('当前用户无需创建账户信息！', HttpStatus.BAD_REQUEST);
    }
    return await this.userBalanceEntity.save({ userId, model3Count, model4Count, drawMjCount });
  }

  /* 给用户增加固定次数额度 */
  async addBalanceToUser(userId, balance, days = -1) {
    try {
      const userBalanceInfo = (await this.userBalanceEntity.findOne({ where: { userId } })) || (await this.createBaseUserBalance(userId));
      if (!userBalanceInfo) {
        throw new HttpException('查询用户账户信息失败！', HttpStatus.BAD_REQUEST);
      }
      const { model3Count, model4Count, drawMjCount, memberModel3Count, memberModel4Count, memberDrawMjCount } = userBalanceInfo;
      let params = {};
      /* 是否充值会员套餐 大于0的时间天数都属于套餐 */
      if (days > 0) {
        const { packageId } = balance;
        if (!packageId) {
          throw new HttpException('缺失当前套餐ID、充值失败！', HttpStatus.BAD_REQUEST);
        }
        const pkgInfo = await this.cramiPackageEntity.findOne({ where: { id: packageId } });
        if (!pkgInfo) {
          throw new HttpException('当前套餐不存在！', HttpStatus.BAD_REQUEST);
        }
        const { weight } = pkgInfo; // 套餐的权重 = 会员等级
        /* 如果不是会员那么则直接充值进入并修改会员信息为会员身份 */
        if (!userBalanceInfo.packageId) {
          params = {
            memberModel3Count: model3Count + balance.model3Count,
            memberModel4Count: model4Count + balance.model4Count,
            memberDrawMjCount: drawMjCount + balance.drawMjCount,
            expirationTime: dayjs()
              .add(days > 0 ? days : 0, 'day')
              .format('YYYY-MM-DD HH:mm:ss'),
            packageId: packageId,
          };
        } else {
          /* 我当前使用的套餐信息 */
          const curPackageInfo = await this.cramiPackageEntity.findOne({ where: { id: userBalanceInfo.packageId } });
          /* 如果是会员则  充值更高或当前等级的套餐会进行时间覆盖充值余额叠加  充值低等级套餐只会叠加次数 不更新到期时间 */
          /* pkgLevel： 我当前的套餐等级 weight： 充值套餐的等级高于或等于当前套餐 则叠加时间并合并额度 */
          if (weight >= curPackageInfo.weight) {
            params = {
              memberModel3Count: memberModel3Count + balance.model3Count,
              memberModel4Count: memberModel4Count + balance.model4Count,
              memberDrawMjCount: memberDrawMjCount + balance.drawMjCount,
              expirationTime: dayjs(userBalanceInfo.expirationTime)
                .add(days > 0 ? days : 0, 'day')
                .format('YYYY-MM-DD HH:mm:ss'),
              packageId: packageId,
            };
          }
          /* 如果充值套餐小于当前套餐等级 只叠加次数 不延长时间 也不变更会员等级 */
          if (weight < curPackageInfo.weight) {
            params = {
              memberModel3Count: memberModel3Count + balance.model3Count,
              memberModel4Count: memberModel4Count + balance.model4Count,
              memberDrawMjCount: memberDrawMjCount + balance.drawMjCount,
            };
          }
        }
      }
      /* 充值不限时卡直接叠加 */
      if (days <= 0) {
        params = {
          model3Count: model3Count + balance.model3Count,
          model4Count: model4Count + balance.model4Count,
          drawMjCount: drawMjCount + balance.drawMjCount,
        };
      }
      const result = await this.userBalanceEntity.update({ userId }, params);
      if (result.affected === 0) {
        throw new HttpException(`${userId}充值失败`, HttpStatus.BAD_REQUEST);
      }
    } catch (error) {
      console.log('error: ', error);
      throw new HttpException('用户充值失败！', HttpStatus.BAD_REQUEST);
    }
  }

  /* 支付成功给用户充值套餐 */
  async addBalanceToOrder(order) {
    console.log('充值的工单信息:', order);
    try {
      const { userId, goodsId } = order;
      const pkg = await this.cramiPackageEntity.findOne({ where: { id: order.goodsId, status: 1 } });
      if (!pkg) {
        throw new HttpException('非法操作、当前充值套餐暂不存在！', HttpStatus.BAD_REQUEST);
      }
      const { model3Count, model4Count, drawMjCount, days, name: pkgName } = pkg;
      const money = {
        model3Count,
        model4Count,
        drawMjCount,
        days,
        packageId: order.goodsId,
      };
      /* 充值进账户 */
      await this.addBalanceToUser(userId, money, days);
      /* 记录充值日志 */
      await this.saveRecordRechargeLog({ userId, rechargeType: RechargeType.SCAN_PAY, model3Count, model4Count, drawMjCount, pkgName, days });
      const userInfo = await this.userEntity.findOne({ where: { id: userId } });
      const { invitedBy } = userInfo;
      /* 如果这个用户有邀请码则说名是 invitedBy 邀请的 */
      if (invitedBy) {
        const inviteUserInfo = await this.userEntity.findOne({ where: { inviteCode: invitedBy } });
        const inviteUserSalesInfo = await this.salesUsersEntity.findOne({ where: { userId: inviteUserInfo.id } });
        if (!inviteUserInfo) return;
        const { id: inviterUserId } = inviteUserInfo;
        const { performanceRatio } = inviteUserSalesInfo;
        /* 记录推介信息、 返佣记录 */
        const recordsInfo = {
          inviterUserId,
          inviteeUserId: userId,
          orderId: order.id,
          orderPrice: order.total,
          commissionPercentage: performanceRatio,
          commissionAmount: ((order.total * performanceRatio) / 100).toFixed(2),
        };
        /* 记录充值日志 */
        await this.salesService.createSalesRecords(recordsInfo);
        /* 存储本次佣金 */
        await this.salesService.saveCommissionAmount(inviterUserId, recordsInfo.commissionAmount);
      }
    } catch (error) {
      console.log('error: ', error);
      throw new HttpException('充值失败！', HttpStatus.BAD_REQUEST);
    }
  }

  /* 查询用户充值日志 */
  async getRechargeLog(req: Request, params) {
    const { page = 1, size = 20 } = params;
    const { id } = req.user;
    const [rows, count] = await this.accountLogEntity.findAndCount({
      where: { userId: id },
      order: { id: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });
    rows.forEach((item: any) => {
      item.expireDateCn = item.days > 0 ? `${item.days}天` : '永久';
    });
    return { rows: formatCreateOrUpdateDate(rows), count };
  }

  /* 管理端查询用户账户变更记录 */
  async getAccountLog(req, params) {
    try {
      const { page = 1, size = 10, userId, rechargeType, packageId } = params;
      const { role } = req.user;
      const where: any = {};
      rechargeType && (where.rechargeType = rechargeType);
      where.userId = userId || LessThan(100000);
      packageId && (where.packageId = { $like: `%${packageId}%` });
      const [rows, count] = await this.accountLogEntity.findAndCount({
        where,
        order: { id: 'DESC' },
        skip: (page - 1) * size,
        take: size,
      });
      const userIds = rows.map((item: any) => item.userId);
      const userInfo = await this.userEntity.find({ where: { id: In(userIds) } });
      rows.forEach((item: any) => {
        const user = userInfo.find((user: any) => user.id === item.userId);
        item.username = user?.username;
        item.email = user?.email;
        item.phone = user?.phone;
        item.status = user?.status;
        item.avatar = user?.avatar;
      });
      if (role !== 'super') {
        rows.forEach((item: any) => {
          item.email = item.email ? hideString(item.email) : '';
          item.phone = item.phone ? hideString(item.phone) : '';
        });
      }
      return { rows, count };
    } catch (error) {
      console.log('error: ', error);
      throw new HttpException('查询用户账户失败！', HttpStatus.BAD_REQUEST);
    }
  }

  /* 通过用户id批量查询用户 */
  async queryUserBalanceByIds(ids: number[]) {
    return await this.userBalanceEntity.find({ where: { userId: In(ids) } });
  }

  /* MJ绘画失败退款 */
  async refundMjBalance(userId, amount) {
    return await this.deductFromBalance(userId, 'mjDraw', -amount);
  }

  /* V1.5升级将旧版本余额并入到新表 */
  async upgradeBalance() {
    const users = await this.userEntity.find();
    if (!users.length) return;
    const upgradeStatus = await this.globalConfigService.getConfigs(['upgradeStatus']);
    if (!upgradeStatus) {
      await this.globalConfigService.setConfig({ settings: [{ configKey: 'upgradeStatus', configVal: '1' }] });
    } else {
      throw new HttpException('您已经升级过了、请勿重复操作！', HttpStatus.BAD_REQUEST);
    }
    users.forEach((user: any) => {
      const { id } = user;
      this.balanceEntity.findOne({ where: { userId: id } }).then((res) => {
        if (!res) return;
        this.writeOldBalanceToNewTable(id, res);
      });
    });
  }

  /* 将旧的数据整合写入新表 */
  async writeOldBalanceToNewTable(userId, balanceInfo) {
    const { balance = 0, usesLeft = 0, paintCount = 0, useTokens = 0, useChats = 0, usePaints = 0 } = balanceInfo;
    /* 查询Model4的使用情况 */
    const model4Info = await this.whiteListEntity.findOne({ where: { userId } });
    const newBalanceInfo = {
      userId,
      model3Count: Number(usesLeft),
      model4Count: model4Info?.count || 0,
      drawMjCount: Number(balance),
      useModel3Count: Number(useChats),
      useModel4Count: model4Info?.useCount || 0,
      useDrawMjCount: Number(usePaints),
      useModel3Token: Number(useTokens),
      useModel4Token: 0,
      useDrawMjToken: 0,
    };
    const userBalanceInfo = await this.userBalanceEntity.findOne({ where: { userId } });
    if (userBalanceInfo) {
      Logger.debug(`用户${userId}账户信息已经存在、迁移无效`, 'BalanceService');
    } else {
      this.userBalanceEntity
        .save(newBalanceInfo)
        .then((res) => {
          Logger.debug(`用户${userId}旧账户信息迁移成功`, 'BalanceService');
        })
        .catch((error) => {
          console.log('error: ', error);
          Logger.debug(`用户${userId}旧账户信息迁移失败`, 'BalanceService');
        });
    }
  }

  async inheritVisitorData(req: Request) {
    const { fingerprint } = req.headers;
    const { id: userId } = req.user;
    await this.chatLogEntity.update({ userId: Number(fingerprint) }, { userId });
    await this.chatGroupEntity.update({ userId: Number(fingerprint) }, { userId });
    await this.midjourneyEntity.update({ userId: Number(fingerprint) }, { userId });
    return 1;
  }

  async getVisitorCount(req) {
    const { fingerprint } = req.headers;
    const countChat = await this.chatLogEntity.count({ where: { userId: fingerprint } });
    const countChatGroup = await this.chatGroupEntity.count({ where: { userId: fingerprint } });
    const countMj = await this.midjourneyEntity.count({ where: { userId: fingerprint } });
    return countChat || countChatGroup || countMj || 0;
  }
}
