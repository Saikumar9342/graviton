'use client'

import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  isStreaming?: boolean
  onSelectOption?: (text: string) => void
}

function CodeBlock({
  language,
  children,
}: {
  language: string
  children: string
}) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group relative my-4 overflow-hidden rounded-lg border border-border bg-[var(--chat-code-bg)]">
      <div className="flex items-center justify-between bg-[var(--chat-code-header)] px-4 py-2 text-xs text-muted-foreground">
        <span className="font-mono">{language || 'text'}</span>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: '1rem',
          background: 'transparent',
          fontSize: '0.875rem',
        }}
        codeTagProps={{
          style: {
            fontFamily: 'var(--font-mono)',
          },
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  )
}

export function MarkdownRenderer({ content, isStreaming, onSelectOption }: MarkdownRendererProps) {
  const handleOptionClick = (marker: string, content: string) => {
    if (onSelectOption) {
      // Send just the marker (e.g. "A") as usually expected in MCQs
      onSelectOption(marker)
    }
  }

  const OptionCard = ({ marker, content }: { marker: string, content: string }) => (
    <div 
      onClick={() => handleOptionClick(marker, content)}
      className="group/option relative my-1 p-2 px-3 rounded-lg border border-border/30 bg-muted/5 hover:bg-primary/5 hover:border-primary/30 cursor-pointer shadow-sm flex gap-3 items-center transition-all duration-200"
    >
      <span className="shrink-0 text-xs font-bold text-primary/70 group-hover/option:text-primary transition-colors w-4">
        {marker}
      </span>
      
      <span className="flex-1 text-sm text-foreground/80 leading-snug group-hover/option:text-foreground transition-colors">
        {content}
      </span>

      <div className="opacity-0 group-hover/option:opacity-100 transition-opacity absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-[9px] font-bold text-primary uppercase tracking-tight">
        Send
      </div>
    </div>
  )

  return (
    <div className={cn('prose-chat', isStreaming && 'typing-cursor')}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match && !String(children).includes('\n')

            if (isInline) {
              return (
                <code
                  className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground"
                  {...props}
                >
                  {children}
                </code>
              )
            }

            return (
              <CodeBlock language={match ? match[1] : ''}>
                {String(children).replace(/\n$/, '')}
              </CodeBlock>
            )
          },
          li({ children, ...props }) {
            const text = React.Children.toArray(children).join('')
            const isOption = /^[A-Z1-9][.)]\s/.test(text)

            if (isOption) {
              const marker = text.split(/[.)]\s/)[0]
              const content = text.split(/[.)]\s/).slice(1).join(') ')
              return (
                <li className="list-none ml-0">
                  <OptionCard marker={marker} content={content} />
                </li>
              )
            }

            return (
              <li className="my-1.5" {...props}>
                {children}
              </li>
            )
          },
          p({ children, ...props }) {
            const text = React.Children.toArray(children).join('')
            
            // Multi-option detection
            const multiOptionMatch = text.match(/[A-Z1-9][.)]\s/g)
            if (multiOptionMatch && multiOptionMatch.length > 1) {
              const parts = text.split(/([A-Z1-9][.)]\s)/).filter(Boolean)
              const options = []
              for (let i = 0; i < parts.length; i += 2) {
                if (parts[i] && parts[i+1]) {
                  options.push({
                    marker: parts[i].trim().replace(/[.)]$/, ''),
                    content: parts[i+1].trim()
                  })
                }
              }

              if (options.length > 0) {
                return (
                  <div className="flex flex-col gap-0.5 my-2">
                    {options.map((opt, idx) => (
                      <OptionCard key={idx} marker={opt.marker} content={opt.content} />
                    ))}
                  </div>
                )
              }
            }

            // Single option detection
            const isOption = /^[A-Z1-9][.)]\s/.test(text)
            if (isOption) {
              const marker = text.split(/[.)]\s/)[0]
              const content = text.split(/[.)]\s/).slice(1).join(') ')
              return <OptionCard marker={marker} content={content} />
            }
            return <p className="mb-4 last:mb-0 leading-relaxed" {...props}>{children}</p>
          },
          pre({ children }) {
            return <>{children}</>
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:text-primary/80"
              >
                {children}
              </a>
            )
          },
          ul({ children, ...props }) {
            return <ul className="my-4 ml-6 list-disc space-y-2" {...props}>{children}</ul>
          },
          ol({ children, ...props }) {
            return <ol className="my-4 ml-6 list-decimal space-y-2" {...props}>{children}</ol>
          },
          blockquote({ children, ...props }) {
            return (
              <blockquote 
                className="my-4 border-l-4 border-primary/30 bg-muted/10 px-4 py-2 italic text-muted-foreground rounded-r-lg"
                {...props}
              >
                {children}
              </blockquote>
            )
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
