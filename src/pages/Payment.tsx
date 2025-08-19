import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, Shield, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Payment = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  
  // Get content info from URL params
  const contentId = searchParams.get('contentId');
  const contentTitle = searchParams.get('title') || 'Premium Content';
  const contentPrice = searchParams.get('price') || '99';
  const contentCurrency = searchParams.get('currency') || 'INR';

  useEffect(() => {
    document.title = 'Payment | Imoinu OTT';
    
    // Redirect if user is not authenticated
    if (!user) {
      navigate('/auth?tab=signin');
    }
  }, [user, navigate]);

  const handlePayment = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to continue with payment',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Payment Successful!',
        description: `You now have access to ${contentTitle}`,
      });
      
      // Redirect back to content or home
      navigate('/');
      
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: string, currency: string) => {
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency.toUpperCase(),
    });
    return formatter.format(parseFloat(price));
  };

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/">
              <Button variant="ghost" className="mb-6 flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Complete Your Purchase
            </h1>
            <p className="text-muted-foreground">
              Secure payment for premium content access
            </p>
          </div>

          {/* Content Summary */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{contentTitle}</h3>
                  <p className="text-sm text-muted-foreground">Premium Pay-Per-View Content</p>
                </div>
                <Badge variant="secondary">PPV</Badge>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total Amount</span>
                  <span className="text-primary">{formatPrice(contentPrice, contentCurrency)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  One-time payment • Instant access
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="border rounded-lg p-4 bg-primary/5 border-primary">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded text-white text-xs font-bold flex items-center justify-center">
                      RAZOR
                    </div>
                    <div>
                      <h4 className="font-semibold">Razorpay</h4>
                      <p className="text-xs text-muted-foreground">
                        Cards, UPI, Net Banking, Wallets
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">Secure Payment</h4>
                    <p className="text-xs text-muted-foreground">
                      Your payment information is encrypted and secure. We don't store your card details.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Button */}
          <div className="space-y-4">
            <Button
              onClick={handlePayment}
              disabled={loading}
              className="w-full text-lg py-6"
              size="lg"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                  Processing Payment...
                </div>
              ) : (
                <>
                  <CreditCard className="h-5 w-5 mr-2" />
                  Pay {formatPrice(contentPrice, contentCurrency)}
                </>
              )}
            </Button>
            
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                By proceeding, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="mt-8 space-y-3">
            <h3 className="font-semibold text-center">What you get:</h3>
            <div className="grid grid-cols-1 gap-2">
              {[
                'Instant access to premium content',
                'High-definition streaming',
                'Watch on any device',
                '30-day access period'
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;