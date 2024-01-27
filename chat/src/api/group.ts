import { get, post } from '@/utils/request'

/* 创建新的对话组 */
export function fetchCreateGroupAPI<T>(data?: { appId?: number }): Promise<T> {
  return post<T>({
    url: '/group/create',
    data,
  })
}

/* 查询对话组列表 */
export function fetchQueryGroupAPI<T>(): Promise<T> {
  return get<T>({ url: '/group/query' })
}

/* 修改对话组 */
export function fetchUpdateGroupAPI<T>(data?: {
  groupId?: number
  title?: string
  isSticky?: boolean,
	config?: string
}): Promise<T> {
  return post<T>({
    url: '/group/update',
    data,
  })
}

/* 删除对话组 */
export function fetchDelGroupAPI<T>(data?: { groupId: number }): Promise<T> {
  return post<T>({
    url: '/group/del',
    data,
  })
}

/* 删除全部对话组 */
export function fetchDelAllGroupAPI<T>(data?: { groupId: number }): Promise<T> {
  return post<T>({
    url: '/group/delAll',
    data,
  })
}
