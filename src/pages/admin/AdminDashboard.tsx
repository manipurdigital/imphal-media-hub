import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Users, FolderOpen, Tags } from 'lucide-react';

export const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const [videos, users, collections, categories] = await Promise.all([
        supabase.from('videos').select('id', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('collections').select('id', { count: 'exact', head: true }),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
      ]);

      return {
        videos: videos.count || 0,
        users: users.count || 0,
        collections: collections.count || 0,
        categories: categories.count || 0,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Videos',
      value: stats?.videos || 0,
      icon: Video,
      description: 'Videos in your library',
    },
    {
      title: 'Total Users',
      value: stats?.users || 0,
      icon: Users,
      description: 'Registered users',
    },
    {
      title: 'Collections',
      value: stats?.collections || 0,
      icon: FolderOpen,
      description: 'Video collections',
    },
    {
      title: 'Categories',
      value: stats?.categories || 0,
      icon: Tags,
      description: 'Content categories',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your OTT platform</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Activity tracking coming soon...</p>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Use the sidebar to navigate to different admin sections:
            </p>
            <ul className="text-sm space-y-1">
              <li>• Manage videos and uploads</li>
              <li>• View and manage users</li>
              <li>• Organize content collections</li>
              <li>• Configure categories</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};