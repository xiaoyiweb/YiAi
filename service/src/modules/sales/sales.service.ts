import { GlobalConfigService } from '../globalConfig/globalConfig.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { SalesUsersEntity } from './salesUsers.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, Repository } from 'typeorm';
import { SalesRecordsEntity } from './salesRecords.entity';
import { formatCreateOrUpdateDate, hideString } from '@/common/utils';
import { RecordsQueryDto } from './dto/recordsQuery.dto';
import { UserEntity } from '../user/user.entity';
import Decimal from 'decimal.js';
import { AppForMoneyDto } from './dto/appForMoney.dto';
import { Request } from 'express';
import { SalesOrderEntity } from './salesOrder.entity';
import { drawMoneyOrderDto } from './dto/drawMoneyOrder.dto';
import { AuditOrderDto } from './dto/auditOrder.dto';
import { salesOrderDto } from './dto/salesOrder.dto';
import { SalesUserListDto } from './dto/salesUserList.dto';
import { UpdateUserSalesDto } from './dto/updateUserSales.dto';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(SalesUsersEntity)
    private readonly salesUsersEntity: Repository<SalesUsersEntity>,
    @InjectRepository(SalesRecordsEntity)
    private readonly salesRecordsEntity: Repository<SalesRecordsEntity>,
    @InjectRepository(UserEntity)
    private readonly userEntity: Repository<UserEntity>,
    @InjectRepository(SalesOrderEntity)
    private readonly salesOrderEntity: Repository<SalesOrderEntity>,
    private readonly globalConfigService: GlobalConfigService,
  ) {}

  /* 获取个人账户信息 */
  async getMineAccount(req) {
    try {
      const { id: userId } = req.user;
      let u = await this.salesUsersEntity.findOne({ where: { userId } });
      if (!u) {
        const { salesBaseRatio = 10, salesBaseTitle = '新秀分销商' } = await this.globalConfigService.getConfigs([
          'salesBaseRatio',
          'salesBaseTitle',
        ]);
        u = await this.creaetUserBaseSalesInfo({ userId, performanceRatio: Number(salesBaseRatio), salesOutletName: salesBaseTitle });
      }
      const account = formatCreateOrUpdateDate(u);
      const orderCount = await this.salesRecordsEntity.count({ where: { inviterUserId: userId } });
      const userInfo = (await this.userEntity.findOne({ where: { id: userId } })) || { inviteLinkCount: 0, inviteCode: 'xxxxxxx' };
      const { inviteLinkCount, inviteCode } = userInfo;
      const inviteCount = await this.userEntity.count({ where: { invitedBy: inviteCode } });
      return {
        ...account,
        orderCount,
        inviteCount,
        inviteLinkCount,
      };
    } catch (error) {
      console.log('error: ', error);
    }
  }

  /* 获取我得推介记录 */
  async getMineRecords(req, query: RecordsQueryDto) {
    try {
      const { id: inviterUserId } = req.user;
      const { page, size } = query;
      const [rows, count] = await this.salesRecordsEntity.findAndCount({
        where: { inviterUserId },
        order: { createdAt: 'DESC' },
        skip: (page - 1) * size,
        take: size,
      });
      return {
        rows: formatCreateOrUpdateDate(rows),
        count,
      };
    } catch (error) {
      console.log('error: ', error);
    }
  }

  /* 管理端获取推介记录 */
  async inviteRecords(req, query: RecordsQueryDto) {
    try {
      const { page, size, orderId, orderPrice } = query;
      let where = {};
      orderId && (where = { orderId });
      orderPrice && (where = { orderPrice });
      const [rows, count] = await this.salesRecordsEntity.findAndCount({
        where,
        order: { createdAt: 'DESC' },
        skip: (page - 1) * size,
        take: size,
      });
      const userIds = [];
      rows.map((item) => {
        userIds.push(item.inviterUserId);
        userIds.push(item.inviteeUserId);
      });
      const userInfo = await this.userEntity.find({ where: { id: In(userIds) } });
      rows.forEach((item: any) => {
        const inviterUser = userInfo.find((u) => u.id === item.inviterUserId);
        const inviteeUser = userInfo.find((u) => u.id === item.inviteeUserId);
        const { username, email, avatar } = userInfo.find((u) => u.id === item.inviterUserId);
        item.inviterUsername = inviterUser?.username;
        item.inviterEmail = inviterUser?.email;
        item.inviterAvatar = inviterUser?.avatar;
        item.inviteeUsername = inviteeUser?.username;
        item.inviteeEmail = inviteeUser?.email;
        item.inviteeAvatar = inviteeUser?.avatar;
      });
      if (req.user.role !== 'super') {
        rows.forEach((item: any) => {
          item.inviterEmail = item.inviterEmail ? hideString(item.inviterEmail) : '';
          item.inviteeEmail = item.inviteeEmail ? hideString(item.inviteeEmail) : '';
        });
      }
      return {
        rows: formatCreateOrUpdateDate(rows),
        count,
      };
    } catch (error) {
      console.log('error: ', error);
    }
  }

  /* 创建一个基础的邀人人账户 */
  async creaetUserBaseSalesInfo(salesInfo) {
    const { userId, performanceRatio, salesOutletName } = salesInfo;
    return await this.salesUsersEntity.save({ userId, performanceRatio, salesOutletName });
  }

  /* 变更账户信息 */
  async changeUserBaseSalesInfo(salesInfo) {
    return await this.salesUsersEntity.save(salesInfo);
  }

  /* 创建推介记录 */
  async createSalesRecords(salesRecords) {
    return await this.salesRecordsEntity.save(salesRecords);
  }

  /* 存储邀请人的佣金信息 总余额和充值余额同时增加 */
  async saveCommissionAmount(userId, amount) {
    const inviteUserInfo = await this.salesUsersEntity.findOne({ where: { userId } });
    if (!inviteUserInfo) return;
    const { totalAmount, distributionBalance } = inviteUserInfo;
    console.log('totalAmount, distributionBalance: ', totalAmount, distributionBalance);
    return await this.salesUsersEntity.update(
      { userId },
      {
        totalAmount: new Decimal(totalAmount).plus(amount).toNumber(),
        distributionBalance: new Decimal(distributionBalance).plus(amount).toNumber(),
      },
    );
  }

  /* 提交提现申请 */
  async appForMoney(req: Request, body: AppForMoneyDto) {
    const { id: userId } = req.user;
    const { withdrawalAmount, withdrawalChannels, contactInformation, remark } = body;
    const salesAllowDrawMoney = (await this.globalConfigService.getConfigs(['salesAllowDrawMoney'])) || 10;
    if (typeof withdrawalAmount !== 'number' || withdrawalAmount <= 0) {
      throw new HttpException('提现金额必须为数字且大于0', HttpStatus.BAD_REQUEST);
    }
    if (Number(withdrawalAmount) < Number(salesAllowDrawMoney)) {
      throw new HttpException(`提现金额最低必须为${salesAllowDrawMoney}元`, HttpStatus.BAD_REQUEST);
    }

    const salesBalanceInfo = await this.salesUsersEntity.findOne({ where: { userId } });
    const { distributionBalance, drawMoneyIn } = salesBalanceInfo;
    if (Number(distributionBalance) < Number(withdrawalAmount)) {
      throw new HttpException('提现金额不足', HttpStatus.BAD_REQUEST);
    }

    /* 扣完之后还剩多少 */
    const newDistributionBalance = new Decimal(distributionBalance).minus(withdrawalAmount).toNumber();

    /* 记录工单 */
    const orderInfo = { userId, withdrawalAmount, orderStatus: 0, auditStatus: 0, withdrawalChannels, contactInformation, remark };
    await this.createOrder(orderInfo);

    /* 修改账户信息 */
    const res = await this.salesUsersEntity.update(
      { userId },
      { distributionBalance: newDistributionBalance, drawMoneyIn: new Decimal(drawMoneyIn).plus(withdrawalAmount).toNumber() },
    );
  }

  /* 获取我的工单 */
  async drawMoneyOrder(req: Request, query: drawMoneyOrderDto) {
    const { id: userId } = req.user;
    const { page, size } = query;
    const [rows, count] = await this.salesOrderEntity.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });
    const auditUserIds = rows.map((item) => item.auditUserId);
    const userInfos = await this.userEntity.find({ where: { id: In(auditUserIds) } });
    rows.forEach((item: any) => {
      const curUserInfo = userInfos.find((user) => user.id === item.auditUserId);
      item.auditUserName = curUserInfo ? curUserInfo.username : '';
    });

    return {
      rows: formatCreateOrUpdateDate(rows),
      count,
    };
  }

  /* 管理员获取工单 */
  async salesOrder(req: Request, query: salesOrderDto) {
    const { page, size } = query;
    const where: any = {};
    query.orderStatus !== undefined && query.orderStatus !== '' && (where.orderStatus = query.orderStatus);
    query.withdrawalChannels && (where.withdrawalChannels = query.withdrawalChannels);
    const [rows, count] = await this.salesOrderEntity.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });
    const userIds = rows.map((item) => item.userId);
    const userInfo = await this.userEntity.find({ where: { id: In(userIds) } });
    rows.forEach((item: any) => {
      const curUser = userInfo.find((user) => user.id === item.userId);
      if (curUser) {
        const { username, email, avatar } = curUser;
        item.userInfo = { username, avatar, email: hideString(email) };
      }
    });
    return {
      rows: formatCreateOrUpdateDate(rows),
      count,
    };
  }

  /* 创建工单 */
  async createOrder(orderInfo) {
    try {
      return await this.salesOrderEntity.save(orderInfo);
    } catch (error) {
      console.log('error: ', error);
      throw new HttpException('创建提现工单失败', HttpStatus.BAD_REQUEST);
    }
  }

  /* 审核工单 */
  async auditOrder(req: Request, body: AuditOrderDto) {
    try {
      const { id: userId } = req.user;
      const { id, status } = body;
      if (![1, -1].includes(status)) {
        throw new HttpException('审核状态错误', HttpStatus.BAD_REQUEST);
      }
      const orderInfo = await this.salesOrderEntity.findOne({ where: { id } });
      if (orderInfo.orderStatus !== 0) {
        throw new HttpException('该工单已审核过', HttpStatus.BAD_REQUEST);
      }
      const userBalanceInfo = await this.salesUsersEntity.findOne({ where: { userId: orderInfo.userId } });
      const { withdrawalAmount, drawMoneyIn } = userBalanceInfo;
      /* 修改用户账户金额 本次提现金额+ 已经提现的金额 = 已提现金额  审核过不过都需要修改用户的 只是工单状态不同 */
      const newWithdrawalAmount = new Decimal(withdrawalAmount).plus(orderInfo.withdrawalAmount).toNumber(); // 已提现金额
      const newDrawMoneyIn = new Decimal(drawMoneyIn).minus(orderInfo.withdrawalAmount).toNumber(); // 提现中金额
      await this.salesUsersEntity.update({ userId: orderInfo.userId }, { withdrawalAmount: newWithdrawalAmount, drawMoneyIn: newDrawMoneyIn });
      /* 修改工单信息 */
      await this.salesOrderEntity.update({ id }, { orderStatus: status, auditStatus: status, auditUserId: userId, paymentStatus: status });
      return '审核完成';
    } catch (error) {
      console.log('error: ', error);
      throw new HttpException('审核失败', HttpStatus.BAD_REQUEST);
    }
  }

  /* 查询用户佣金账户 */
  async salesUserList(req: Request, query: SalesUserListDto) {
    const { page, size, salesOutletName, performanceRatio } = query;
    const where: any = {};
    salesOutletName && (where.salesOutletName = Like(`%${salesOutletName}%`));
    performanceRatio && (where.performanceRatio = performanceRatio);
    const [rows, count] = await this.salesUsersEntity.findAndCount({
      where,
      order: { id: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });
    const userIds = rows.map((item) => item.userId);
    const userInfos = await this.userEntity.find({ where: { id: In(userIds) } });
    rows.forEach((item: any) => {
      const curUserInfo = userInfos.find((user) => user.id === item.userId);
      item.userInfo = curUserInfo ? curUserInfo : {};
    });
    if (req.user.role !== 'super') {
      rows.forEach((item: any) => {
        item.userInfo.email = item.userInfo?.email ? hideString(item.userInfo?.email) : '';
      });
    }
    return { rows, count };
  }

  /* 修改用户佣金账户 */
  async updateUserSales(req, body: UpdateUserSalesDto) {
    const { performanceRatio, salesOutletName, userId } = body;
    const salesU = await this.salesUsersEntity.findOne({ where: { userId } });
    if (!salesU) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    }
    const res = await this.salesUsersEntity.update({ userId }, { performanceRatio, salesOutletName });
    if (res.affected > 0) {
      return '修改成功';
    } else {
      throw new HttpException('修改失败', HttpStatus.BAD_REQUEST);
    }
  }
}
