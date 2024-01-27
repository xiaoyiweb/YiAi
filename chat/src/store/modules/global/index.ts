import { defineStore } from 'pinia'
import type { GlobalState, OrderInfo } from './helper'
import { store } from '@/store'
import { ss } from '@/utils/storage'
export const useGlobalStore = defineStore('global-store', {
  state: (): GlobalState => ({
    payDialog: false,
    goodsDialog: false,
    noticeDialog: false,
    bindWxDialog: false,
    signInDialog: false,
		modelDialog: false,
		isChatIn: false,
    fingerprint: 0,
    model: ss.get('model') || 3,
    orderInfo: {} as OrderInfo,
		iframeUrl: '',
		clipboardText: ''
  }),

  actions: {
		updateClipboardText(text: string){
			this.clipboardText = text
		},

    updateFingerprint(str: number ) {
			let id = str
			/* 超过mysql最大值进行截取 */
			if(id > 2147483647){
				id = Number(id.toString().slice(-9))
				id = Number(String(Number(id)))
			}
  		ss.set('fingerprint',id)
      this.fingerprint = id
    },

		updateIframeUrl(iframeUrl: string) {
      this.iframeUrl = iframeUrl
    },

    updatePayDialog(payDialog: boolean) {
      this.payDialog = payDialog
    },

		//
		updateModelDialog(modelDialog: boolean) {
      this.modelDialog = modelDialog
    },

		updateIsChatIn(isChatIn: boolean) {
      this.isChatIn = isChatIn
    },

    updateGoodsDialog(goodsDialog: boolean) {
      this.goodsDialog = goodsDialog
    },

    updateBindwxDialog(bindWxDialog: boolean) {
      this.bindWxDialog = bindWxDialog
    },

    updateSignInDialog(signInDialog: boolean) {
      this.signInDialog = signInDialog
    },

    updateNoticeDialog(noticeDialog: boolean) {
      this.noticeDialog = noticeDialog
    },

    updateOrderInfo(orderInfo: OrderInfo | {}) {
      this.orderInfo = orderInfo
    },

    updateModel(model: number) {
      ss.set('model', model)
      this.model = model
    },

  },
})

export function useGlobalStoreWithOut() {
  return useGlobalStore(store)
}
