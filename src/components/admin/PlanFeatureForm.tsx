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

interface PlanFeature {
  id: string;
  name: string;
  description: string | null;
  feature_type: 'boolean' | 'number' | 'text';
  unit: string | null;
  is_active: boolean;
  display_order: number;
}

interface PlanFeatureFormProps {
  feature: PlanFeature | null;
  onClose: () => void;
}

export const PlanFeatureForm: React.FC<PlanFeatureFormProps> = ({
  feature,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    name: feature?.name || '',
    description: feature?.description || '',
    feature_type: feature?.feature_type || 'boolean',
    unit: feature?.unit || '',
    is_active: feature?.is_active ?? true,
    display_order: feature?.display_order || 0,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveFeatureMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (feature) {
        const { error } = await supabase
          .from('plan_features')
          .update(data)
          .eq('id', feature.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('plan_features')
          .insert([data]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: `Feature ${feature ? 'updated' : 'created'} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['plan-features'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to ${feature ? 'update' : 'create'} feature: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveFeatureMutation.mutate(formData);
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
            {feature ? 'Edit Feature' : 'Create Feature'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Feature Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., HD Streaming, Download Limit"
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
              placeholder="Describe what this feature provides..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="feature_type">Feature Type</Label>
              <Select
                value={formData.feature_type}
                onValueChange={(value) => handleInputChange('feature_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boolean">Yes/No (Boolean)</SelectItem>
                  <SelectItem value="number">Number (with limits)</SelectItem>
                  <SelectItem value="text">Text (custom values)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Boolean: Yes/No features • Number: Numeric limits • Text: Custom values
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => handleInputChange('unit', e.target.value)}
                placeholder="e.g., streams, GB, devices"
              />
              <p className="text-xs text-muted-foreground">
                Optional: Unit of measurement (e.g., streams, GB, devices)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
            />
            <Label htmlFor="is_active">Active Feature</Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveFeatureMutation.isPending}>
              {saveFeatureMutation.isPending
                ? 'Saving...'
                : feature
                ? 'Update Feature'
                : 'Create Feature'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};