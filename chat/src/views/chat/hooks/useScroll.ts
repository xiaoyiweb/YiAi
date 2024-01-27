import type { Ref } from 'vue'
import { nextTick, ref } from 'vue'

type ScrollElement = HTMLDivElement | null

interface ScrollReturn {
  scrollRef: Ref<ScrollElement>
  scrollToBottom: () => Promise<void>
  scrollToTop: () => Promise<void>
  scrollToBottomIfAtBottom: () => Promise<void>
}

// 节流函数
function throttle(func: () => void, delay: number) {
  let isThrottled = false;

  return function throttledFunction() {
    if (!isThrottled) {
      func();
      isThrottled = true;
      setTimeout(() => {
        isThrottled = false;
      }, delay);
    }
  };
}

export function useScroll(): ScrollReturn {
  const scrollRef = ref<ScrollElement>(null)

  const scrollToBottom = async () => {
    await nextTick()
    if (scrollRef.value)
      scrollRef.value.scrollTop = scrollRef.value.scrollHeight
  }

  const scrollToTop = async () => {
    await nextTick()
    if (scrollRef.value)
      scrollRef.value.scrollTop = 0
  }

  // 使用节流函数包装 scrollToBottomIfAtBottom
  const throttledScrollToBottomIfAtBottom = throttle(scrollToBottomIfAtBottom, 100);

  async function scrollToBottomIfAtBottom() {
    if (scrollRef.value) {
      const threshold = 300;
      const distanceToBottom = scrollRef.value.scrollHeight - scrollRef.value.scrollTop - scrollRef.value.clientHeight;
      if (distanceToBottom <= threshold)
        scrollRef.value.scrollTop = scrollRef.value.scrollHeight;
    }
  }

  return {
    scrollRef,
    scrollToBottom,
    scrollToTop,
    scrollToBottomIfAtBottom: throttledScrollToBottomIfAtBottom,
  }
}
