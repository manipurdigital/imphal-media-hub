import { useState } from 'react';
import { Plus, Edit, Trash2, Star, Eye, EyeOff, Type, Hash, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlanFeatureForm } from '@/components/admin/PlanFeatureForm';

interface PlanFeature {
  id: string;
  name: string;
  description: string | null;
  feature_type: 'boolean' | 'number' | 'text';
  unit: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const PlanFeaturesManagement = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<PlanFeature | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: features = [], isLoading } = useQuery({
    queryKey: ['plan-features'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plan_features')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as PlanFeature[];
    },
  });

  const deleteFeatureMutation = useMutation({
    mutationFn: async (featureId: string) => {
      const { error } = await supabase
        .from('plan_features')
        .delete()
        .eq('id', featureId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Feature deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['plan-features'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete feature: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const toggleFeatureStatusMutation = useMutation({
    mutationFn: async ({ featureId, isActive }: { featureId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('plan_features')
        .update({ is_active: !isActive })
        .eq('id', featureId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Feature status updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['plan-features'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update feature status: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (feature: PlanFeature) => {
    setEditingFeature(feature);
    setIsFormOpen(true);
  };

  const handleDelete = (featureId: string) => {
    if (window.confirm('Are you sure you want to delete this feature?')) {
      deleteFeatureMutation.mutate(featureId);
    }
  };

  const handleToggleStatus = (feature: PlanFeature) => {
    toggleFeatureStatusMutation.mutate({ featureId: feature.id, isActive: feature.is_active });
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

  const getFeatureTypeLabel = (type: string) => {
    switch (type) {
      case 'boolean':
        return 'Yes/No';
      case 'number':
        return 'Number';
      case 'text':
        return 'Text';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Plan Features</h1>
          <p className="text-muted-foreground">
            Manage features that can be assigned to subscription plans
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingFeature(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Feature
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
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
          {features.map((feature) => (
            <Card key={feature.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getFeatureTypeIcon(feature.feature_type)}
                      {feature.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {getFeatureTypeLabel(feature.feature_type)}
                      </Badge>
                      {feature.unit && (
                        <Badge variant="secondary" className="text-xs">
                          {feature.unit}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Badge variant={feature.is_active ? 'default' : 'secondary'}>
                    {feature.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {feature.description || 'No description provided'}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(feature)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(feature)}
                    className="flex items-center gap-1"
                  >
                    {feature.is_active ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                    {feature.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(feature.id)}
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

      {features.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No features found</h3>
            <p className="text-muted-foreground mb-4">
              Create features that can be assigned to subscription plans
            </p>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Feature
            </Button>
          </CardContent>
        </Card>
      )}

      {isFormOpen && (
        <PlanFeatureForm
          feature={editingFeature}
          onClose={() => {
            setIsFormOpen(false);
            setEditingFeature(null);
          }}
        />
      )}
    </div>
  );
};