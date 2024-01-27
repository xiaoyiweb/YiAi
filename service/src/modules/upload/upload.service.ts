import { HttpException, HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as TENCENTCOS from 'cos-nodejs-sdk-v5';
import * as ALIOSS from 'ali-oss';
import cosConfig from '@/config/cos';
import axios from 'axios';
import * as streamToBuffer from 'stream-to-buffer';
import { createRandomUid, removeSpecialCharacters } from '@/common/utils';
import { GlobalConfigService } from '../globalConfig/globalConfig.service';
import * as FormData from 'form-data';

@Injectable()
export class UploadService implements OnModuleInit {
  constructor(private readonly globalConfigService: GlobalConfigService) {}
  private tencentCos: any;

  onModuleInit() {}

  async uploadFile(file) {
    const { filename: name, originalname, buffer, dir = 'ai', mimetype } = file;
    const fileTyle = mimetype ? mimetype.split('/')[1] : '';
    const filename = originalname || name
    const {
      tencentCosStatus = 0,
      aliOssStatus = 0,
      cheveretoStatus = 0,
    } = await this.globalConfigService.getConfigs(['tencentCosStatus', 'aliOssStatus', 'cheveretoStatus']);

    if (!Number(tencentCosStatus) && !Number(aliOssStatus) && !Number(cheveretoStatus)) {
      throw new HttpException('请先前往后台配置上传图片的方式', HttpStatus.BAD_REQUEST);
    }
    if (Number(tencentCosStatus)) {
      return this.uploadFileByTencentCos({ filename, buffer, dir, fileTyle });
    }
    if (Number(aliOssStatus)) {
      return await this.uploadFileByAliOss({ filename, buffer, dir, fileTyle });
    }
    if (Number(cheveretoStatus)) {
      const { filename, buffer: fromBuffer, dir } = file;
      return await this.uploadFileByChevereto({ filename, buffer: fromBuffer.toString('base64'), dir, fileTyle });
    }
  }

  async getUploadType() {
    const {
      tencentCosStatus = 0,
      aliOssStatus = 0,
      cheveretoStatus = 0,
    } = await this.globalConfigService.getConfigs(['tencentCosStatus', 'aliOssStatus', 'cheveretoStatus']);
    if (Number(tencentCosStatus)) {
      return 'tencent';
    }
    if (Number(aliOssStatus)) {
      return 'ali';
    }
    if (Number(cheveretoStatus)) {
      return 'chevereto';
    }
  }

  async uploadFileFromUrl({ filename, url, dir = 'mj' }) {
    dir = process.env.ISDEV ? 'mjdev' : dir;
    const {
      tencentCosStatus = 0,
      aliOssStatus = 0,
      cheveretoStatus = 0,
    } = await this.globalConfigService.getConfigs(['tencentCosStatus', 'aliOssStatus', 'cheveretoStatus']);

    if (!Number(tencentCosStatus) && !Number(aliOssStatus) && !Number(cheveretoStatus)) {
      throw new HttpException('请先前往后台配置上传图片的方式', HttpStatus.BAD_REQUEST);
    }
    if (Number(tencentCosStatus)) {
      return this.uploadFileByTencentCosFromUrl({ filename, url, dir });
    }
    if (Number(aliOssStatus)) {
      const res = await this.uploadFileByAliOssFromUrl({ filename, url, dir });
      return res;
    }
    if (Number(cheveretoStatus)) {
      return await this.uploadFileByCheveretoFromUrl({ filename, url, dir });
    }
  }

  /* 通过腾讯云上传图片 */
  async uploadFileByTencentCos({ filename, buffer, dir, fileTyle }) {
    const { Bucket, Region, SecretId, SecretKey } = await this.getUploadConfig('tencent');
    this.tencentCos = new TENCENTCOS({ SecretId, SecretKey, FileParallelLimit: 10 });
    try {
      return new Promise(async (resolve, reject) => {
        const type = fileTyle || 'png'
        this.tencentCos.putObject(
          {
            Bucket: removeSpecialCharacters(Bucket),
            Region: removeSpecialCharacters(Region),
            Key: `${dir}/${filename || `${createRandomUid()}.${fileTyle}`}`,
            StorageClass: 'STANDARD',
            Body: buffer,
          },
          async (err, data) => {
            if (err) {
              console.log('cos -> err: ', err);
              return reject(err);
            }
            let locationUrl = data.Location.replace(/^(http:\/\/|https:\/\/|\/\/|)(.*)/, 'https://$2');
            const { acceleratedDomain } = await this.getUploadConfig('tencent');
            if (acceleratedDomain) {
              locationUrl = locationUrl.replace(/^(https:\/\/[^/]+)(\/.*)$/, `https://${acceleratedDomain}$2`);
              console.log('当前已开启全球加速----------------->', locationUrl);
            }
            return resolve(locationUrl);
          },
        );
      });
    } catch (error) {
      console.log('error: ', error);
      throw new HttpException('上传图片失败[ten]', HttpStatus.BAD_REQUEST);
    }
  }

  /* 腾讯云通过url上传mj图片 */
  async uploadFileByTencentCosFromUrl({ filename, url, dir }) {
    const { Bucket, Region, SecretId, SecretKey } = await this.getUploadConfig('tencent');
    this.tencentCos = new TENCENTCOS({ SecretId, SecretKey, FileParallelLimit: 10 });
    try {
      const proxyMj = (await this.globalConfigService.getConfigs(['mjProxy'])) || 0;
      /* 开启代理 */
      if (Number(proxyMj) === 1) {
        const data = { cosType: 'tencent', url, cosParams: { Bucket, Region, SecretId, SecretKey } };
        const mjProxyUrl = (await this.globalConfigService.getConfigs(['mjProxyUrl'])) || 'http://172.247.48.137:8000';
        const res = await axios.post(`${mjProxyUrl}/mj/replaceUpload`, data);
        if (!res.data) throw new HttpException('上传图片失败[ten][url]', HttpStatus.BAD_REQUEST);
        let locationUrl = res.data.replace(/^(http:\/\/|https:\/\/|\/\/|)(.*)/, 'https://$2');
        const { acceleratedDomain } = await this.getUploadConfig('tencent');
        if (acceleratedDomain) {
          locationUrl = locationUrl.replace(/^(https:\/\/[^/]+)(\/.*)$/, `https://${acceleratedDomain}$2`);
          console.log('当前已开启全球加速----------------->');
        }
        return locationUrl;
      } else {
        const buffer = await this.getBufferFromUrl(url);
        return await this.uploadFileByTencentCos({ filename, buffer, dir, fileTyle: '' });
      }
    } catch (error) {
      console.log('TODO->error:  ', error);
      throw new HttpException('上传图片失败[ten][url]', HttpStatus.BAD_REQUEST);
    }
  }

  /* 通过阿里云上传图片 */
  async uploadFileByAliOss({ filename, buffer, dir, fileTyle = 'png' }) {
    const { region, bucket, accessKeyId, accessKeySecret } = await this.getUploadConfig('ali');
    const client = new ALIOSS({ region: removeSpecialCharacters(region), accessKeyId, accessKeySecret, bucket: removeSpecialCharacters(bucket) });
    try {
      console.log('ali 开始上传');
      return new Promise((resolve, reject) => {
        client
          .put(`${dir}/${filename || `${createRandomUid()}.${fileTyle}`}`, buffer)
          .then((result) => {
            resolve(result.url);
          })
          .catch((err) => {
            reject(err);
          });
      });
    } catch (error) {
      throw new HttpException('上传图片失败[ali]', HttpStatus.BAD_REQUEST);
    }
  }

  /* 阿里云通过url上传mj图片 */
  async uploadFileByAliOssFromUrl({ filename, url, dir }) {
    const { region, bucket, accessKeyId, accessKeySecret } = await this.getUploadConfig('ali');
    const client = new ALIOSS({ region, accessKeyId, accessKeySecret, bucket });
    try {
      const proxyMj = (await this.globalConfigService.getConfigs(['mjProxy'])) || 0;
      if (Number(proxyMj) === 1) {
        const data = { url, cosParams: { region, bucket, accessKeyId, accessKeySecret }, cosType: 'aliyun' };
        const mjProxyUrl = (await this.globalConfigService.getConfigs(['mjProxyUrl'])) || 'http://172.247.48.137:8000';
        const res = await axios.post(`${mjProxyUrl}/mj/replaceUpload`, data);
        if (!res?.data) throw new HttpException('上传图片失败[ALI][url]', HttpStatus.BAD_REQUEST);
        return res.data;
      } else {
        const buffer = await this.getBufferFromUrl(url);
        return await this.uploadFileByAliOss({ filename, buffer, dir });
      }
    } catch (error) {
      throw new HttpException('上传图片失败[ALI][url]', HttpStatus.BAD_REQUEST);
    }
  }

  /* 通过三方图床上传图片 */
  async uploadFileByChevereto({ filename = '', buffer, dir = 'ai', fileTyle = 'png' }) {
    const { key, uploadPath } = await this.getUploadConfig('chevereto');
    let url = uploadPath.endsWith('/') ? uploadPath.slice(0, -1) : uploadPath;
    const formData = new FormData();
    formData.append('source', buffer);
    formData.append('key', key);
    try {
      const res = await axios.post(url, formData, {
        headers: { 'X-API-Key': key },
      });
      if (res?.status === 200) {
        return res.data.image.url;
      } else {
        console.log('Chevereto ---> res', res?.data.code, res?.data.error.message);
        Logger.error('上传图片失败[Chevereto]', JSON.stringify(res.data));
      }
    } catch (error) {
      console.log('error: ', error);
      throw new HttpException(`上传图片失败[Chevereto|buffer] --> ${error.response?.data.error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  /* 通过Url直接上传到图床 */
  async uploadFileByCheveretoFromUrl({ filename, url, dir }) {
    try {
      const proxyMj = (await this.globalConfigService.getConfigs(['mjProxy'])) || 0;
      if (Number(proxyMj) === 1) {
        const { key, uploadPath } = await this.getUploadConfig('chevereto');
        let formatUploadPath = uploadPath.endsWith('/') ? uploadPath.slice(0, -1) : uploadPath;
        const data = { cosType: 'chevereto', url, cosParams: { key, uploadPath: formatUploadPath } };
        const mjProxyUrl = (await this.globalConfigService.getConfigs(['mjProxyUrl'])) || 'http://172.247.48.137:8000';
        const res = await axios.post(`${mjProxyUrl}/mj/replaceUpload`, data);
        if (!res.data) throw new HttpException('上传图片失败[Chevereto][url]', HttpStatus.BAD_REQUEST);
        return res.data;
      } else {
        const buffer = await this.getBufferFromUrl(url);
        return await this.uploadFileByChevereto({ filename, buffer, dir });
      }
    } catch (error) {
      console.log('error: ', error);
      throw new HttpException(error.response, HttpStatus.BAD_REQUEST);
    }
  }

  /* 获取cos上传配置 */
  async getUploadConfig(type) {
    if (type === 'ali') {
      const {
        aliOssRegion: region,
        aliOssBucket: bucket,
        aliOssAccessKeyId: accessKeyId,
        aliOssAccessKeySecret: accessKeySecret,
      } = await this.globalConfigService.getConfigs(['aliOssRegion', 'aliOssBucket', 'aliOssAccessKeyId', 'aliOssAccessKeySecret']);

      return { region, bucket, accessKeyId, accessKeySecret };
    }
    if (type === 'tencent') {
      const {
        cosBucket: Bucket,
        cosRegion: Region,
        cosSecretId: SecretId,
        cosSecretKey: SecretKey,
        tencentCosAcceleratedDomain: acceleratedDomain,
      } = await this.globalConfigService.getConfigs(['cosBucket', 'cosRegion', 'cosSecretId', 'cosSecretKey', 'tencentCosAcceleratedDomain']);
      return { Bucket, Region, SecretId, SecretKey, acceleratedDomain };
    }
    if (type === 'chevereto') {
      const { cheveretoKey: key, cheveretoUploadPath: uploadPath } = await this.globalConfigService.getConfigs([
        'cheveretoKey',
        'cheveretoUploadPath',
      ]);
      return { key, uploadPath };
    }
  }

  async test() {
    const params = {
      filename: 'mjtest.png',
      dir: 'mj',
      url: 'https://cdn.discordapp.com/attachments/1097409128491651135/1169910551275638855/snine_60b5c001b_A_young_girl_smiles_brightly_in_the_pure_blue_f_8a41fe5f-5101-4c1e-b948-a748a0583577.png?ex=65571f1b&is=6544aa1b&hm=b82f2d88224eb7942e24c63a8e519c7693de12a2b96daa0f327dfb8f691b1480&',
    };
    const res = await this.uploadFileFromUrl(params);
    console.log('res: ', res);
    return res;
  }

  /* 将MJ图片地址转为buffer */
  async getBufferFromUrl(url) {
    const proxyMj = (await this.globalConfigService.getConfigs(['mjProxy'])) || 0;
    const response = await axios.get(url, { responseType: 'stream' });
    return new Promise((resolve, reject) => {
      streamToBuffer(response.data, (err, buffer) => {
        if (err) {
          throw new HttpException('获取图片资源失败、请重新试试吧！', HttpStatus.BAD_REQUEST);
        } else {
          resolve(buffer);
        }
      });
    });
  }
}
