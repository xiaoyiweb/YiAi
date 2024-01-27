import api from '../index'

export default {
  getBaseInfo: params => api.get('/statistic/base', { params }),
  getChatStatistic: params => api.get('/statistic/chatStatistic', { params }),
  getBaiduVisit: params => api.get('/statistic/baiduVisit', { params }),
}
