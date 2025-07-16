import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Search, FolderOpen, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CollectionForm } from '@/components/admin/CollectionForm';

export const CollectionsManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: collections, isLoading } = useQuery({
    queryKey: ['adminCollections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          video_collections (
            video_id,
            videos (title)
          )
        `)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const deleteCollectionMutation = useMutation({
    mutationFn: async (collectionId: string) => {
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', collectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCollections'] });
      toast({
        title: "Collection deleted",
        description: "The collection has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete collection: " + error.message,
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('collections')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCollections'] });
      toast({
        title: "Status updated",
        description: "Collection status has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update status: " + error.message,
        variant: "destructive",
      });
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, isFeatured }: { id: string; isFeatured: boolean }) => {
      const { error } = await supabase
        .from('collections')
        .update({ is_featured: isFeatured })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCollections'] });
      toast({
        title: "Featured status updated",
        description: "Collection featured status has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update featured status: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteCollection = async (collectionId: string) => {
    if (confirm('Are you sure you want to delete this collection?')) {
      deleteCollectionMutation.mutate(collectionId);
    }
  };

  const handleEditCollection = (collection: any) => {
    setEditingCollection(collection);
    setShowForm(true);
  };

  const handleAddCollection = () => {
    setEditingCollection(null);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingCollection(null);
    queryClient.invalidateQueries({ queryKey: ['adminCollections'] });
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCollection(null);
  };

  const handleToggleActive = (id: string, currentActive: boolean) => {
    toggleActiveMutation.mutate({ id, isActive: !currentActive });
  };

  const handleToggleFeatured = (id: string, currentFeatured: boolean) => {
    toggleFeaturedMutation.mutate({ id, isFeatured: !currentFeatured });
  };

  const filteredCollections = collections?.filter((collection) => {
    const matchesSearch = !searchTerm || 
      collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collection.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Collections Management</h1>
          <p className="text-muted-foreground">Organize your content into collections</p>
        </div>
        <Button onClick={handleAddCollection} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Collection
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search collections..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4">
        {filteredCollections?.map((collection) => (
          <Card key={collection.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {collection.name}
                    {collection.is_featured && (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{collection.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={collection.is_active ? 'default' : 'secondary'}>
                    {collection.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  {collection.is_featured && (
                    <Badge variant="outline">Featured</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Videos:</span>
                    <p className="font-medium">{collection.video_collections?.length || 0}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Order:</span>
                    <p className="font-medium">{collection.display_order || 0}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <p className="font-medium">{new Date(collection.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Active:</span>
                    <Switch
                      checked={collection.is_active}
                      onCheckedChange={() => handleToggleActive(collection.id, collection.is_active)}
                      disabled={toggleActiveMutation.isPending}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Featured:</span>
                    <Switch
                      checked={collection.is_featured}
                      onCheckedChange={() => handleToggleFeatured(collection.id, collection.is_featured)}
                      disabled={toggleFeaturedMutation.isPending}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditCollection(collection)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteCollection(collection.id)}
                      disabled={deleteCollectionMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!filteredCollections?.length && collections?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No collections match your search</h3>
            <p className="text-muted-foreground text-center mb-4">
              Try adjusting your search terms to find collections.
            </p>
            <Button variant="outline" onClick={() => setSearchTerm('')}>
              Clear Search
            </Button>
          </CardContent>
        </Card>
      ) : !collections?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center mb-4">
              <FolderOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No collections found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by creating your first collection to organize your content.
            </p>
            <Button onClick={handleAddCollection}>
              <Plus className="h-4 w-4 mr-2" />
              Add Collection
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Collection Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCollection ? 'Edit Collection' : 'Add New Collection'}</DialogTitle>
          </DialogHeader>
          <CollectionForm
            collection={editingCollection}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};