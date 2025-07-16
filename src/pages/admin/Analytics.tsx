import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Video, 
  Eye,
  Calendar,
  Star,
  Play,
  Clock
} from 'lucide-react';
import { useState } from 'react';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

export const Analytics = () => {
  const [timeRange, setTimeRange] = useState('30d');

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', timeRange],
    queryFn: async () => {
      // Get basic stats
      const [videos, users, collections, categories] = await Promise.all([
        supabase.from('videos').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('collections').select('*'),
        supabase.from('categories').select('*'),
      ]);

      // Get video statistics
      const topVideos = await supabase
        .from('videos')
        .select('title, view_count, rating, content_type')
        .order('view_count', { ascending: false })
        .limit(10);

      // Mock time-based data (in real app, this would come from actual analytics)
      const dailyViews = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
          date: date.toISOString().split('T')[0],
          views: Math.floor(Math.random() * 1000) + 500,
          users: Math.floor(Math.random() * 200) + 100,
        };
      });

      // Content type distribution
      const contentTypes = videos.data?.reduce((acc: any, video) => {
        const type = video.content_type || 'movie';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      const contentTypeData = Object.entries(contentTypes || {}).map(([type, count]) => ({
        name: type,
        value: count,
      }));

      // Genre distribution
      const genres = videos.data?.reduce((acc: any, video) => {
        const genre = video.genre;
        acc[genre] = (acc[genre] || 0) + 1;
        return acc;
      }, {});

      const genreData = Object.entries(genres || {}).map(([genre, count]) => ({
        genre,
        count,
      }));

      // User engagement metrics
      const totalViews = videos.data?.reduce((sum, video) => sum + (video.view_count || 0), 0) || 0;
      const avgRating = videos.data?.reduce((sum, video) => sum + (video.rating || 0), 0) / (videos.data?.length || 1) || 0;
      const publishedVideos = videos.data?.filter(v => v.content_status === 'published').length || 0;
      
      return {
        overview: {
          totalVideos: videos.data?.length || 0,
          totalUsers: users.data?.length || 0,
          totalCollections: collections.data?.length || 0,
          totalCategories: categories.data?.length || 0,
          totalViews,
          avgRating: avgRating.toFixed(1),
          publishedVideos,
        },
        topVideos: topVideos.data || [],
        dailyViews,
        contentTypeData,
        genreData: genreData.slice(0, 8), // Top 8 genres
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

  const overviewCards = [
    {
      title: 'Total Views',
      value: analytics?.overview.totalViews.toLocaleString() || '0',
      icon: Eye,
      description: 'Total video views',
      trend: '+12.5%',
      color: 'text-blue-600',
    },
    {
      title: 'Active Users',
      value: analytics?.overview.totalUsers.toLocaleString() || '0',
      icon: Users,
      description: 'Registered users',
      trend: '+8.2%',
      color: 'text-green-600',
    },
    {
      title: 'Published Videos',
      value: analytics?.overview.publishedVideos.toLocaleString() || '0',
      icon: Video,
      description: 'Live content',
      trend: '+15.3%',
      color: 'text-purple-600',
    },
    {
      title: 'Average Rating',
      value: analytics?.overview.avgRating || '0.0',
      icon: Star,
      description: 'Content quality',
      trend: '+0.2',
      color: 'text-yellow-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Platform performance and insights</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {overviewCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="interactive-scale">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  {card.trend} from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Daily Views Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Daily Views & Users</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics?.dailyViews}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="views" stackId="1" stroke="#8884d8" fill="#8884d8" />
                <Area type="monotone" dataKey="users" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Content Type Distribution */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Content Types</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics?.contentTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics?.contentTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Genre Distribution & Top Videos */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Genre Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Genres</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.genreData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="genre" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Videos */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.topVideos.slice(0, 6).map((video, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium line-clamp-1">{video.title}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {video.content_type}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {video.rating || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{(video.view_count || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">views</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Video className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="font-medium">New video uploaded</p>
                <p className="text-sm text-muted-foreground">Shadow Hunter was added to the library</p>
              </div>
              <div className="ml-auto text-sm text-muted-foreground">2 hours ago</div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="font-medium">New user registered</p>
                <p className="text-sm text-muted-foreground">5 new users joined today</p>
              </div>
              <div className="ml-auto text-sm text-muted-foreground">4 hours ago</div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                <Play className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <p className="font-medium">High engagement</p>
                <p className="text-sm text-muted-foreground">Action movies collection hit 10K views</p>
              </div>
              <div className="ml-auto text-sm text-muted-foreground">6 hours ago</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};