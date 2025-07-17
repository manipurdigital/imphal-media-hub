import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, RefreshCw, Calendar, CreditCard } from 'lucide-react';

interface SubscriptionData {
  id: string;
  status: string;
  plan: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    currency: string;
    billing_cycle: string;
  };
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
  updatedAt: string;
}

interface SubscriptionStatusProps {
  onSubscriptionUpdate?: (isSubscribed: boolean) => void;
}

export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({ 
  onSubscriptionUpdate 
}) => {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;

      setIsSubscribed(data.isSubscribed);
      setSubscription(data.subscription);
      onSubscriptionUpdate?.(data.isSubscribed);
    } catch (error) {
      console.error('Error checking subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to check subscription status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshSubscription = async () => {
    setRefreshing(true);
    await checkSubscription();
  };

  useEffect(() => {
    checkSubscription();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'expired':
        return 'bg-red-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getBillingCycleLabel = (cycle: string) => {
    switch (cycle) {
      case 'monthly':
        return 'Monthly';
      case 'yearly':
        return 'Yearly';
      case 'one-time':
        return 'One-time';
      default:
        return cycle;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking subscription status...</p>
        </CardContent>
      </Card>
    );
  }

  if (!isSubscribed || !subscription) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Active Subscription</h3>
          <p className="text-muted-foreground mb-4">
            Subscribe to access premium content and features
          </p>
          <Button onClick={refreshSubscription} disabled={refreshing}>
            {refreshing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Subscription Status</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshSubscription}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">{subscription.plan.name}</h3>
            <p className="text-sm text-muted-foreground">
              {subscription.plan.description || `${subscription.plan.name} subscription`}
            </p>
          </div>
          <Badge className={getStatusColor(subscription.status)}>
            {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <span className="font-medium">Plan:</span>
              <span className="ml-2">{subscription.plan.name}</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="font-medium">Price:</span>
              <span className="ml-2">
                {formatPrice(subscription.plan.price, subscription.plan.currency)}
              </span>
            </div>
            <div className="flex items-center text-sm">
              <span className="font-medium">Billing:</span>
              <span className="ml-2">
                {getBillingCycleLabel(subscription.plan.billing_cycle)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-2" />
              <span className="font-medium">Started:</span>
              <span className="ml-2">
                {formatDate(subscription.currentPeriodStart)}
              </span>
            </div>
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-2" />
              <span className="font-medium">
                {subscription.status === 'active' ? 'Ends:' : 'Ended:'}
              </span>
              <span className="ml-2">
                {formatDate(subscription.currentPeriodEnd)}
              </span>
            </div>
          </div>
        </div>

        {subscription.status === 'active' && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              Your subscription is active and you have access to all premium features.
            </p>
          </div>
        )}

        {subscription.status === 'expired' && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              Your subscription has expired. Please renew to continue accessing premium content.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};