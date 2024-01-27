import api from '../index'

export default {
  quertMenu: params => api.get('menu/query', { params }),
  visibleMenu: (data: { id: number }) => api.post('menu/visible', data),
  setMenu: (data: any) => api.post('menu/setMenu', data),
  delMenu: (data: any) => api.post('menu/delete', data),
  updateIcon: (data: any) => api.post('menu/updateIcon', data),
  // queryMjDrawAll: params => api.get('midjourney/getList', { params }),
  // recMjDrawImg: (data: { id: number }) => api.post('midjourney/rec', data),
  // delChatLog: (data: { id: number }) => api.post('midjourney/del', data),
}
