import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Hash, Type, Star } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  billing_cycle: 'monthly' | 'yearly' | 'one-time';
}

interface PlanFeature {
  id: string;
  name: string;
  description: string | null;
  feature_type: 'boolean' | 'number' | 'text';
  unit: string | null;
  is_active: boolean;
}

interface PlanFeatureAssignment {
  id: string;
  plan_id: string;
  feature_id: string;
  feature_value: any;
  plan_features: PlanFeature;
}

interface PlanFeatureAssignmentProps {
  plan: SubscriptionPlan;
  onClose: () => void;
}

export const PlanFeatureAssignment: React.FC<PlanFeatureAssignmentProps> = ({
  plan,
  onClose,
}) => {
  const [featureValues, setFeatureValues] = useState<Record<string, any>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: features = [] } = useQuery({
    queryKey: ['plan-features'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plan_features')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as PlanFeature[];
    },
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['plan-feature-assignments', plan.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plan_feature_assignments')
        .select(`
          *,
          plan_features (*)
        `)
        .eq('plan_id', plan.id);
      
      if (error) throw error;
      return data as PlanFeatureAssignment[];
    },
    enabled: !!plan.id,
  });

  // Initialize feature values from existing assignments
  useState(() => {
    const values: Record<string, any> = {};
    assignments.forEach(assignment => {
      values[assignment.feature_id] = assignment.feature_value;
    });
    setFeatureValues(values);
  });

  const saveAssignmentMutation = useMutation({
    mutationFn: async (data: { feature_id: string; feature_value: any }) => {
      const { error } = await supabase
        .from('plan_feature_assignments')
        .upsert({
          plan_id: plan.id,
          feature_id: data.feature_id,
          feature_value: data.feature_value,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Feature assignment saved successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['plan-feature-assignments', plan.id] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to save assignment: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const removeAssignmentMutation = useMutation({
    mutationFn: async (featureId: string) => {
      const { error } = await supabase
        .from('plan_feature_assignments')
        .delete()
        .eq('plan_id', plan.id)
        .eq('feature_id', featureId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Feature assignment removed successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['plan-feature-assignments', plan.id] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to remove assignment: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleFeatureToggle = (featureId: string, enabled: boolean) => {
    if (enabled) {
      const feature = features.find(f => f.id === featureId);
      if (feature) {
        let defaultValue: any;
        switch (feature.feature_type) {
          case 'boolean':
            defaultValue = true;
            break;
          case 'number':
            defaultValue = 1;
            break;
          case 'text':
            defaultValue = '';
            break;
        }
        setFeatureValues(prev => ({ ...prev, [featureId]: defaultValue }));
        saveAssignmentMutation.mutate({ feature_id: featureId, feature_value: defaultValue });
      }
    } else {
      setFeatureValues(prev => {
        const newValues = { ...prev };
        delete newValues[featureId];
        return newValues;
      });
      removeAssignmentMutation.mutate(featureId);
    }
  };

  const handleFeatureValueChange = (featureId: string, value: any) => {
    setFeatureValues(prev => ({ ...prev, [featureId]: value }));
    saveAssignmentMutation.mutate({ feature_id: featureId, feature_value: value });
  };

  const getFeatureTypeIcon = (type: string) => {
    switch (type) {
      case 'boolean':
        return <Check className="h-4 w-4" />;
      case 'number':
        return <Hash className="h-4 w-4" />;
      case 'text':
        return <Type className="h-4 w-4" />;
      default:
        return <Star className="h-4 w-4" />;
    }
  };

  const isFeatureAssigned = (featureId: string) => {
    return featureId in featureValues;
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Manage Features for {plan.name}
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{formatPrice(plan.price, plan.currency)}</span>
            <span>•</span>
            <span className="capitalize">{plan.billing_cycle}</span>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {features.map((feature) => {
            const isAssigned = isFeatureAssigned(feature.id);
            const currentValue = featureValues[feature.id];

            return (
              <Card key={feature.id} className={isAssigned ? 'border-primary' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getFeatureTypeIcon(feature.feature_type)}
                      <CardTitle className="text-base">{feature.name}</CardTitle>
                      {feature.unit && (
                        <Badge variant="secondary" className="text-xs">
                          {feature.unit}
                        </Badge>
                      )}
                    </div>
                    <Switch
                      checked={isAssigned}
                      onCheckedChange={(enabled) => handleFeatureToggle(feature.id, enabled)}
                    />
                  </div>
                  {feature.description && (
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  )}
                </CardHeader>

                {isAssigned && (
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <Label>Feature Value</Label>
                      {feature.feature_type === 'boolean' ? (
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={currentValue === true}
                            onCheckedChange={(checked) => 
                              handleFeatureValueChange(feature.id, checked)
                            }
                          />
                          <span className="text-sm">
                            {currentValue === true ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      ) : feature.feature_type === 'number' ? (
                        <Input
                          type="number"
                          value={currentValue || ''}
                          onChange={(e) => 
                            handleFeatureValueChange(feature.id, parseInt(e.target.value) || 0)
                          }
                          placeholder={`Enter ${feature.unit || 'number'}`}
                        />
                      ) : (
                        <Input
                          value={currentValue || ''}
                          onChange={(e) => 
                            handleFeatureValueChange(feature.id, e.target.value)
                          }
                          placeholder="Enter custom value"
                        />
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}

          {features.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No features available</h3>
                <p className="text-muted-foreground">
                  Create features first to assign them to plans
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};