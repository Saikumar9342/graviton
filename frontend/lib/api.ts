import { Chat, ChatMessage } from './types';

const API_BASE = '/api';

export async function fetchChats(): Promise<Chat[]> {
  const response = await fetch(`${API_BASE}/chats`);
  if (!response.ok) throw new Error('Failed to fetch chats');
  const data = await response.json();
  return data.map((chat: any) => ({
    id: chat.id,
    title: chat.title,
    createdAt: new Date(chat.created_at),
    updatedAt: new Date(chat.updated_at),
    messages: [] // We fetch messages per chat if needed
  }));
}

export async function createChat(title: string): Promise<Chat> {
  const response = await fetch(`${API_BASE}/chats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!response.ok) throw new Error('Failed to create chat');
  const chat = await response.json();
  return {
    id: chat.id,
    title: chat.title,
    createdAt: new Date(chat.created_at),
    updatedAt: new Date(chat.updated_at),
    messages: []
  };
}

export async function deleteChat(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/chats/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete chat');
}

export async function fetchMessages(chatId: string): Promise<ChatMessage[]> {
  const response = await fetch(`${API_BASE}/chats/${chatId}/messages`);
  if (!response.ok) throw new Error('Failed to fetch messages');
  const data = await response.json();
  return data.map((msg: any) => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    createdAt: new Date(msg.created_at),
  }));
}

export interface ModelInfo {
  id: string
  name: string
  provider: string
  badge?: string
}

export async function fetchModels(): Promise<ModelInfo[]> {
  try {
    const response = await fetch(`${API_BASE}/models`);
    if (!response.ok) return [];
    const data = await response.json();
    const names: string[] = data.models || [];
    return names.map((id) => ({
      id,
      name: id,
      provider: 'Ollama',
    }));
  } catch {
    return [];
  }
}
