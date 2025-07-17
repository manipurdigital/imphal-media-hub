import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user?: {
    full_name?: string | null;
    username?: string | null;
    email?: string;
    avatar_url?: string | null;
  } | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function UserAvatar({ user, size = "md", className }: UserAvatarProps) {
  const getInitials = (user: UserAvatarProps['user']): string => {
    if (!user) return "U";
    
    // Try full_name first
    if (user.full_name?.trim()) {
      const names = user.full_name.trim().split(/\s+/);
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    
    // Try username
    if (user.username?.trim()) {
      return user.username.trim()[0].toUpperCase();
    }
    
    // Fallback to email
    if (user.email?.trim()) {
      return user.email.trim()[0].toUpperCase();
    }
    
    return "U";
  };

  const sizeClasses = {
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-base",
    lg: "h-16 w-16 text-xl"
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {user?.avatar_url && (
        <AvatarImage 
          src={user.avatar_url} 
          alt={user.full_name || user.username || "User"} 
        />
      )}
      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold">
        {getInitials(user)}
      </AvatarFallback>
    </Avatar>
  );
}