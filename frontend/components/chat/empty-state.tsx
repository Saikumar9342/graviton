'use client'

import { Sparkles, Code, BookOpen, Lightbulb, Wand2, Rocket, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  onSuggestionClick: (suggestion: string) => void
}

const suggestions = [
  {
    icon: Code,
    title: 'Write Code',
    description: 'Create components, debug issues, or learn new patterns',
    prompt: 'Help me create a responsive navbar component in React with Tailwind CSS that has a mobile menu, dark mode toggle, and smooth animations',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    iconColor: 'text-blue-500',
  },
  {
    icon: Brain,
    title: 'Explain Concepts',
    description: 'Deep dive into technical topics with clear examples',
    prompt: 'Explain how async/await works in JavaScript, including error handling, Promise.all, and common pitfalls to avoid',
    gradient: 'from-purple-500/20 to-pink-500/20',
    iconColor: 'text-purple-500',
  },
  {
    icon: Lightbulb,
    title: 'Brainstorm Ideas',
    description: 'Get creative solutions and fresh perspectives',
    prompt: 'Give me 5 innovative project ideas for building a portfolio that stands out to tech recruiters in 2026',
    gradient: 'from-amber-500/20 to-orange-500/20',
    iconColor: 'text-amber-500',
  },
  {
    icon: Rocket,
    title: 'Build Features',
    description: 'Plan and implement complete application features',
    prompt: 'Help me design and implement a user authentication system with email verification, password reset, and OAuth support',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    iconColor: 'text-emerald-500',
  },
  {
    icon: Wand2,
    title: 'Refactor Code',
    description: 'Improve performance, readability, and best practices',
    prompt: 'Review my code for best practices, suggest improvements for performance and maintainability, and help me refactor it',
    gradient: 'from-rose-500/20 to-red-500/20',
    iconColor: 'text-rose-500',
  },
  {
    icon: BookOpen,
    title: 'Learn Together',
    description: 'Step-by-step tutorials and guided learning',
    prompt: 'Teach me how to build a real-time chat application with WebSockets, starting from the basics and building up to production-ready code',
    gradient: 'from-indigo-500/20 to-violet-500/20',
    iconColor: 'text-indigo-500',
  },
]

export function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-12">
      {/* Logo / Hero */}
      <div className="relative mb-8">
        {/* Glow effect */}
        <div className="absolute inset-0 blur-3xl opacity-50">
          <div className="h-24 w-24 rounded-full bg-primary/50" />
        </div>
        
        {/* Icon container */}
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 shadow-2xl">
          <Sparkles className="h-10 w-10 text-primary animate-pulse" />
        </div>
        
        {/* Floating particles */}
        <div className="absolute -top-2 -right-2 h-3 w-3 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0s' }} />
        <div className="absolute -bottom-1 -left-3 h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-1/2 -right-4 h-2 w-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '1s' }} />
      </div>
      
      <h1 className="mb-3 text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
        What can I help you build?
      </h1>
      <p className="mb-10 max-w-md text-center text-muted-foreground text-balance">
        I&apos;m Graviton AI, your intelligent coding companion. Ask me anything about 
        development, debugging, or building amazing products.
      </p>

      {/* Suggestions Grid */}
      <div className="grid w-full max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.title}
            onClick={() => onSuggestionClick(suggestion.prompt)}
            className={cn(
              'group relative flex flex-col items-start gap-3 rounded-2xl p-5 text-left transition-all duration-300',
              'bg-gradient-to-br border border-border/50 hover:border-primary/30',
              suggestion.gradient,
              'hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-xl',
                'bg-background/80 backdrop-blur-sm',
                'transition-transform duration-300 group-hover:scale-110',
                'shadow-lg'
              )}
            >
              <suggestion.icon className={cn('h-5 w-5', suggestion.iconColor)} />
            </div>
            
            {/* Content */}
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {suggestion.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {suggestion.description}
              </p>
            </div>

            {/* Hover indicator */}
            <div className="absolute inset-x-4 bottom-3 h-0.5 scale-x-0 rounded-full bg-primary/50 transition-transform duration-300 group-hover:scale-x-100" />
          </button>
        ))}
      </div>

      {/* Keyboard hint */}
      <div className="mt-10 flex items-center gap-2 text-xs text-muted-foreground">
        <span>Press</span>
        <kbd className="rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-[10px]">
          /
        </kbd>
        <span>to focus the input</span>
      </div>
    </div>
  )
}
