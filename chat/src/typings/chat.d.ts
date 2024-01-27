declare namespace Chat {

	interface Chat {
		chatId?: number
		dateTime: string
		text: string
		inversion?: boolean
		usage?: object,
		error?: boolean
		loading?: boolean
		conversationOptions?: ConversationRequest | null
		requestOptions: { prompt: string; options?: ConversationRequest | null }
	}

	interface History {
		title: string
		isEdit: boolean
		uuid: number
		isSticky: boolean
		config: string
	}

	interface ChatState {
		active: number
		usingContext: boolean;
		usingNetwork: boolean;
		history?: History[]
		baseConfig: any
		chat?: { uuid: number; data: Chat[] }[]
		groupList: { uuid: number; title: string; appId: number; isEdit: boolean; isSticky: boolean; config: string; createdAt: Date; updatedAt: Date; appLogo?: string }[]
		chatList: Chat[]
		groupKeyWord?: string
		activeConfig?: any
		activeModelKeyDeductType?: number
		activeModelKeyPrice?: number
		activeModelKeyType?: number
		activeGroupAppId?: number
		chatPreList: []
	}


	interface ConversationRequest {
		conversationId?: string
		parentMessageId?: string
		temperature?: number
		model?: number
		groupId?: number
	}

	interface ConversationResponse {
		conversationId: string
		detail: {
			choices: { finish_reason: string; index: number; logprobs: any; text: string }[]
			created: number
			id: string
			model: string
			object: string
			usage: { completion_tokens: number; prompt_tokens: number; total_tokens: number }
		}
		id: string
		parentMessageId: string
		role: string
		text: string
	}
}
