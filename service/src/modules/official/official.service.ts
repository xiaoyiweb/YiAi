import { ChatgptService } from '../chatgpt/chatgpt.service';
import { GlobalConfigService } from '../globalConfig/globalConfig.service';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';
import { AutoreplyService } from '../autoreply/autoreply.service';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import axios from 'axios';
import { createRandomNonceStr } from '@/common/utils';
import { GetQrSceneStrDto } from './dto/getQrSceneStr.dto';

@Injectable()
export class OfficialService {
  constructor(
    private readonly autoreplyService: AutoreplyService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly globalConfigService: GlobalConfigService,
    private readonly chatgptService: ChatgptService
  ) {}
  private sceneStrMap = {};
  private scanedSceneStrMap = {};

  async onModuleInit() {
    await this.globalConfigService.getWechatAccessToken(true);
  }

  async getQRSceneStr(body: GetQrSceneStrDto) {
    const { invitedBy } = body;
    let sceneStr = createRandomNonceStr(32);
    invitedBy && (sceneStr += `:${invitedBy}`);
    this.sceneStrMap[sceneStr] = true;
    return sceneStr;
  }

  /* 下发绑定微信的sceneStr */
  async getQRSceneStrByBind(req) {
    const { id } = req.user;
    const sceneStr = `${createRandomNonceStr(32)}/${id}`;
    this.sceneStrMap[sceneStr] = true;
    return sceneStr;
  }

  async getQRCodeTicket(sceneStr: string) {
    return this.fetchQRCodeTicket(sceneStr);
  }

  async getRedirectUrl(url: string) {
    const appId = await this.globalConfigService.getConfigs(['wechatOfficialAppId']);
    const res = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${encodeURIComponent(
      url,
    )}&response_type=code&scope=snsapi_base&state=weChatLogin#wechat_redirect`;
    console.log('回跳跳转地址: ', res);
    return res;
  }

  async getJsapiTicket(url: string) {
    const nonceStr = createRandomNonceStr(32);
    const timestamp = (Date.now() / 1000).toFixed(0);
    const jsapiTicket = await this.globalConfigService.getConfigs(['wechatJsapiTicket']);
    console.log('jsapiTicket: ', jsapiTicket);
    const appId = await this.globalConfigService.getConfigs(['wechatOfficialAppId']);
    console.log('appId: ', appId);
    const str = `jsapi_ticket=${jsapiTicket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`;
    console.log('str: ', str);
    const signature = this.sha1(str);
    return { appId, nonceStr, timestamp, signature };
  }

  async fetchQRCodeTicket(sceneStr: string) {
    const accessToken = await this.globalConfigService.getConfigs(['wechatAccessToken']);
    const params = { action_name: 'QR_STR_SCENE', action_info: { scene: { scene_str: sceneStr } } };
    const res = await axios.post(`https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=${accessToken}`, params);
    const {
      data: { errmsg, ticket },
    } = res;
    if (errmsg) throw new HttpException(errmsg, HttpStatus.BAD_REQUEST);
    return ticket;
  }

  async loginByCode(req, code: string) {
    const appId = await this.globalConfigService.getConfigs(['wechatOfficialAppId']);
    const secret = await this.globalConfigService.getConfigs(['wechatOfficialAppSecret']);
    const res = await axios.get(
      `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${secret}&code=${code}&grant_type=authorization_code`,
    );
    const {
      data: { errmsg, openid },
    } = res;
    if (errmsg) throw new HttpException(errmsg, HttpStatus.BAD_REQUEST);
    let user;
    user = await this.userService.getUserOpenId(openid);
    if (!user) {
      user = await this.userService.getUserFromOpenId(openid);
    }
    return this.authService.loginByOpenId(user, req);
  }

  /* 扫码事件  初次扫码关注 或者二次扫码都一样 */
  async scan(openID: string, sceneStr: string) {
    if (!this.sceneStrMap[sceneStr]) throw new HttpException('非法参数', HttpStatus.BAD_REQUEST);
    const user = await this.userService.getUserFromOpenId(openID, sceneStr);
    this.scanedSceneStrMap[sceneStr] = user.id;
  }

  /* 轮询扫码登录响应 */
  async loginBySceneStr(req, sceneStr: string) {
    if (!this.sceneStrMap[sceneStr]) return;
    const userId = this.scanedSceneStrMap[sceneStr];
    if (!userId) return '';
    const user = await this.userService.getUserById(userId);
    delete this.scanedSceneStrMap[sceneStr];
    return this.authService.loginByOpenId(user, req);
  }

  /* 扫码事件 绑定微信 */
  async scanBindWx(openId: string, sceneStr) {
    if (!this.sceneStrMap[sceneStr]) throw new HttpException('非法参数', HttpStatus.BAD_REQUEST);
    const userId = sceneStr.split('/')[1];
    const bindRes = await this.userService.bindWx(openId, userId);
    this.scanedSceneStrMap[sceneStr] = bindRes;
  }

  /* 轮询绑定结果 */
  async bindWxBySceneStr(req, sceneStr: string) {
    if (!this.sceneStrMap[sceneStr]) throw new HttpException('非法参数', HttpStatus.BAD_REQUEST);
    const { id } = req.user;
    const res = this.scanedSceneStrMap[sceneStr];
    if (!res) return '';
    delete this.scanedSceneStrMap[sceneStr];
    return res;
  }

  async verify(signature: string, nonce: string, timestamp: string) {
    const token = (await this.globalConfigService.getConfigs(['wechatOfficialToken'])) || 'jiangly';
    return (await this.sha1([token, nonce, timestamp].sort().join(''))) == signature;
  }

  sha1(data: string) {
    return crypto.createHash('sha1').update(data).digest('hex');
  }

  async genXmlMsgByConfig(xmlData, msgKey) {
    const msg = await this.globalConfigService.getConfigs([msgKey]);
    return this.genXmlMsg(xmlData, msg);
  }

  async genXmlMsg(xmlData, msg) {
    return `
    <xml>
        <ToUserName><![CDATA[${xmlData.fromusername[0]}]]></ToUserName>
        <FromUserName><![CDATA[${xmlData.tousername[0]}]]></FromUserName>
        <CreateTime>${new Date().getTime()}</CreateTime>
        <MsgType><![CDATA[text]]></MsgType>
        <Content><![CDATA[${msg}]]></Content>
    </xml>`;
  }

  async aotoPlay(msg) {
    const timeoutPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('请求超时'));
      }, 4800);
    });
    let question: any = ''
    try {
      console.log('来自公众号的询问问题 =======> ', msg);
      const response = await Promise.race([this.chatgptService.chatSyncFree(msg), timeoutPromise]);
      question = response || await this.autoreplyService.checkAutoReply(msg);
    } catch (error) {
      console.log('来自公众号的回复问题 =======> 超时导致问题无法回答完整')
      question = (await this.globalConfigService.getConfigs(['officialAutoReplyText'])) || '由于公众号的回复限制、过长的问题我们可能无法回复、您可以前往我们的官方站点享受更加完善的服务、如果您有更多问题、欢迎像我提问！'
    }
    return question;
  }
}
