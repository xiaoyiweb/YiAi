import { get, post } from '@/utils/request'

/* mj draw */
export function fetchMjDtawAPI<T>(data: { prompt: string }): Promise<T> {
  return post<T>({
    url: '/mj/draw',
    data,
  })
}

/* mj upscale Img */
export function fetchUpscaleSingleImgAPI<T>(data: { message_id: string; orderId: number }): Promise<T> {
  return post<T>({
    url: '/mj/upscaleSingleImg',
    data,
  })
}

/* mj variation img */
export function fetchVariationSingleImgAPI<T>(data: { message_id: string; orderId: number }): Promise<T> {
  return post<T>({
    url: '/mj/variationSingleImg',
    data,
  })
}

/* mj fanyi */
export function fetchTranslateAPI<T>(data: { text: string }): Promise<T> {
  return get<T>({
    url: '/fanyi/translate',
    data,
  })
}

/* 提交一个绘画任务 */
export function fetchDrawTaskAPI<T>(data: { prompt?: string; imgUrl?: string; extraParam?: string; drawId?: number; action?: number; orderId?: number }): Promise<T> {
  return post<T>({
    url: '/queue/addMjDrawQueue',
    data,
  })
}

/* 代理图片 */
export function fetchProxyImgAPI<T>(data: { url: string }): Promise<T> {
  return get<T>({
    url: '/midjourney/proxy',
    data,
		headers: {
			responseType: 'arraybuffer'
		}
  })
}
