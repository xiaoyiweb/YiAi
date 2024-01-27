import api from '../index'

export default {
  queryCats: params => api.get('app/queryAppCats', { params }),
  deleteCats: (data: { id: number }) => api.post('app/delAppCats', data),
  createCats: data => api.post('app/createAppCats', data),
  updateCats: data => api.post('app/updateAppCats', data),
  queryApp: params => api.get('app/queryApp', { params }),
  deleteApp: (data: { id: number }) => api.post('app/delApp', data),
  createApp: data => api.post('app/createApp', data),
  updateApp: data => api.post('app/updateApp', data),
  auditPassApp: (data: { id: number }) => api.post('app/auditPass', data),
  auditFailApp: (data: { id: number }) => api.post('app/auditFail', data),
}
