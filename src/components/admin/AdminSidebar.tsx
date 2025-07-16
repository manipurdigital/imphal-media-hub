import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Video, 
  Users, 
  FolderOpen, 
  Tags, 
  Settings,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Videos',
    href: '/admin/videos',
    icon: Video,
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Collections',
    href: '/admin/collections',
    icon: FolderOpen,
  },
  {
    title: 'Categories',
    href: '/admin/categories',
    icon: Tags,
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export const AdminSidebar = () => {
  const location = useLocation();

  return (
    <div className="w-64 bg-card border-r border-border h-full">
      <div className="p-6">
        <h2 className="text-xl font-bold text-foreground">Admin Panel</h2>
      </div>
      <nav className="px-4 space-y-2">
        {sidebarItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};