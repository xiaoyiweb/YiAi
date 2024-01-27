import { computed } from 'vue'
import { useMessage } from 'naive-ui'
import { useChatStore } from '@/store'

export function useUsingNetwork() {
  const ms = useMessage()
  const chatStore = useChatStore()
  const usingNetwork = computed<boolean>(() => chatStore.usingNetwork)

  function toggleUsingNetwork() {
    chatStore.setUsingNetwork(!usingNetwork.value)
    if (usingNetwork.value)
      ms.success('已开启联网模式、上下文状态失效！')
    else
      ms.warning('已关闭联网模式！')
  }

  return {
    usingNetwork,
    toggleUsingNetwork,
  }
}
