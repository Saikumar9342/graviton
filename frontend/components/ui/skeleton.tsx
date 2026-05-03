import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('bg-muted/20 animate-pulse rounded-md backdrop-blur-[2px]', className)}
      {...props}
    />
  )
}

export { Skeleton }
