import { ChatInterface } from '@/components/chat/chat-interface'
import { ErrorBoundary } from '@/components/error-boundary'

export default function Home() {
  return (
    <ErrorBoundary>
      <ChatInterface />
    </ErrorBoundary>
  )
}
