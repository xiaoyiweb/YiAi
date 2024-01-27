import { ExportExcelChatlogDto } from './dto/exportExcelChatlog.dto';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatLogEntity } from './chatLog.entity';
import { In, Like, Not, Repository } from 'typeorm';
import { Request, Response } from 'express';
import { DeductionKey } from '@/common/constants/balance.constant';
import { QuerAllDrawLogDto } from './dto/queryAllDrawLog.dto';
import { QuerAllChatLogDto } from './dto/queryAllChatLog.dto';
import { recDrawImgDto } from './dto/recDrawImg.dto';
import { UserEntity } from '../user/user.entity';
import { formatDate, maskEmail, utcToShanghaiTime } from '@/common/utils';
import { QuerMyChatLogDto } from './dto/queryMyChatLog.dto';
import  excel from 'exceljs';
import { ChatListDto } from './dto/chatList.dto';
import { ChatGroupEntity } from '../chatGroup/chatGroup.entity';
import { DelDto } from './dto/del.dto';
import { DelByGroupDto } from './dto/delByGroup.dto';
import { QueryByAppIdDto } from './dto/queryByAppId.dto';

@Injectable()
export class ChatLogService {
  constructor(
    @InjectRepository(ChatLogEntity)
    private readonly chatLogEntity: Repository<ChatLogEntity>,
    @InjectRepository(UserEntity)
    private readonly userEntity: Repository<UserEntity>,
    @InjectRepository(ChatGroupEntity)
    private readonly chatGroupEntity: Repository<ChatGroupEntity>,
  ) {}

  /* 记录问答日志 */
  async saveChatLog(logInfo) {
    return await this.chatLogEntity.save(logInfo);
  }

  /* 查询我的绘制记录 */
  async querDrawLog(req: Request, query: QuerMyChatLogDto) {
    const { id } = req.user;
    const { model } = query;
    const where: any = { userId: id, type: DeductionKey.PAINT_TYPE };
    if(model){
      where.model = model
      if(model === 'DALL-E2'){
        where.model = In(['DALL-E2', 'dall-e-3']) 
      }
    }
    const data = await this.chatLogEntity.find({
      where,
      order: { id: 'DESC' },
      select: ['id', 'answer', 'prompt', 'message_id', 'group', 'model', 'extend', 'type', 'fileInfo'],
    });
    data.forEach((r: any) => {
      if (r.type === 'paintCount') {
        const w = r.model === 'mj' ? 310 : 160;
        const imgType = r.answer.includes('cos') ? 'tencent' : 'ali';
        const compress = imgType === 'tencent' ? `?imageView2/1/w/${w}/q/55` : `?x-oss-process=image/resize,w_${w}`;
        r.thumbImg = r.answer + compress;
        try {
          r.fileInfo = r.fileInfo ? JSON.parse(r.fileInfo) : null
        } catch (error) {
          r.fileInfo = {}
        }
      }
    });
    return data;
  }

  /* 查询所有绘制记录 */
  async querAllDrawLog(params: QuerAllDrawLogDto) {
    const { page = 1, size = 20, rec, userId, model } = params;
    const where: any = { type: DeductionKey.PAINT_TYPE, prompt: Not(''), answer: Not('') };
    rec && Object.assign(where, { rec });
    userId && Object.assign(where, { userId });
    if(model){
      where.model = model
      if(model === 'DALL-E2'){
        where.model = In(['DALL-E2', 'dall-e-3']) 
      }
    }
    const [rows, count] = await this.chatLogEntity.findAndCount({
      order: { id: 'DESC' },
      skip: (page - 1) * size,
      take: size,
      where,
    });
    rows.forEach((r: any) => {
      if (r.type === 'paintCount') {
        const w = r.model === 'mj' ? 310 : 160; // mj压缩到310  dall-e压缩到160 宽度
        /* 需要区分图片是阿里云oss还是腾讯云cos  压缩方式不同  */
        const imgType = r.answer.includes('cos') ? 'tencent' : 'ali';
        const compress = imgType === 'tencent' ? `?imageView2/1/w/${w}/q/55` : `?x-oss-process=image/resize,w_${w}`;
        r.thumbImg = r.answer + compress;
        try {
          const detailInfo = r.extend ? JSON.parse(r.extend) : null;
          if (detailInfo) {
            if (detailInfo) {
              r.isGroup = detailInfo?.components[0]?.components.length === 5;
            } else {
              r.isGroup = false;
            }
          }
        } catch (error) {
          console.log('querAllDrawLog Json parse error', error)
        }
      }
    });
    return { rows, count };
  }

  /* 推荐图片到对外展示 */
  async recDrawImg(body: recDrawImgDto) {
    const { id } = body;
    const l = await this.chatLogEntity.findOne({ where: { id, type: DeductionKey.PAINT_TYPE } });
    if (!l) {
      throw new HttpException('你推荐的图片不存在、请检查！', HttpStatus.BAD_REQUEST);
    }
    const rec = l.rec === 1 ? 0 : 1;
    const res = await this.chatLogEntity.update({ id }, { rec });
    if (res.affected > 0) {
      return `${rec ? '推荐' : '取消推荐'}图片成功！`;
    }
    throw new HttpException('你操作的图片不存在、请检查！', HttpStatus.BAD_REQUEST);
  }

  /* 导出为excel对话记录 */
  async exportExcel(body: ExportExcelChatlogDto, res: Response) {
    const where = { type: DeductionKey.CHAT_TYPE };
    const { page = 1, size = 30, prompt, email } = body;
    prompt && Object.assign(where, { prompt: Like(`%${prompt}%`) });
    if (email) {
      const user = await this.userEntity.findOne({ where: { email } });
      user?.id && Object.assign(where, { userId: user.id });
    }
    const [rows, count] = await this.chatLogEntity.findAndCount({
      order: { id: 'DESC' },
      skip: (page - 1) * size,
      take: size,
      where,
    });

    const userIds = rows.map((r) => r.userId);
    const userInfos = await this.userEntity.find({ where: { id: In(userIds) } });
    const data = rows.map((r) => {
      const userInfo = userInfos.find((u) => u.id === r.userId);
      return {
        username: userInfo ? userInfo.username : '',
        email: userInfo ? userInfo.email : '',
        prompt: r.prompt,
        answer: r.answer,
        createdAt: formatDate(r.createdAt),
      };
    });

    const workbook = new excel.Workbook();

    const worksheet = workbook.addWorksheet('chatlog');

    worksheet.columns = [
      { header: '用户名', key: 'username', width: 20 },
      { header: '用户邮箱', key: 'email', width: 20 },
      { header: '提问时间', key: 'createdAt', width: 20 },
      { header: '提问问题', key: 'prompt', width: 80 },
      { header: '回答答案', key: 'answer', width: 150 },
    ];

    data.forEach((row) => worksheet.addRow(row));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=' + 'chat.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  }

  /* 查询所有对话记录 */
  async querAllChatLog(params: QuerAllChatLogDto, req: Request) {
    const { page = 1, size = 20, userId, prompt } = params;
    const where = { type: DeductionKey.CHAT_TYPE, prompt: Not('') };
    userId && Object.assign(where, { userId });
    prompt && Object.assign(where, { prompt: Like(`%${prompt}%`) });
    const [rows, count] = await this.chatLogEntity.findAndCount({
      order: { id: 'DESC' },
      skip: (page - 1) * size,
      take: size,
      where,
    });
    const userIds = rows.map((item) => item.userId);
    const userInfo = await this.userEntity.find({ where: { id: In(userIds) }, select: ['id', 'username', 'email'] });
    rows.forEach((item: any) => {
      const { username, email } = userInfo.find((u) => u.id === item.userId) || {};
      item.username = username;
      item.email = email;
    });
    req.user.role !== 'super' && rows.forEach((t: any) => (t.email = maskEmail(t.email)));
    rows.forEach((item: any) => {
      !item.email && (item.email = `${item?.userId}@nine.com`)
      !item.username && (item.username = `游客${item?.userId}`);
    })
    return { rows, count };
  }

  /* 查询当前对话的列表 */
  async chatList(req: Request, params: ChatListDto) {
    const { id } = req.user;
    const { groupId } = params;
    const where = { userId: id, isDelete: false };
    groupId && Object.assign(where, { groupId });
    if (groupId) {
      const count = await this.chatGroupEntity.count({ where: { isDelete: false } });
      if (count === 0) return [];
    }
    const list = await this.chatLogEntity.find({ where });
    return list.map((item) => {
      const { prompt, role, answer, createdAt, model, conversationOptions, requestOptions, id } = item;
      let parseConversationOptions: any = null
      let parseRequestOptions: any = null
      try {
        parseConversationOptions = JSON.parse(conversationOptions)
        parseRequestOptions = JSON.parse(requestOptions)
      } catch (error) {
        
      }
      return {
        chatId: id,
        dateTime: formatDate(createdAt),
        text: role === 'user' ? prompt : answer,
        inversion: role === 'user',
        error: false,
        conversationOptions: parseConversationOptions,
        requestOptions: parseRequestOptions,
      };
    });
  }

  /* 删除单条对话记录 */
  async deleteChatLog(req: Request, body: DelDto) {
    const { id: userId } = req.user;
    const { id } = body;
    const c = await this.chatLogEntity.findOne({ where: { id, userId } });
    if (!c) {
      throw new HttpException('你删除的对话记录不存在、请检查！', HttpStatus.BAD_REQUEST);
    }
    const r = await this.chatLogEntity.update({ id }, { isDelete: true });
    if (r.affected > 0) {
      return '删除对话记录成功！';
    } else {
      throw new HttpException('你删除的对话记录不存在、请检查！', HttpStatus.BAD_REQUEST);
    }
  }

  /* 清空一组对话记录 */
  async delByGroupId(req: Request, body: DelByGroupDto) {
    const { groupId } = body;
    const { id } = req.user;
    const g = await this.chatGroupEntity.findOne({ where: { id: groupId, userId: id } });

    if (!g) {
      throw new HttpException('你删除的对话记录不存在、请检查！', HttpStatus.BAD_REQUEST);
    }

    const r = await this.chatLogEntity.update({ groupId }, { isDelete: true });

    if (r.affected > 0) {
      return '删除对话记录成功！';
    }

    if (r.affected === 0) {
      throw new HttpException('当前页面已经没有东西可以删除了！', HttpStatus.BAD_REQUEST);
    }
  }

  /* 查询单个应用的使用记录 */
  async byAppId(req: Request, body: QueryByAppIdDto) {
    const { id } = req.user;
    const { appId, page = 1, size = 10 } = body;
    const [rows, count] = await this.chatLogEntity.findAndCount({
      where: { userId: id, appId, role: 'assistant' },
      order: { id: 'DESC' },
      take: size,
      skip: (page - 1) * size,
    });
    return { rows, count };
  }
}
