import api from '../index'

export default {
  queryKeyList: params => api.get('chatgpt/keyList', { params }),
  queryKeyModelList: params => api.get('chatgpt/keyModelList', { params }),
  queryKeyDetail: params => api.get('chatgpt/keyDetail', { params }),
  addGptKey: (data: any) => api.post('chatgpt/addKey', data),
  updateGptKey: (data: any) => api.post('chatgpt/updateKey', data),
  addWhiteUser: (data: any) => api.post('chatgpt/addWhiteUser', data),
  updateWhiteUser: (data: any) => api.post('chatgpt/updateWhiteUser', data),
  queryWhiteUserList: params => api.get('chatgpt/userWhiteList', { params }),
  deleteGptKey: (data: any) => api.post('chatgpt/deleteKey', data),
  queryChatBoxTypes: () => api.get('chatgpt/queryChatBoxTypes'),
  setChatBoxType: data => api.post('chatgpt/setChatBoxType', data),
  delChatBoxType: data => api.post('chatgpt/delChatBoxType', data),
  queryChatBoxs: () => api.get('chatgpt/queryChatBoxs'),
  setChatBox: data => api.post('chatgpt/setChatBox', data),
  delChatBox: data => api.post('chatgpt/delChatBox', data),

  queryChatPreTypes: () => api.get('chatgpt/queryChatPreTypes'),
  setChatPreType: data => api.post('chatgpt/setChatPreType', data),
  delChatPreType: data => api.post('chatgpt/delChatPreType', data),
  queryChatPres: () => api.get('chatgpt/queryChatPres'),
  setChatPre: data => api.post('chatgpt/setChatPre', data),
  delChatPre: data => api.post('chatgpt/delChatPre', data),
}
