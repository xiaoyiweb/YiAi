import { get, post } from '@/utils/request'

/* query sales account */
export function fetchSalesAccountAPI<T>(): Promise<T> {
  return get<T>({
    url: '/sales/mineAccount',
  })
}

/* query sales records */
export function fetchSalesRecordsAPI<T>(data: { page?: number; size?: number }): Promise<T> {
  return get<T>({
    url: '/sales/mineRecords',
    data,
  })
}

/* query sales order */
export function fetchSalesOrderAPI<T>(data: { page?: number; size?: number }): Promise<T> {
  return get<T>({
    url: '/sales/drawMoneyOrder',
    data,
  })
}

/* salce appfor money */
export function fetchAppforMoneyAPI<T>(data: {
  withdrawalAmount: number | null
  withdrawalChannels: number | null
  contactInformation: string
  remark?: string
}): Promise<T> {
  return post<T>({
    url: '/sales/appForMoney',
    data,
  })
}
