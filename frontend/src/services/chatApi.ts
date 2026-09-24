import { api } from './api'
import type { ChatRequest, ChatResponse } from '../types/chat'

export async function sendChatMessage(body: ChatRequest): Promise<ChatResponse> {
  const { data } = await api.post('/chat', body)
  return data
}
