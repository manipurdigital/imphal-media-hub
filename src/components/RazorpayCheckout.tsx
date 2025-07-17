import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CreditCard, Check, Star } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  billing_cycle: 'monthly' | 'yearly' | 'one-time';
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
}

interface RazorpayCheckoutProps {
  plans: SubscriptionPlan[];
  onSubscriptionSuccess?: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const RazorpayCheckout: React.FC<RazorpayCheckoutProps> = ({ 
  plans, 
  onSubscriptionSuccess 
}) => {
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const { toast } = useToast();

  // Load Razorpay script
  const loadRazorpay = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        setRazorpayLoaded(true);
        resolve(true);
      };
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  };

  const handlePayment = async (plan: SubscriptionPlan) => {
    setProcessingPlan(plan.id);

    try {
      // Load Razorpay SDK
      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        throw new Error('Failed to load Razorpay SDK');
      }

      // Create order
      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        'create-razorpay-order',
        {
          body: { planId: plan.id }
        }
      );

      if (orderError) throw orderError;

      // Get user info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Razorpay options
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'KangleiPremiumFlix',
        description: `${plan.name} Subscription`,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          try {
            // Verify payment
            const { data: verificationData, error: verificationError } = await supabase.functions.invoke(
              'verify-razorpay-payment',
              {
                body: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  planId: plan.id,
                }
              }
            );

            if (verificationError) throw verificationError;

            toast({
              title: 'Payment Successful!',
              description: `Your ${plan.name} subscription has been activated.`,
            });

            onSubscriptionSuccess?.();
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast({
              title: 'Payment Verification Failed',
              description: 'Please contact support if payment was deducted.',
              variant: 'destructive',
            });
          }
        },
        modal: {
          ondismiss: () => {
            setProcessingPlan(null);
          }
        },
        prefill: {
          name: user.user_metadata?.full_name || '',
          email: user.email || '',
        },
        theme: {
          color: '#3b82f6',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Payment initiation failed:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'Failed to initiate payment',
        variant: 'destructive',
      });
    } finally {
      setProcessingPlan(null);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const getBillingCycleLabel = (cycle: string) => {
    switch (cycle) {
      case 'monthly':
        return 'month';
      case 'yearly':
        return 'year';
      case 'one-time':
        return 'one-time';
      default:
        return cycle;
    }
  };

  const activePlans = plans.filter(plan => plan.is_active);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Choose Your Plan
        </h2>
        <p className="text-muted-foreground">
          Select the perfect plan for your streaming needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activePlans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative transition-all duration-200 hover:shadow-lg ${
              plan.is_featured 
                ? 'border-primary shadow-md scale-105' 
                : 'border-border'
            }`}
          >
            {plan.is_featured && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-4 py-1">
                  <Star className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}

            <CardHeader className="text-center">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">
                  {formatPrice(plan.price, plan.currency)}
                </div>
                <div className="text-sm text-muted-foreground">
                  per {getBillingCycleLabel(plan.billing_cycle)}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                {plan.description || `Access to ${plan.name} features`}
              </p>

              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span>Unlimited streaming</span>
                </div>
                <div className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span>HD quality videos</span>
                </div>
                <div className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span>Multiple devices</span>
                </div>
                <div className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span>Offline downloads</span>
                </div>
              </div>

              <Button
                onClick={() => handlePayment(plan)}
                disabled={processingPlan === plan.id}
                className="w-full"
                variant={plan.is_featured ? 'default' : 'outline'}
              >
                {processingPlan === plan.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Subscribe Now
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {activePlans.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No plans available</h3>
          <p className="text-muted-foreground">
            Please check back later for available subscription plans.
          </p>
        </div>
      )}
    </div>
  );
};