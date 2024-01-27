export interface App {
  id: number
  name: string
  des: string
  coverImg: string
  catId: number
  appCount: number
  demoData: string
  loading?: boolean
  createdAt: string
  updatedAt: string
}

export interface Answer {
  id: number
  appId: number
  prompt: string
  answer?: string
  loading?: boolean
  conversationOptions?: string
  requestOptions?: string
  role?: string
}
