import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SubscriptionData {
  id: string;
  status: string;
  plan: {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    billing_cycle: string;
  } | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
  updatedAt: string;
}

export const useSubscriptionStatus = () => {
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { user } = useAuth();

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setIsSubscribed(false);
      setSubscription(null);
      return false;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        setIsSubscribed(false);
        setSubscription(null);
        return false;
      }

      setIsSubscribed(data.isSubscribed);
      setSubscription(data.subscription);
      return data.isSubscribed;
    } catch (error) {
      console.error('Error checking subscription:', error);
      setIsSubscribed(false);
      setSubscription(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    isSubscribed,
    subscription,
    loading,
    checkSubscription,
  };
};