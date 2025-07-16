import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'circular' | 'rounded' | 'shimmer'
}

function Skeleton({
  className,
  variant = 'default',
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-muted",
        {
          'default': 'rounded-md',
          'circular': 'rounded-full',
          'rounded': 'rounded-lg',
          'shimmer': 'shimmer bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]'
        }[variant],
        className
      )}
      {...props}
    />
  )
}

// Specialized skeleton components for common use cases
const SkeletonCard = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("space-y-3", className)} {...props}>
    <Skeleton className="h-48 w-full" variant="rounded" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
)

const SkeletonText = ({ 
  lines = 3, 
  className,
  ...props 
}: { lines?: number } & React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("space-y-2", className)} {...props}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={cn(
          "h-4",
          i === lines - 1 ? "w-3/4" : "w-full"
        )}
      />
    ))}
  </div>
)

const SkeletonAvatar = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <Skeleton className={cn("h-10 w-10", className)} variant="circular" {...props} />
)

const SkeletonButton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <Skeleton className={cn("h-10 w-24", className)} variant="rounded" {...props} />
)

export { 
  Skeleton, 
  SkeletonCard, 
  SkeletonText, 
  SkeletonAvatar, 
  SkeletonButton 
}
