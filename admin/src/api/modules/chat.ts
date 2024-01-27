import api from '../index'

export default {
  queryChatAll: params => api.get('chatLog/chatAll', { params }),
  queryDrawAll: params => api.get('chatLog/drawAll', { params }),
  recDrawImg: (data: { id: number }) => api.post('chatLog/recDrawImg', data),
  queryMjDrawAll: params => api.get('midjourney/getList', { params }),
  recMjDrawImg: (data: { id: number }) => api.post('midjourney/rec', data),
  delChatLog: (data: { id: number }) => api.post('midjourney/del', data),
}
