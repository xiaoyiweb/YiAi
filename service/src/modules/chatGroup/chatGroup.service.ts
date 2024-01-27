import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateGroupDto } from './dto/createGroup.dto';
import { Request } from 'express';
import { DelGroupDto } from './dto/delGroup.dto';
import { ChatGroupEntity } from './chatGroup.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UpdateGroupDto } from './dto/updateGroup.dto';
import { AppEntity } from '../app/app.entity';
import { ModelsService } from '../models/models.service'

@Injectable()
export class ChatGroupService {
  constructor(
    @InjectRepository(ChatGroupEntity)
    private readonly chatGroupEntity: Repository<ChatGroupEntity>,
    @InjectRepository(AppEntity)
    private readonly appEntity: Repository<AppEntity>,
    private readonly modelsService: ModelsService
  ) {}

  async create(body: CreateGroupDto, req: Request) {
    const { id } = req.user;
    const { appId } = body;
    const params = { title: '新对话', userId: id };
    if (appId) {
      const appInfo = await this.appEntity.findOne({ where: { id: appId } });
      if (!appInfo) {
        throw new HttpException('非法操作、您在使用一个不存在的应用！', HttpStatus.BAD_REQUEST);
      } else {
        const { status, name } = appInfo;
        const g = await this.chatGroupEntity.count({ where: { userId: id, appId, isDelete: false } });
        if (g > 0) {
          throw new HttpException('当前应用已经开启了一个对话无需新建了！', HttpStatus.BAD_REQUEST);
        }
        if (![1, 3, 4, 5].includes(status)) {
          throw new HttpException('非法操作、您在使用一个未启用的应用！', HttpStatus.BAD_REQUEST);
        }
        name && (params['title'] = name);
        appId && (params['appId'] = appId);
      }
    }
    const modelConfig: any = await this.modelsService.getBaseConfig(appId)
    appId && (modelConfig.appId = appId)
    if(!modelConfig){
      throw new HttpException('管理员未配置任何AI模型、请先联系管理员开通聊天模型配置！', HttpStatus.BAD_REQUEST)
    }
    return await this.chatGroupEntity.save({...params, config: JSON.stringify(modelConfig)});
  }

  async query(req: Request) {
    try {
      const { id } = req.user;
      const params = { userId: id, isDelete: false };
      const res = await this.chatGroupEntity.find({ where: params, order: { isSticky: 'DESC', id: 'DESC' } });
      const appIds = res.filter( t => t.appId).map( t => t.appId)
      const appInfos = await this.appEntity.find({where: { id: In(appIds)}})
      return res.map( (item: any) => {
        item.appLogo = appInfos.find( t => t.id === item.appId)?.coverImg
        return item
      })
    } catch (error) {
      console.log('error: ', error);
      
    }
  }

  async update(body: UpdateGroupDto, req: Request) {
    const { title, isSticky, groupId, config } = body;
    const { id } = req.user;
    const g = await this.chatGroupEntity.findOne({ where: { id: groupId, userId: id } });
    if (!g) {
      throw new HttpException('请先选择一个对话或者新加一个对话再操作！', HttpStatus.BAD_REQUEST);
    }
    const { appId } = g;
    if (appId && !title) {
      try {
        const parseData = JSON.parse(config)
        if(Number(parseData.keyType) !== 1){
          throw new HttpException('应用对话名称不能修改哟！', HttpStatus.BAD_REQUEST);
        }
      } catch (error) {
        // ignore
      }
    }
    const data = {};
    title && (data['title'] = title);
    typeof isSticky !== 'undefined' && (data['isSticky'] = isSticky);
    config && (data['config'] = config)
    const u = await this.chatGroupEntity.update({ id: groupId }, data);
    if (u.affected) {
      return true;
    } else {
      throw new HttpException('更新对话失败！', HttpStatus.BAD_REQUEST);
    }
  }

  async del(body: DelGroupDto, req: Request) {
    const { groupId } = body;
    const { id } = req.user;
    const g = await this.chatGroupEntity.findOne({ where: { id: groupId, userId: id } });
    if (!g) {
      throw new HttpException('非法操作、您在删除一个非法资源！', HttpStatus.BAD_REQUEST);
    }
    const r = await this.chatGroupEntity.update({ id: groupId }, { isDelete: true });
    if (r.affected) {
      return '删除成功';
    } else {
      throw new HttpException('删除失败！', HttpStatus.BAD_REQUEST);
    }
  }

  /* 删除非置顶开启的所有对话记录 */
  async delAll(req: Request) {
    const { id } = req.user;
    const r = await this.chatGroupEntity.update({ userId: id, isSticky: false, isDelete: false }, { isDelete: true });
    if (r.affected) {
      return '删除成功';
    } else {
      throw new HttpException('删除失败！', HttpStatus.BAD_REQUEST);
    }
  }

  /* 通过groupId查询当前对话组的详细信息 */
  async getGroupInfoFromId(id){
    if(!id) return;
    return await this.chatGroupEntity.findOne({where: {id}})
  }
}
