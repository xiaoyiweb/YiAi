import type { AxiosProgressEvent, GenericAbortSignal } from 'axios'
import { get, post } from '@/utils/request'
import { useSettingStore } from '@/store'

/* 流失对话聊天 */
export function fetchChatAPIProcess<T = any>(
  params: {
    prompt: string
    appId?: number
    options?: { conversationId?: string; parentMessageId?: string; temperature: number }
    signal?: GenericAbortSignal
    onDownloadProgress?: (progressEvent: AxiosProgressEvent) => void },
) {
  return post<T>({
    url: '/chatgpt/chat-process',
    data: { prompt: params.prompt, appId: params?.appId, options: params.options },
    signal: params.signal,
    onDownloadProgress: params.onDownloadProgress,
  })
}

/* 获取个人信息 */
export function fetchGetInfo<T>() {
  return get<T>({ url: '/auth/getInfo' })
}

/* 注册 */
export function fetchRegisterAPI<T>(data: { username: string;password: string;email: string }): Promise<T> {
  return post<T>({ url: '/auth/register', data }) as Promise<T>
}

/* 注册 */
export function fetchRegisterByPhoneAPI<T>(data: { username: string;password: string; phone: string; phoneCode: string }): Promise<T> {
  return post<T>({ url: '/auth/registerByPhone', data }) as Promise<T>
}

/* 登录 */
export function fetchLoginAPI<T>(data: { username: string; password: string }): Promise<T> {
  return post<T>({ url: '/auth/login', data }) as Promise<T>
}

/* 手机号登录 */
export function fetchLoginByPhoneAPI<T>(data: { phone: string; password: string }): Promise<T> {
  return post<T>({ url: '/auth/loginByPhone', data }) as Promise<T>
}

/* 修改个人信息 */
export function fetchUpdateInfoAPI<T>(data: { username?: string; avatar?: string }): Promise<T> {
  return post<T>({ url: '/user/update', data }) as Promise<T>
}

/* 获取个人绘画记录 */
export function fetchGetChatLogDraw<T>(data: { model: string }): Promise<T> {
  return get<T>({ url: '/chatLog/draw', data }) as Promise<T>
}

/* 获取所有绘画记录 */
export function fetchGetAllChatLogDraw<T>(data: { size: number; rec: number; model: string }): Promise<T> {
  return get<T>({ url: '/chatLog/drawAll', data }) as Promise<T>
}

/* chatgpt的dall-e2绘画 */
export function fetchChatDraw<T>(data: { prompt: string;n: number;size: string }): Promise<T> {
  return post<T>({ url: '/chatgpt/chat-draw', data }) as Promise<T>
}

/* 修改密码 */
export function fetchUpdatePasswordAPI<T>(data: { oldPassword?: string;password?: string }): Promise<T> {
  return post<T>({ url: '/auth/updatePassword', data }) as Promise<T>
}

/* 同步对话 */
export function fetchGetchatSyncApi<T = any>(
  params: {
    prompt: string
    options?: { conversationId?: string; parentMessageId?: string; temperature: number }
    signal?: GenericAbortSignal
    onDownloadProgress?: (progressEvent: AxiosProgressEvent) => void },
) {
  return post<T>({
    url: '/chatgpt/chat-sync',
    data: { prompt: params.prompt, options: params.options },
    signal: params.signal,
    onDownloadProgress: params.onDownloadProgress,
  })
}

/* 获取mind绘画联想词 */
export function fetchGetchatMindApi<T = any>(
  params: {
    prompt: string
    options?: { conversationId?: string; parentMessageId?: string; temperature: number }
    signal?: GenericAbortSignal
    onDownloadProgress?: (progressEvent: AxiosProgressEvent) => void },
) {
  return post<T>({
    url: '/chatgpt/chat-mind',
    data: { prompt: params.prompt, options: params.options },
    signal: params.signal,
    onDownloadProgress: params.onDownloadProgress,
  })
}

/* 获取MJ绘画联想词 */
export function fetchGetMjPromptAssociateApi<T>(data: { prompt: string }): Promise<T> {
  return post<T>({ url: '/chatgpt/mj-associate', data }) as Promise<T>
}

/* 获取MJ绘画联想词 */
export function fetchGetMjPromptFanyiApi<T>(data: { prompt: string }): Promise<T> {
  return post<T>({ url: '/chatgpt/mj-fy', data }) as Promise<T>
}

/* 获取我得绘制列表 */
export function fetchMidjourneyDrawList<T>(data: { page?: number; size?: number }): Promise<T> {
  return get<T>({ url: '/midjourney/drawList', data }) as Promise<T>
}

/* 获取Mj提示词 */
export function fetchMidjourneyPromptList<T>(): Promise<T> {
  return get<T>({ url: '/midjourney/queryPrompts' }) as Promise<T>
}

/* 获取Mj完整提示词 */
export function fetchMidjourneyFullPrompt<T>(data: any): Promise<T> {
  return get<T>({ url: '/midjourney/getFullPrompt', data }) as Promise<T>
}

/* 删除MJ绘画记录 */
export function fetchDownloadImg<T>(data: { id: number }): Promise<T> {
  return post<T>({ url: '/midjourney/delete', data }) as Promise<T>
}

/* 获取我得绘制列表 */
export function fetchMidjourneyGetList<T>(data: { page?: number; size?: number; rec: number }): Promise<T> {
  return get<T>({ url: '/midjourney/getList', data }) as Promise<T>
}

/* 推荐图片 */
export function fetchRecDraw<T>(data: { id: number }): Promise<T> {
  return post<T>({ url: '/midjourney/rec', data }) as Promise<T>
}

/* 获取图片验证码 */
export function fetchCaptchaImg<T>(data: { color: string }): Promise<T> {
  return post<T>({ url: '/auth/captcha', data }) as Promise<T>
}

/* 发送手机验证码 */
export function fetchSendSms<T>(data: { phone: string; captchaId: string; captchaCode: string }): Promise<T> {
  return post<T>({ url: '/auth/sendPhoneCode', data }) as Promise<T>
}

/* 获取九宫格设置 */
export function fetchGetChatBoxList<T>() {
  return get<T>({ url: '/chatgpt/queryChatBoxFrontend' })
}


/* 获取快问设置 */
export function fetchGetChatPreList<T>() {
  return get<T>({ url: '/chatgpt/queryChatPreList' })
}
