import { get } from '@/utils/request'

/* query globle config  */
export function fetchQueryConfigAPI<T>(data: any) {
  return get<T>({
    url: '/config/queryFronet',
    data,
  })
}

/* query globle menu  */
export function fetchQueryMenuAPI<T>(data: any) {
  return get<T>({
    url: '/menu/list',
    data,
  })
}
