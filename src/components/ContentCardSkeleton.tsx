import { Skeleton } from "@/components/ui/loading-skeleton";

interface ContentCardSkeletonProps {
  count?: number;
}

const ContentCardSkeleton = ({ count = 1 }: ContentCardSkeletonProps) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="min-w-[200px] md:min-w-[250px] space-y-3 animate-fade-in-scale"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          {/* Enhanced Thumbnail Skeleton */}
          <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-border/30">
            <Skeleton className="w-full h-full shimmer-effect" />
            
            {/* Rating Badge Skeleton */}
            <div className="absolute top-2 right-2">
              <Skeleton className="w-12 h-6 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            </div>

            {/* Play Button Skeleton */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Skeleton className="w-16 h-16 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
          
          {/* Enhanced Content Info Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4 animate-pulse" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-3 w-12 animate-pulse" style={{ animationDelay: '0.1s' }} />
              <Skeleton className="h-3 w-8 animate-pulse" style={{ animationDelay: '0.2s' }} />
              <Skeleton className="h-3 w-16 animate-pulse" style={{ animationDelay: '0.3s' }} />
            </div>
            <div className="flex space-x-2 pt-2">
              <Skeleton className="w-8 h-8 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              <Skeleton className="w-8 h-8 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
              <Skeleton className="w-8 h-8 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default ContentCardSkeleton;