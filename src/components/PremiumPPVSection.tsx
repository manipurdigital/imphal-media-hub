import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { useDirectPayment } from '@/hooks/useDirectPayment';

interface PayPerViewItem {
  id: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  thumbnail_url: string | null;
}

const PremiumPPVSection = () => {
  const { initiateDirectPayment, processingPayment } = useDirectPayment();
  const [items, setItems] = useState<PayPerViewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase.rpc('get_pay_per_view_content_with_status', {
          p_user_id: user?.id ?? null,
        });
        if (error) throw error;
        setItems((data || []).slice(0, 8));
      } catch (e) {
        console.error('Failed to load PPV preview', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handlePayPerViewClick = async (item: PayPerViewItem, e: React.MouseEvent) => {
    e.preventDefault();
    
    // Check if user already has access to this content
    const itemWithStatus = item as PayPerViewItem & { is_purchased?: boolean };
    if (itemWithStatus.is_purchased) {
      // User already has access, redirect to premium page to watch
      window.location.href = '/premium';
      return;
    }
    
    // Initiate direct payment
    await initiateDirectPayment(item.id, item.title);
  };

  const formatPrice = (price: number, currency: string) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(price);

  if (loading) {
    return (
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto py-6 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading premium content…</span>
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Premium • Pay‑Per‑View
          </h2>
          <Button asChild variant="secondary" size="sm">
            <Link to="/premium" aria-label="View all premium pay-per-view titles">
              View all
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((item) => (
            <div 
              key={item.id} 
              onClick={(e) => handlePayPerViewClick(item, e)}
              className="cursor-pointer"
            >
                <Card className="group overflow-hidden border-border/60 relative">
                  {processingPayment === item.id && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                <div className="relative aspect-[16/9] overflow-hidden">
                  {item.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.thumbnail_url}
                      alt={`${item.title} thumbnail - premium pay-per-view`}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted" />
                  )}
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-primary text-primary-foreground">
                      {formatPrice(item.price, item.currency)}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="text-sm font-medium line-clamp-1 text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {item.description || 'Premium content'}
                  </p>
                </CardContent>
                </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PremiumPPVSection;
