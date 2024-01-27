import api from '../index'

interface KeyValue {
  configKey: string
  configVal: any
}

export default {
  queryAllConfig: () => api.get('config/queryAll'),
  queryGptKeys: () => api.get('config/queryGptKeys'),
  setGptKeys: data => api.post('config/setGptKeys', data),
  queryConfig: data => api.post('config/query', data),
  copyright: () => api.get('config/copyright'),
  setConfig: (data: { settings: KeyValue[] }) => api.post('config/set', data),
}
