import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  slug: z.string().min(1, 'Slug is required'),
  is_active: z.boolean(),
  display_order: z.number().min(0),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  category?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  onSuccess,
  onCancel,
}) => {
  const { toast } = useToast();

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || '',
      description: category?.description || '',
      slug: category?.slug || '',
      is_active: category?.is_active ?? true,
      display_order: category?.display_order ?? 0,
    },
  });

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const createMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const { error } = await supabase
        .from('categories')
        .insert([{
          name: data.name,
          description: data.description,
          slug: data.slug,
          is_active: data.is_active,
          display_order: data.display_order,
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Category created",
        description: "The category has been successfully created.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create category: " + error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const { error } = await supabase
        .from('categories')
        .update({
          name: data.name,
          description: data.description,
          slug: data.slug,
          is_active: data.is_active,
          display_order: data.display_order,
        })
        .eq('id', category.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Category updated",
        description: "The category has been successfully updated.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update category: " + error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    if (category) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Category Name</Label>
          <Input
            id="name"
            {...form.register('name')}
            onChange={(e) => {
              form.setValue('name', e.target.value);
              form.setValue('slug', generateSlug(e.target.value));
            }}
            placeholder="Enter category name"
          />
          {form.formState.errors.name && (
            <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            {...form.register('slug')}
            placeholder="category-slug"
          />
          {form.formState.errors.slug && (
            <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...form.register('description')}
          placeholder="Enter category description (optional)"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="display_order">Display Order</Label>
          <Input
            id="display_order"
            type="number"
            {...form.register('display_order', { valueAsNumber: true })}
            placeholder="0"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            {...form.register('is_active')}
            checked={form.watch('is_active')}
            onCheckedChange={(checked) => form.setValue('is_active', checked)}
          />
          <Label htmlFor="is_active">Active</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {category ? 'Update Category' : 'Create Category'}
        </Button>
      </div>
    </form>
  );
};