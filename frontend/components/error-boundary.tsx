'use client'

import { Component, ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-[100svh] items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4 max-w-sm text-center px-6">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div className="space-y-1">
              <p className="text-sm font-black uppercase tracking-widest text-foreground/80">Session Fault</p>
              <p className="text-xs text-muted-foreground">{this.state.message || 'An unexpected error occurred.'}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleReset}
              className="gap-2 text-xs uppercase tracking-widest font-black"
            >
              <RefreshCw className="h-3 w-3" />
              Restart Session
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
