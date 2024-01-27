import { HttpException, HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { ModelsEntity } from './models.entity';
import { SetModelDto } from './dto/setModel.dto';
import { QueryModelDto } from './dto/queryModel.dto';
import { ModelsMapCn } from '@/common/constants/status.constant';
import { getAccessToken } from '../chatgpt/baidu';
import { getRandomItemFromArray, hideString } from '@/common/utils';
import { ModelsTypeEntity } from './modelType.entity';
import { SetModelTypeDto } from './dto/setModelType.dto';
import { QueryModelTypeDto } from './dto/queryModelType.dto';


@Injectable()
export class ModelsService {
  constructor(
    @InjectRepository(ModelsEntity)
    private readonly modelsEntity: Repository<ModelsEntity>,
    @InjectRepository(ModelsTypeEntity)
    private readonly modelsTypeEntity: Repository<ModelsTypeEntity>,
  ){}
  
  private modelTypes = []
  private modelMaps = {}
  private keyList = {}

  private keyPoolMap = {} // 记录每个模型的所有key 并且记录顺序
  private keyPoolIndexMap = {} // 记录每个模型的当前调用的下标

  async onModuleInit(){
    await this.initCalcKey()
    this.refreshBaiduAccesstoken()
  }

  /* 初始化整理所有key 进行分类并且默认一个初始模型配置 默认是配置的第一个分类的第一个key为准 */
  async initCalcKey(){
    this.keyPoolMap = {}
    this.keyPoolIndexMap = {}
    this.keyList = {}
    this.modelMaps = {}
    this.modelTypes = []
    const allKeys = await this.modelsEntity.find({where: { status: true }})
    const keyTypes = allKeys.reduce( (pre: any, cur ) => {
      if(!pre[cur.keyType]){
        pre[cur.keyType] = [cur]
      }else{
        pre[cur.keyType].push(cur)
      }
      return pre
    }, {})
    this.modelTypes = Object.keys(keyTypes).map( keyType => {
      return { label: ModelsMapCn[keyType] , val: keyType}
    })
    this.modelMaps = keyTypes
    this.keyList = {}
    allKeys.forEach( keyDetail => {
      const { keyType, model, keyWeight } = keyDetail
      if(!this.keyPoolMap[model]) this.keyPoolMap[model] = []
      for (let index = 0; index < keyWeight; index++) {
        this.keyPoolMap[model].push(keyDetail)
      }
      if(!this.keyPoolIndexMap[model]) this.keyPoolIndexMap[model] = 0
      if(!this.keyList[keyType]) this.keyList[keyType] = {}
      if(!this.keyList[keyType][model]) this.keyList[keyType][model] = []
      this.keyList[keyType][model].push(keyDetail)
    })
  }

  /* lock key 自动锁定key */
  async lockKey(keyId, remark, keyStatus = -1){
    const res = await this.modelsEntity.update({ id: keyId }, { status: false, keyStatus, remark });
    Logger.error(`key: ${keyId} 欠费或被官方封禁导致不可用，已被系统自动锁定`);
    this.initCalcKey()
  }

  /* 获取本次调用key的详细信息 */
  async getCurrentModelKeyInfo(model){
    if(!this.keyPoolMap[model]){
      throw new HttpException('当前调用模型已经被移除、请重新选择模型！', HttpStatus.BAD_REQUEST)
    }
    /* 调用下标+1 */
    this.keyPoolIndexMap[model]++
    /* 判断下标超出边界没有 */
    const index = this.keyPoolIndexMap[model]
    if(index >= this.keyPoolMap[model].length) this.keyPoolIndexMap[model] = 0
    const key =  this.keyPoolMap[model][this.keyPoolIndexMap[model]]
    return key
  }

  /* 通过现有配置的key和分类给到默认的配置信息 默认给到第一个分类的第一个key的配置 */
  async getBaseConfig(appId?: number): Promise<any>{
    if(!this.modelTypes.length || !Object.keys(this.modelMaps).length) return;
    /* 有appid只可以使用openai 的 模型 */
    const modelTypeInfo = appId ? this.modelTypes.find( item => Number(item.val) === 1) : this.modelTypes[0]
    // TODO 第0个会有问题  先添加的4默认就是模型4了  后面优化下
    if(!modelTypeInfo) return;
    const { keyType, modelName, model, maxModelTokens, maxResponseTokens, deductType, deduct, maxRounds } = this.modelMaps[modelTypeInfo.val][0] // 取到第一个默认的配置项信息
    return {
      modelTypeInfo,
      modelInfo: { keyType, modelName, model, maxModelTokens, maxResponseTokens, topN: 0.8, systemMessage: '',  deductType, deduct, maxRounds, rounds: 8 }
    }
  }

  async setModel(params: SetModelDto){
   try {
    const { id } = params
    params.status && (params.keyStatus  = 1)
    if(id){
      const res = await this.modelsEntity.update({id}, params)
      await this.initCalcKey()
      return res.affected > 0
    }else{
      const { keyType, key } = params
      if(Number(keyType !== 1)){
        const res = await this.modelsEntity.save(params)
        await this.initCalcKey()
        if(keyType === 2){ //百度的需要刷新token
          this.refreshBaiduAccesstoken()
        }
        return res 
      }else{
        const data = key.map( k => {
          try {
            const data = JSON.parse(JSON.stringify(params))
            data.key = k
            return data
          } catch (error) {
            console.log('parse error: ', error);
          }
        })
        const res = await this.modelsEntity.save(data)
        await this.initCalcKey()
        return res
      }
    }
   } catch (error) {
    console.log('error: ', error);
   }
  }

  async delModel({id}){
    if(!id) {
      throw new HttpException('缺失必要参数！', HttpStatus.BAD_REQUEST)
    }
    const m = await this.modelsEntity.findOne({where: {id}})
    if(!m){
      throw new HttpException('当前账号不存在！', HttpStatus.BAD_REQUEST)
    }
    const res = await this.modelsEntity.delete({id})
    await this.initCalcKey()
    return res;
  }

  async queryModels(req, params: QueryModelDto){
    const { role } = req.user
    const { keyType, key, status, model, page = 1, size = 10 } = params
    let where: any = {}
    keyType && (where.keyType = keyType)
    model && (where.model = model)
    status && (where.status = Number(status) === 1 ? true : false)
    key && ( where.key = Like(`%${key}%`))
    const [rows, count] = await this.modelsEntity.findAndCount({
       where: where,
       skip: (page - 1) * size,
       take: size, 
    })
    if(role !== 'super'){
      rows.forEach( item => {
        item.key && (item.key = hideString(item.key))
        item.secret && (item.secret = hideString(item.secret))
      })
    }

    return { rows, count }
  }

  /* 客户端查询到的所有的配置的模型类别 以及类别下自定义的多少中文模型名称 */
  async modelsList(){
    const cloneModelMaps = JSON.parse(JSON.stringify(this.modelMaps))
    Object.keys(cloneModelMaps).forEach( key => {
      cloneModelMaps[key] = Array.from(
        cloneModelMaps[key].map( t => {
          const { modelName, model, deduct, deductType, maxRounds } = t
          return { modelName, model, deduct, deductType, maxRounds }
        }).reduce((map, obj) => map.set(obj.modelName, obj), new Map()).values()
      );
    })
    return {
      modelTypeList: this.modelTypes,
      modelMaps: cloneModelMaps
    }
  }

  /* 记录使用次数和使用的token数量 */
  async saveUseLog(id, useToken){
    await this.modelsEntity
      .createQueryBuilder()
      .update(ModelsEntity)
      .set({ useCount: () => 'useCount + 1', useToken: () => `useToken + ${useToken}` })
      .where('id = :id', { id })
      .execute();
  }

  async refreshBaiduAccesstoken(){
    const allKeys = await this.modelsEntity.find({ where: { keyType: 2 } })
    const keysMap: any = {}
    allKeys.forEach( keyInfo => {
      const { key, secret } = keyInfo
      if(!keysMap.key){
        keysMap[key] = [{ keyInfo }]
      }else{
        keysMap[key].push(keyInfo)
      }
    })
    Object.keys(keysMap).forEach( async key => {
      const {secret, id } = keysMap[key][0]['keyInfo']
      const accessToken: any = await getAccessToken(key, secret)
      await this.modelsEntity.update({ key }, { accessToken })
    })

    setTimeout(() => {
      this.initCalcKey()
    }, 1000)
  }

  /* 获取一张绘画key */
  async getRandomDrawKey(){
    const drawkeys = await this.modelsEntity.find({where: { isDraw: true, status: true }})
    if(!drawkeys.length){
      throw new HttpException('当前未指定特殊模型KEY、前往后台模型池设置吧！', HttpStatus.BAD_REQUEST)
    }
    return getRandomItemFromArray(drawkeys)
  }

  /* 获取所有key */
  async getAllKey(){
    return await this.modelsEntity.find()
  }

  /* 查询模型类型 */
  async queryModelType(params: QueryModelTypeDto){
    return 1
  }

  /* 创建修改模型类型 */
  async setModelType(params: SetModelTypeDto){
    return 1
  }

  /* 删除模型类型 */
  async delModelType(params){
    return 1
  }

}
