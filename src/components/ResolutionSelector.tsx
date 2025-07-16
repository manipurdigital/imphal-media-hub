import React from 'react';
import { Monitor, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { VideoResolution } from '@/hooks/useVideoResolutions';

interface ResolutionSelectorProps {
  resolutions: VideoResolution[];
  currentResolution: VideoResolution | null;
  onResolutionChange: (resolution: VideoResolution) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const ResolutionSelector: React.FC<ResolutionSelectorProps> = ({
  resolutions,
  currentResolution,
  onResolutionChange,
  isLoading = false,
  disabled = false,
}) => {
  if (resolutions.length <= 1) {
    return null;
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return ` (${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]})`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled || isLoading}
          className="h-8 px-2 text-white hover:bg-white/20 focus:bg-white/20"
        >
          <Monitor className="h-4 w-4 mr-1" />
          <span className="text-sm">
            {currentResolution?.resolution || 'Quality'}
          </span>
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="bg-background/95 backdrop-blur-sm border-border/50"
      >
        {resolutions.map((resolution) => (
          <DropdownMenuItem
            key={resolution.id}
            onClick={() => onResolutionChange(resolution)}
            className={`cursor-pointer ${
              currentResolution?.id === resolution.id 
                ? 'bg-accent text-accent-foreground' 
                : 'hover:bg-accent/50'
            }`}
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-medium">{resolution.resolution}</span>
                <span className="text-sm text-muted-foreground">
                  {resolution.quality_label}
                </span>
              </div>
              {resolution.file_size && (
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(resolution.file_size)}
                </span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};