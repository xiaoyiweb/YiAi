import api from '../index'

export default {
  queryModels: (params: any) => api.get('models/query', { params }),
  setModels: (data: any) => api.post('models/setModel', data),
  delModels: (data: any) => api.post('models/delModel', data),
  // setMenu: (data: any) => api.post('menu/setMenu', data),
  // delMenu: (data: any) => api.post('menu/delete', data),
  // updateIcon: (data: any) => api.post('menu/updateIcon', data),
  // queryMjDrawAll: params => api.get('midjourney/getList', { params }),
  // recMjDrawImg: (data: { id: number }) => api.post('midjourney/rec', data),
  // delChatLog: (data: { id: number }) => api.post('midjourney/del', data),
}
