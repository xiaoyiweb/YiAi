import api from '../index'

export default {
  login: (data: {
    username: string
    password: string
  }) => api.post('auth/login', data),

  permission: () => api.get('auth/getInfo'),

  getInfo: () => api.get('auth/getInfo'),

  queryAllUser: params => api.get('user/queryAll', { params }),

  updateUserStatus: (data: {
    status: string
  }) => api.post('user/updateStatus', data),

  resetUserPassword: (data: { id: number }) => api.post('user/resetUserPass', data),

  sendUserCrami: (data: {
    userId: number
    usesLeft: number
    paintCount: number
    balance: number
  }) => api.post('user/recharge', data),

  updatePassword: (data: {
    oldPassword: string
    password: string
  }) => api.post('auth/updatePassword', data),
}
