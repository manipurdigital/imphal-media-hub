import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

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
}

interface SubscriptionPlanFormProps {
  plan: SubscriptionPlan | null;
  onClose: () => void;
}

export const SubscriptionPlanForm: React.FC<SubscriptionPlanFormProps> = ({
  plan,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    name: plan?.name || '',
    description: plan?.description || '',
    price: plan?.price || 0,
    currency: plan?.currency || 'INR',
    billing_cycle: plan?.billing_cycle || 'monthly',
    stripe_price_id: plan?.stripe_price_id || '',
    is_active: plan?.is_active ?? true,
    is_featured: plan?.is_featured ?? false,
    display_order: plan?.display_order || 0,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const savePlanMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Ensure currency is always INR
      const planData = { ...data, currency: 'INR' };
      
      if (plan) {
        const { error } = await supabase
          .from('subscription_plans')
          .update(planData)
          .eq('id', plan.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('subscription_plans')
          .insert([planData]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: `Subscription plan ${plan ? 'updated' : 'created'} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to ${plan ? 'update' : 'create'} plan: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    savePlanMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {plan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Basic, Premium, Enterprise"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => handleInputChange('display_order', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what this plan includes..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                placeholder="999.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing_cycle">Billing Cycle</Label>
              <Select
                value={formData.billing_cycle}
                onValueChange={(value) => handleInputChange('billing_cycle', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="one-time">One-time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stripe_price_id">Stripe Price ID</Label>
            <Input
              id="stripe_price_id"
              value={formData.stripe_price_id}
              onChange={(e) => handleInputChange('stripe_price_id', e.target.value)}
              placeholder="price_1234567890"
            />
            <p className="text-xs text-muted-foreground">
              Optional: Enter the Stripe Price ID for integration with Stripe checkout
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              />
              <Label htmlFor="is_active">Active Plan</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) => handleInputChange('is_featured', checked)}
              />
              <Label htmlFor="is_featured">Featured Plan</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={savePlanMutation.isPending}>
              {savePlanMutation.isPending
                ? 'Saving...'
                : plan
                ? 'Update Plan'
                : 'Create Plan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};