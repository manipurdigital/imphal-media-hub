import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const useDirectPayment = () => {
  const { user } = useAuth();
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  const initiateDirectPayment = async (contentId: string, contentTitle: string) => {
    if (!user) {
      window.location.href = '/auth?tab=signup';
      return;
    }

    setProcessingPayment(contentId);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-pay-per-view-order', {
        body: { contentId }
      });

      if (error) throw error;

      // Create Razorpay options
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Imoinu OTT Platform',
        description: `Purchase: ${contentTitle}`,
        order_id: data.orderId,
        handler: function(response: any) {
          // Handle successful payment
          supabase.functions.invoke('verify-pay-per-view-payment', {
            body: {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }
          }).then(({ data: verifyData, error: verifyError }) => {
            if (verifyError) {
              toast({
                title: 'Payment Verification Failed',
                description: 'Please contact support.',
                variant: 'destructive'
              });
            } else {
              toast({
                title: 'Payment Successful!',
                description: 'You now have access to this content.',
              });
              // Redirect to premium page to watch
              window.location.href = '/premium';
            }
          });
        },
        modal: {
          ondismiss: function() {
            setProcessingPayment(null);
          }
        },
        prefill: {
          name: user.user_metadata?.full_name || '',
          email: user.email || ''
        },
        theme: {
          color: '#ef4444'
        }
      };

      // Create Razorpay instance and open checkout
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
      
    } catch (error: any) {
      console.error('Payment initiation failed:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'Unable to initiate payment. Please try again.',
        variant: 'destructive'
      });
      setProcessingPayment(null);
    }
  };

  return {
    initiateDirectPayment,
    processingPayment,
    setProcessingPayment
  };
};