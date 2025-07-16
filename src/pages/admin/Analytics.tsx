import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  AreaChart,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Video, 
  Eye,
  Calendar,
  Star,
  Play,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Activity,
  Target,
  UserCheck,
  PlayCircle,
  Pause,
  SkipForward,
  Heart,
  Share2,
  Download,
  TrendingDown
} from 'lucide-react';
import { useState } from 'react';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0', '#ffb347'];

export const Analytics = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('views');

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', timeRange],
    queryFn: async () => {
      // Get comprehensive analytics data
      const [videos, users, collections, categories] = await Promise.all([
        supabase.from('videos').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('collections').select('*'),
        supabase.from('categories').select('*'),
      ]);

      // Enhanced video statistics
      const topVideos = await supabase
        .from('videos')
        .select('title, view_count, rating, content_type, created_at, duration')
        .order('view_count', { ascending: false })
        .limit(10);

      // Mock enhanced analytics data (in production, this would come from actual tracking)
      const dailyViews = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
          date: date.toISOString().split('T')[0],
          views: Math.floor(Math.random() * 1000) + 500,
          users: Math.floor(Math.random() * 200) + 100,
          sessions: Math.floor(Math.random() * 300) + 150,
          avgWatchTime: Math.floor(Math.random() * 1200) + 300, // seconds
          bounceRate: Math.random() * 0.4 + 0.1, // 10-50%
          completionRate: Math.random() * 0.6 + 0.4, // 40-100%
        };
      });

      // User behavior patterns
      const userBehavior = {
        avgSessionDuration: 1847, // seconds
        avgVideosPerSession: 3.4,
        returnVisitorRate: 0.68,
        mobileUsage: 0.45,
        desktopUsage: 0.42,
        tabletUsage: 0.13,
        peakHours: [19, 20, 21, 22], // 7-10 PM
        topCountries: [
          { country: 'United States', users: 2340, percentage: 34.2 },
          { country: 'India', users: 1876, percentage: 27.4 },
          { country: 'United Kingdom', users: 945, percentage: 13.8 },
          { country: 'Canada', users: 567, percentage: 8.3 },
          { country: 'Australia', users: 423, percentage: 6.2 },
        ],
      };

      // Content engagement metrics
      const contentEngagement = {
        likeRate: 0.78,
        shareRate: 0.23,
        commentRate: 0.12,
        favoriteRate: 0.34,
        downloadRate: 0.15,
        replayRate: 0.41,
      };

      // User journey analytics
      const userJourney = [
        { step: 'Homepage', users: 10000, dropoff: 0.15 },
        { step: 'Category Browse', users: 8500, dropoff: 0.12 },
        { step: 'Video Selection', users: 7480, dropoff: 0.08 },
        { step: 'Video Start', users: 6881, dropoff: 0.25 },
        { step: 'Video 25%', users: 5161, dropoff: 0.18 },
        { step: 'Video 50%', users: 4232, dropoff: 0.15 },
        { step: 'Video 75%', users: 3597, dropoff: 0.12 },
        { step: 'Video Complete', users: 3165, dropoff: 0.05 },
        { step: 'Next Video', users: 3007, dropoff: 0 },
      ];

      // Device and browser analytics
      const deviceData = [
        { device: 'Mobile', users: 45.2, sessions: 52.1, avgTime: 1245 },
        { device: 'Desktop', users: 42.1, sessions: 38.7, avgTime: 2134 },
        { device: 'Tablet', users: 12.7, sessions: 9.2, avgTime: 1876 },
      ];

      const browserData = [
        { browser: 'Chrome', share: 68.4, performance: 95 },
        { browser: 'Safari', share: 15.2, performance: 92 },
        { browser: 'Firefox', share: 8.9, performance: 89 },
        { browser: 'Edge', share: 5.1, performance: 87 },
        { browser: 'Opera', share: 2.4, performance: 85 },
      ];

      // Content performance radar
      const contentPerformance = [
        { category: 'Action', views: 85, engagement: 78, retention: 72 },
        { category: 'Comedy', views: 92, engagement: 88, retention: 85 },
        { category: 'Drama', views: 78, engagement: 82, retention: 89 },
        { category: 'Horror', views: 65, engagement: 70, retention: 68 },
        { category: 'Romance', views: 71, engagement: 75, retention: 77 },
        { category: 'Thriller', views: 88, engagement: 85, retention: 81 },
      ];

      // Time-based usage patterns
      const hourlyUsage = Array.from({ length: 24 }, (_, hour) => ({
        hour: `${hour}:00`,
        users: Math.floor(Math.random() * 500) + 100,
        engagement: Math.random() * 0.8 + 0.2,
      }));

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

      return {
        overview: {
          totalVideos: videos.data?.length || 0,
          totalUsers: users.data?.length || 0,
          totalCollections: collections.data?.length || 0,
          totalCategories: categories.data?.length || 0,
          totalViews: videos.data?.reduce((sum, video) => sum + (video.view_count || 0), 0) || 0,
          avgRating: (videos.data?.reduce((sum, video) => sum + (video.rating || 0), 0) / (videos.data?.length || 1) || 0).toFixed(1),
          publishedVideos: videos.data?.filter(v => v.content_status === 'published').length || 0,
          totalWatchTime: 234567, // minutes
          activeUsers: 1234,
          conversionRate: 0.124,
        },
        topVideos: topVideos.data || [],
        dailyViews,
        contentTypeData,
        genreData: genreData.slice(0, 8), // Top 8 genres
        userBehavior,
        contentEngagement,
        userJourney,
        deviceData,
        browserData,
        contentPerformance,
        hourlyUsage,
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
      value: analytics?.overview.activeUsers.toLocaleString() || '0',
      icon: UserCheck,
      description: 'Monthly active users',
      trend: '+8.2%',
      color: 'text-green-600',
    },
    {
      title: 'Watch Time',
      value: `${Math.floor((analytics?.overview.totalWatchTime || 0) / 60).toLocaleString()}h`,
      icon: Clock,
      description: 'Total watch hours',
      trend: '+22.1%',
      color: 'text-purple-600',
    },
    {
      title: 'Conversion Rate',
      value: `${((analytics?.overview.conversionRate || 0) * 100).toFixed(1)}%`,
      icon: Target,
      description: 'User conversion',
      trend: '+0.8%',
      color: 'text-orange-600',
    },
    {
      title: 'Avg Session',
      value: `${Math.floor((analytics?.userBehavior.avgSessionDuration || 0) / 60)}m`,
      icon: Activity,
      description: 'Average session duration',
      trend: '+5.2%',
      color: 'text-cyan-600',
    },
    {
      title: 'Return Users',
      value: `${((analytics?.userBehavior.returnVisitorRate || 0) * 100).toFixed(0)}%`,
      icon: PlayCircle,
      description: 'Return visitor rate',
      trend: '+3.1%',
      color: 'text-pink-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive platform performance and user insights</p>
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

      {/* Enhanced Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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

      {/* Advanced Analytics Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Platform Activity</CardTitle>
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
                    <Area type="monotone" dataKey="sessions" stackId="1" stroke="#ffc658" fill="#ffc658" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Content Distribution</CardTitle>
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
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Journey Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.userJourney.map((step, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{step.step}</span>
                          <span className="text-sm text-muted-foreground">{step.users.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 mt-1">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(step.users / 10000) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.userBehavior.topCountries.map((country, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{country.country}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{country.users.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{country.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {analytics?.deviceData.map((device, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {device.device === 'Mobile' && <Smartphone className="h-4 w-4" />}
                    {device.device === 'Desktop' && <Monitor className="h-4 w-4" />}
                    {device.device === 'Tablet' && <Tablet className="h-4 w-4" />}
                    {device.device}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Users</span>
                      <span className="text-sm font-medium">{device.users}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Sessions</span>
                      <span className="text-sm font-medium">{device.sessions}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Avg Time</span>
                      <span className="text-sm font-medium">{Math.floor(device.avgTime / 60)}m</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Content Performance Radar</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={analytics?.contentPerformance}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Views" dataKey="views" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Radar name="Engagement" dataKey="engagement" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                    <Radar name="Retention" dataKey="retention" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Videos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.topVideos.slice(0, 8).map((video, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xs">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm line-clamp-1">{video.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
                        <p className="text-sm font-medium">{(video.view_count || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">views</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Engagement Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analytics?.contentEngagement || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {key === 'likeRate' && <Heart className="h-4 w-4 text-red-500" />}
                        {key === 'shareRate' && <Share2 className="h-4 w-4 text-blue-500" />}
                        {key === 'downloadRate' && <Download className="h-4 w-4 text-green-500" />}
                        {key === 'favoriteRate' && <Star className="h-4 w-4 text-yellow-500" />}
                        {key === 'replayRate' && <PlayCircle className="h-4 w-4 text-purple-500" />}
                        {key === 'commentRate' && <Users className="h-4 w-4 text-orange-500" />}
                        <span className="text-sm capitalize">{key.replace('Rate', ' Rate')}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{((value as number) * 100).toFixed(1)}%</div>
                        <div className="w-20 bg-muted rounded-full h-2 mt-1">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(value as number) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hourly Usage Pattern</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics?.hourlyUsage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Technical Tab */}
        <TabsContent value="technical" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Browser Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.browserData.map((browser, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                        <span className="text-sm font-medium">{browser.browser}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{browser.share}%</div>
                        <div className="text-xs text-muted-foreground">Score: {browser.performance}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Load Time</span>
                    <span className="text-sm text-muted-foreground">1.2s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Error Rate</span>
                    <span className="text-sm text-muted-foreground">0.01%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Uptime</span>
                    <span className="text-sm text-muted-foreground">99.9%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">CDN Performance</span>
                    <span className="text-sm text-muted-foreground">Excellent</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};