import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowLeft, Star, Crown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_cycle: 'monthly' | 'yearly' | 'one-time';
  is_featured: boolean;
  features: string[];
}

const Subscribe = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Subscribe | Imoinu OTT';
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      
      // Mock features for demo (you can store these in the database)
      const plansWithFeatures = data?.map(plan => ({
        ...plan,
        features: [
          'Unlimited streaming',
          'HD Quality',
          'Multiple devices',
          'Offline downloads',
          plan.name.toLowerCase().includes('premium') ? 'Early access to new releases' : 'Access to exclusive content',
          plan.name.toLowerCase().includes('premium') ? '4K Ultra HD' : 'Ad-free experience'
        ]
      })) || [];
      
      setPlans(plansWithFeatures);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subscription plans',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to subscribe',
        variant: 'destructive',
      });
      return;
    }

    setProcessingPlan(planId);
    
    try {
      // Create Razorpay checkout session
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: { planId }
      });

      if (error) throw error;

      toast({
        title: 'Redirecting to Payment',
        description: 'Please complete your payment to activate your subscription',
      });

      // In a real implementation, you would redirect to Razorpay checkout
      // For now, we'll simulate success
      setTimeout(() => {
        toast({
          title: 'Subscription Activated!',
          description: 'Welcome to Imoinu Premium! Enjoy unlimited streaming.',
        });
        // Redirect to home page
        window.location.href = '/';
      }, 2000);

    } catch (error: any) {
      console.error('Subscription error:', error);
      toast({
        title: 'Subscription Failed',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setProcessingPlan(null);
    }
  };

  const formatPrice = (price: number, currency: string, cycle: string) => {
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency.toUpperCase(),
    });
    
    const formattedPrice = formatter.format(price);
    return cycle === 'yearly' ? `${formattedPrice}/year` : `${formattedPrice}/month`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Link to="/">
              <Button variant="ghost" className="mb-6 flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Unlock unlimited streaming with exclusive content and premium features
            </p>
          </div>

          {/* Subscription Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative transition-all duration-300 hover:scale-105 ${
                  plan.is_featured 
                    ? 'border-primary shadow-lg shadow-primary/20' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {plan.is_featured && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1 flex items-center gap-1">
                      <Crown className="h-3 w-3" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                    {plan.is_featured && <Star className="h-5 w-5 text-primary" />}
                    {plan.name}
                  </CardTitle>
                  <div className="text-3xl font-bold text-primary mt-4">
                    {formatPrice(plan.price, plan.currency, plan.billing_cycle)}
                  </div>
                  {plan.description && (
                    <p className="text-muted-foreground mt-2">{plan.description}</p>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={processingPlan === plan.id}
                    className={`w-full mt-6 ${
                      plan.is_featured 
                        ? 'bg-primary hover:bg-primary/90' 
                        : ''
                    }`}
                    variant={plan.is_featured ? 'default' : 'outline'}
                  >
                    {processingPlan === plan.id ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        Processing...
                      </div>
                    ) : (
                      'Subscribe Now'
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Features Section */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-8">
              Why Choose Imoinu Premium?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Star className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Exclusive Content</h3>
                <p className="text-muted-foreground">
                  Access to premium shows and movies you won't find anywhere else
                </p>
              </div>
              <div className="space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Crown className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Ad-Free Experience</h3>
                <p className="text-muted-foreground">
                  Enjoy uninterrupted streaming without any advertisements
                </p>
              </div>
              <div className="space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Check className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Multiple Devices</h3>
                <p className="text-muted-foreground">
                  Stream on your TV, laptop, tablet, and phone with one account
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscribe;