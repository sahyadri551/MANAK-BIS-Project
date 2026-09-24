export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatStandardRef {
  id: number
  is_number: string
  title: string
}

export interface ChatRequest {
  message: string
  history: ChatTurn[]
  lang: string
}

export interface ChatResponse {
  reply: string
  standards: ChatStandardRef[]
  available: boolean
}
