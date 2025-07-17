import { useState } from 'react';
import { Plus, Edit, Trash2, Star, Eye, EyeOff, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SubscriptionPlanForm } from '@/components/admin/SubscriptionPlanForm';
import { PlanFeatureAssignment } from '@/components/admin/PlanFeatureAssignment';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  billing_cycle: 'monthly' | 'yearly' | 'one-time';
  stripe_price_id: string | null;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const SubscriptionPlansManagement = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [assigningFeatures, setAssigningFeatures] = useState<SubscriptionPlan | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as SubscriptionPlan[];
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Subscription plan deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete plan: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const togglePlanStatusMutation = useMutation({
    mutationFn: async ({ planId, isActive }: { planId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active: !isActive })
        .eq('id', planId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Plan status updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update plan status: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setIsFormOpen(true);
  };

  const handleDelete = (planId: string) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      deletePlanMutation.mutate(planId);
    }
  };

  const handleToggleStatus = (plan: SubscriptionPlan) => {
    togglePlanStatusMutation.mutate({ planId: plan.id, isActive: plan.is_active });
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Subscription Plans</h1>
          <p className="text-muted-foreground">
            Manage your subscription plans and pricing
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingPlan(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Plan
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className={`relative ${plan.is_featured ? 'border-primary' : ''}`}>
              {plan.is_featured && (
                <div className="absolute -top-2 left-4">
                  <Badge className="bg-primary text-primary-foreground">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                </div>
              )}
              
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl font-bold text-primary">
                        {formatPrice(plan.price, plan.currency)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        /{getBillingCycleLabel(plan.billing_cycle)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {plan.description || 'No description provided'}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Billing Cycle:</span> {getBillingCycleLabel(plan.billing_cycle)}
                  </div>
                  {plan.stripe_price_id && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Stripe Price ID:</span> {plan.stripe_price_id}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(plan)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(plan)}
                    className="flex items-center gap-1"
                  >
                    {plan.is_active ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                    {plan.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAssigningFeatures(plan)}
                    className="flex items-center gap-1"
                  >
                    <Star className="h-3 w-3" />
                    Features
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(plan.id)}
                    className="flex items-center gap-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {plans.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No subscription plans found</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first subscription plan
            </p>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {isFormOpen && (
        <SubscriptionPlanForm
          plan={editingPlan}
          onClose={() => {
            setIsFormOpen(false);
            setEditingPlan(null);
          }}
        />
      )}

      {assigningFeatures && (
        <PlanFeatureAssignment
          plan={assigningFeatures}
          onClose={() => setAssigningFeatures(null)}
        />
      )}
    </div>
  );
};