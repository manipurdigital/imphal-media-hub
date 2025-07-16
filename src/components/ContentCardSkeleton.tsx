import { Skeleton } from "@/components/ui/loading-skeleton";

const ContentCardSkeleton = () => {
  return (
    <div className="min-w-[200px] md:min-w-[250px] space-y-3">
      {/* Thumbnail Skeleton */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
        <Skeleton className="w-full h-full" />
        
        {/* Rating Badge Skeleton */}
        <div className="absolute top-2 right-2">
          <Skeleton className="w-12 h-6 rounded-full" />
        </div>
      </div>
      
      {/* Content Info Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
};

export default ContentCardSkeleton;