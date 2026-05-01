import {
  consumeStream,
  convertToModelMessages,
  streamText,
  UIMessage,
} from 'ai'

export const maxDuration = 60

export async function POST(req: Request) {
  const { messages, model = 'openai/gpt-4o' }: { messages: UIMessage[]; model?: string } = await req.json()

  const result = streamText({
    model,
    system: `You are Graviton, a helpful AI assistant. You provide clear, accurate, and thoughtful responses.
    
When formatting your responses:
- Use markdown for formatting when helpful
- Use code blocks with language identifiers for code
- Break down complex answers into clear sections
- Be concise but comprehensive
- Use bullet points or numbered lists when presenting multiple items`,
    messages: await convertToModelMessages(messages),
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    consumeSseStream: consumeStream,
  })
}
