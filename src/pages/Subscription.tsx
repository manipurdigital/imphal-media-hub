import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RazorpayCheckout } from '@/components/RazorpayCheckout';
import { SubscriptionStatus } from '@/components/SubscriptionStatus';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, User, Home, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  billing_cycle: 'monthly' | 'yearly' | 'one-time';
  razorpay_plan_id: string | null;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
}

const Subscription = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as SubscriptionPlan[];
    },
  });

  const handleSubscriptionSuccess = () => {
    setIsSubscribed(true);
    setRefreshKey(prev => prev + 1);
  };

  const handleSubscriptionUpdate = (subscribed: boolean) => {
    setIsSubscribed(subscribed);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Link to="/">
              <Button variant="ghost" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Subscription Management
            </h1>
            <p className="text-muted-foreground">
              Manage your subscription and upgrade your streaming experience
            </p>
          </div>

          <Tabs defaultValue="plans" className="space-y-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="plans" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Plans
              </TabsTrigger>
              <TabsTrigger value="status" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                My Subscription
              </TabsTrigger>
            </TabsList>

            <TabsContent value="plans">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Available Plans
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {plans.length > 0 ? (
                    <RazorpayCheckout
                      plans={plans}
                      onSubscriptionSuccess={handleSubscriptionSuccess}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No plans available</h3>
                      <p className="text-muted-foreground">
                        Please check back later for available subscription plans.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="status">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Subscription Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SubscriptionStatus
                    key={refreshKey}
                    onSubscriptionUpdate={handleSubscriptionUpdate}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Subscription;