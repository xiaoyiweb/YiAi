import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../user/user.entity';
import { In, Repository } from 'typeorm';
import { ChatLogEntity } from '../chatLog/chatLog.entity';
import { DeductionKey } from '@/common/constants/balance.constant';
import { formatDate } from '@/common/utils/date';
import axios from 'axios';
import { ConfigEntity } from '../globalConfig/config.entity';
import { OrderEntity } from '../order/order.entity';
import { MidjourneyEntity } from '../midjourney/midjourney.entity';
import { MidjourneyActionEnum, MidjourneyStatusEnum } from '@/common/constants/midjourney.constant';

@Injectable()
export class StatisticService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userEntity: Repository<UserEntity>,
    @InjectRepository(ChatLogEntity)
    private readonly chatLogEntity: Repository<ChatLogEntity>,
    @InjectRepository(ConfigEntity)
    private readonly configEntity: Repository<ConfigEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderEntity: Repository<OrderEntity>,
    @InjectRepository(MidjourneyEntity)
    private readonly midjourneyEntity: Repository<MidjourneyEntity>,
  ) {}

  /* 基础数据统计 */
  async getBaseStatistic() {
    const userCount = await this.countUsers();
    const newUserCount = await this.countNewUsersToday();
    const chatCount = await this.countChats();
    const newChatCount = await this.countNewChatsToday();
    const drawCount = await this.countDraws();
    const dellDrawCount = await this.countNewDrawsToday();
    const mjDrawCount = await this.countNewMidhourneysToday();
    const orderCount = await this.countOrders();
    const newOrderCount = await this.countNewOrdersToday();
    return {
      userCount,
      newUserCount,
      chatCount,
      newChatCount,
      drawCount,
      newDrawCount: mjDrawCount + dellDrawCount,
      orderCount,
      newOrderCount,
    };
  }

  /* 聊天记录统计 */
  async getChatStatistic({ days = 7 }) {
    const chatData = await this.countChatsByTimeRange(days);
    const drawData = await this.countDrawsByTimeRange(days);
    const mjDrawData: any = await this.countMjDrawsByTimeRange(days);
    return {
      date: chatData.map((item) => item.date),
      chat: chatData.map((item: any) => item.value),
      draw: drawData.map((item: any, index) => {
        return item.value + mjDrawData[index].value;
      }),
    };
  }

  /* 查询百度统计数据 */
  async getBaiduVisit({ days = 7 }) {
    const data = await this.getBaiduStatistics(days);
    return data;
  }

  /* 查询用户总数 */
  async countUsers(): Promise<number> {
    const userCount = await this.userEntity.count();
    return userCount;
  }

  /* 当天新增用户 */
  async countNewUsersToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const queryBuilder = this.userEntity.createQueryBuilder('user');
    const userCount = await queryBuilder.where('user.createdAt >= :today', { today }).andWhere('user.createdAt < :tomorrow', { tomorrow }).getCount();
    return userCount;
  }

  /* 聊天次数总数 */
  async countChats(): Promise<number> {
    const chatCount = await this.chatLogEntity.count({ where: { type: DeductionKey.CHAT_TYPE } });
    return chatCount;
  }

  /* 当日聊天新增次数 */
  async countNewChatsToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const queryBuilder = this.chatLogEntity.createQueryBuilder('chatLog');
    const chatCount = await queryBuilder
      .where('chatLog.type = :type', { type: DeductionKey.CHAT_TYPE })
      .andWhere('chatLog.createdAt >= :today', { today })
      .andWhere('chatLog.createdAt < :tomorrow', { tomorrow })
      .getCount();
    return chatCount;
  }

  /* 绘画次数总数 */
  async countDraws(): Promise<number> {
    const drawCount = await this.chatLogEntity.count({ where: { type: DeductionKey.PAINT_TYPE } });
    return drawCount;
  }

  /* 当日新增绘画次数 */
  async countNewDrawsToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const queryBuilder = this.chatLogEntity.createQueryBuilder('chatLog');
    const drawCount = await queryBuilder
      .where('chatLog.type = :type', { type: DeductionKey.PAINT_TYPE })
      .andWhere('chatLog.createdAt >= :today', { today })
      .andWhere('chatLog.createdAt < :tomorrow', { tomorrow })
      .getCount();
    return drawCount;
  }

  /* 统计midjourney表今日新增数量 */
  async countNewMidhourneysToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const queryBuilder = this.midjourneyEntity.createQueryBuilder('midjourney');
    const midjourneyCount = await queryBuilder
      .where('midjourney.createdAt >= :today', { today })
      .andWhere('midjourney.createdAt < :tomorrow', { tomorrow })
      .getCount();
    return midjourneyCount;
  }

  /* 统计一段时间内的聊天数据 */
  async countChatsByTimeRange(days: number): Promise<{ date: string; count: number }[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    const queryBuilder = this.chatLogEntity.createQueryBuilder('chatlog');
    const result = await queryBuilder
      .select(`DATE(chatlog.createdAt) as date, COUNT(*) as count`)
      .where(`chatlog.type = :type`, { type: DeductionKey.CHAT_TYPE })
      .andWhere('chatlog.createdAt >= :startDate', { startDate })
      .groupBy('date')
      .orderBy('date')
      .getRawMany<{ date: string; count: number }>();
    const dailyData = [];
    const currentDate = startDate;
    for (let i = 0; i < days; i++) {
      const dateString = formatDate(new Date(currentDate), 'M.DD');
      const count = result.find((r: any) => formatDate(new Date(r.date), 'M.DD') === dateString)?.count ?? 0;
      if (count > 0) {
        dailyData.push({ date: dateString, value: Number(count) });
      } else {
        dailyData.push({ date: dateString, value: 0 });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dailyData;
  }

  /* 统计一段时间内的绘画次数 */
  async countDrawsByTimeRange(days: number): Promise<{ date: string; count: number }[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    const queryBuilder = this.chatLogEntity.createQueryBuilder('chatlog');
    const result = await queryBuilder
      .select(`DATE(chatlog.createdAt) as date, COUNT(*) as count`)
      .where(`chatlog.type = :type`, { type: DeductionKey.PAINT_TYPE })
      .andWhere('chatlog.createdAt >= :startDate', { startDate })
      .groupBy('date')
      .orderBy('date')
      .getRawMany<{ date: string; count: number }>();
    const dailyData = [];
    const currentDate = startDate;
    for (let i = 0; i < days; i++) {
      const dateString = formatDate(new Date(currentDate), 'M.DD');
      const count = result.find((r: any) => formatDate(new Date(r.date), 'M.DD') === dateString)?.count ?? 0;
      if (count > 0) {
        dailyData.push({ date: dateString, value: Number(count) });
      } else {
        dailyData.push({ date: dateString, value: 0 });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dailyData;
  }

  /* 统计一段时间内的mj的绘画次数 */
  async countMjDrawsByTimeRange(days: number): Promise<{ date: string; count: number }[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    const queryBuilder = this.midjourneyEntity.createQueryBuilder('midjourney');
    const result = await queryBuilder
      .select(`DATE(midjourney.createdAt) as date, COUNT(*) as count`)
      .where(`midjourney.status = :status`, { status: MidjourneyStatusEnum.DRAWED })
      .andWhere('midjourney.createdAt >= :startDate', { startDate })
      .groupBy('date')
      .orderBy('date')
      .getRawMany<{ date: string; count: number }>();
    const dailyData = [];
    const currentDate = startDate;
    for (let i = 0; i < days; i++) {
      const dateString = formatDate(new Date(currentDate), 'M.DD');
      const count = result.find((r: any) => formatDate(new Date(r.date), 'M.DD') === dateString)?.count ?? 0;
      if (count > 0) {
        dailyData.push({ date: dateString, value: Number(count) });
      } else {
        dailyData.push({ date: dateString, value: 0 });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dailyData;
  }

  /* 获取百度统计数据 */
  async getBaiduStatistics(days): Promise<{ date: string; count: number }[]> {
    const end_date = formatDate(new Date(), 'YYYYMMDD');
    const start_date = formatDate(new Date(Date.now() - Number(days - 1) * 24 * 60 * 60 * 1000), 'YYYYMMDD');
    const metrics = 'pv_count,visitor_count,ip_count,bounce_ratio,avg_visit_time';
    const method = 'overview/getTimeTrendRpt';
    const configInfo = await this.configEntity.find({ where: { configKey: In(['baiduToken', 'baiduSiteId']) } });
    const siteId = configInfo.find((c) => c.configKey === 'baiduSiteId')?.configVal;
    const accessToken = configInfo.find((c) => c.configKey === 'baiduToken')?.configVal;
    if (!siteId || !accessToken) {
      return [];
    }
    if (!siteId) {
      throw new HttpException('请先配置百度统计siteId', HttpStatus.BAD_REQUEST);
    }
    if (!accessToken) {
      throw new HttpException('请先配置百度统计accessToken', HttpStatus.BAD_REQUEST);
    }
    const url = `https://openapi.baidu.com/rest/2.0/tongji/report/getData?access_token=${accessToken}&site_id=${siteId}&method=${method}&start_date=${start_date}&end_date=${end_date}&metrics=${metrics}`;
    const res = await axios.get(url);
    const { error_code, message } = res.data;
    if (error_code === 111) {
      /* 自动刷新 */
      throw new HttpException(message || '百度授权码过期', HttpStatus.BAD_REQUEST);
    }
    /* 其他错误 */
    if (error_code && error_code !== 200) {
      throw new HttpException(message || '获取百度统计数据失败', HttpStatus.BAD_REQUEST);
    }
    /* 格式化数据 */
    return res.data.result;
  }

  /* 订单总次数  */
  async countOrders(): Promise<number> {
    const orderCount = await this.orderEntity.count();
    return orderCount;
  }

  /* 今日新增订单 */
  async countNewOrdersToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const queryBuilder = this.orderEntity.createQueryBuilder('order');
    const orderCount = await queryBuilder
      .where('order.createdAt >= :today', { today })
      .andWhere('order.createdAt < :tomorrow', { tomorrow })
      .getCount();
    return orderCount;
  }
}
