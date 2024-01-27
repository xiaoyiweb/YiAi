import { get, post } from '@/utils/request'

/* 查询app分组 */
export function fetchQueryAppCatsAPI<T>(): Promise<T> {
  return get<T>({ url: '/app/queryCats' })
}

/*  查询全量app列表 */
export function fetchQueryAppsAPI<T>(): Promise<T> {
  return get<T>({
    url: '/app/list',
  })
}

/*  查询个人app列表 */
export function fetchQueryMineAppsAPI<T>(): Promise<T> {
  return get<T>({
    url: '/app/mineApps',
  })
}

/* 收藏app */
export function fetchCollectAppAPI<T>(data: { appId: number }): Promise<T> {
  return post<T>({ url: '/app/collect', data })
}

/* 收藏app */
export function fetchCustomAppAPI<T>(data: any): Promise<T> {
  return post<T>({ url: '/app/customApp', data })
}

/* 删除app */
export function fetchDelMineAppAPI<T>(data: any): Promise<T> {
  return post<T>({ url: '/app/delMineApp', data })
}

/*  查询全量app列表 */
export function fetchQueryOneCatAPI<T>(data): Promise<T> {
  return get<T>({
    url: '/app/queryOneCat',
		data
  })
}

