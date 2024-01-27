import { get, post } from '@/utils/request'

/* get rechargeLog */
export function fetchGetRechargeLogAPI<T>(data: { page?: number; size?: number }): Promise<T> {
  return get<T>({
    url: '/balance/rechargeLog',
    data,
  })
}

/* query balance */
export function fetchGetBalanceQueryAPI<T>(): Promise<T> {
  return get<T>({
    url: '/balance/query',
  })
}

/* log invite link count */
export function fetchVisitorCountAPI<T>(): Promise<T> {
  return get<T>({
    url: '/balance/getVisitorCount',
  })
}

/* log invite link count */
export function fetchSyncVisitorDataAPI<T>(): Promise<T> {
  return post<T>({
    url: '/balance/inheritVisitorData',
  })
}
