import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import VideoPlayer from '@/components/VideoPlayer';
import { Loader2, Play, Lock, Sparkles, CheckCircle } from 'lucide-react';

interface PayPerViewItem {
  id: string;
  video_id: string | null;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  duration_minutes: number | null;
  thumbnail_url: string | null;
  preview_url: string | null;
  is_purchased?: boolean;
  purchase_status?: string;
  purchased_at?: string | null;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Premium = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<PayPerViewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [playerTitle, setPlayerTitle] = useState('');
  const [playerUrl, setPlayerUrl] = useState<string | undefined>(undefined);
  const [playerVideoId, setPlayerVideoId] = useState<string | undefined>(undefined);

  useEffect(() => {
    document.title = 'Premium Pay-Per-View | Imoinu OTT';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'Browse premium pay-per-view videos and unlock instant access to exclusive content.');
    else {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = 'Browse premium pay-per-view videos and unlock instant access to exclusive content.';
      document.head.appendChild(m);
    }

    const linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      const l = document.createElement('link');
      l.rel = 'canonical';
      l.href = window.location.href;
      document.head.appendChild(l);
    }
  }, []);

  const loadRazorpay = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  };

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase.rpc('get_pay_per_view_content_with_status', {
        p_user_id: user?.id ?? null,
      });
      if (error) throw error;
      setItems(data as PayPerViewItem[]);
    } catch (err: any) {
      console.error('Failed to load premium catalog', err);
      toast({ title: 'Failed to load', description: err.message || 'Please try again', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCatalog(); }, []);

  const openPreviewOrWatch = async (item: PayPerViewItem) => {
    try {
      // Check entitlement
      const { data: entitlement, error } = await supabase.functions.invoke('entitlements', {
        body: { contentId: item.id },
      });
      if (error) throw error;

      if (entitlement?.hasAccess && item.video_id) {
        // Fetch full video for playback
        const { data: video, error: vErr } = await supabase
          .from('videos')
          .select('id,title,video_url')
          .eq('id', item.video_id)
          .single();
        if (vErr) throw vErr;
        setPlayerTitle(video.title);
        setPlayerUrl(video.video_url || undefined);
        setPlayerVideoId(video.id);
        setPlayerOpen(true);
        return;
      }

      // Fallback to preview if exists
      if (item.preview_url) {
        setPlayerTitle(`${item.title} — Preview`);
        setPlayerUrl(item.preview_url);
        setPlayerVideoId(undefined);
        setPlayerOpen(true);
      } else {
        toast({ title: 'Purchase required', description: 'Please purchase to watch this content.' });
      }
    } catch (err: any) {
      console.error('Entitlement check failed', err);
      toast({ title: 'Unable to play', description: err.message || 'Please try again', variant: 'destructive' });
    }
  };

  const handlePurchase = async (item: PayPerViewItem) => {
    try {
      setProcessingId(item.id);
      const ok = await loadRazorpay();
      if (!ok) throw new Error('Failed to load Razorpay');

      const { data: orderData, error: orderErr } = await supabase.functions.invoke('create-pay-per-view-order', {
        body: { contentId: item.id }
      });
      if (orderErr) throw orderErr;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please sign in to continue');

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Imoinu Premium',
        description: `${item.title} • Pay-Per-View`,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          try {
            const { error: verifyErr } = await supabase.functions.invoke('verify-pay-per-view-payment', {
              body: {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }
            });
            if (verifyErr) throw verifyErr;

            toast({ title: 'Unlocked!', description: 'Payment successful. Enjoy your video.' });
            await fetchCatalog();
          } catch (err: any) {
            console.error('Verification failed', err);
            toast({ title: 'Payment verification failed', description: err.message || 'If charged, contact support.', variant: 'destructive' });
          }
        },
        modal: { ondismiss: () => setProcessingId(null) },
        prefill: { name: user.user_metadata?.full_name || '', email: user.email || '' },
        theme: { color: '#ef4444' },
      } as any;

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error('Purchase failed', err);
      toast({ title: 'Purchase failed', description: err.message || 'Please try again', variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  const formatPrice = (price: number, currency: string) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(price);

  const content = useMemo(() => items, [items]);

  return (
    <main className="pt-24 px-6 md:px-12 lg:px-16">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-primary" /> Premium Pay‑Per‑View
        </h1>
        <p className="text-muted-foreground mt-2">Unlock exclusive titles instantly. Pay only for what you watch.</p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 mr-2 animate-spin" /> Loading premium titles…
        </div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {content.map((item) => (
            <Card key={item.id} className="group overflow-hidden border-border/60">
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
                  <Badge className="bg-primary text-primary-foreground">{formatPrice(item.price, item.currency)}</Badge>
                </div>
                {item.is_purchased && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Purchased</Badge>
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg line-clamp-1">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{item.description || 'Premium content'}</p>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => openPreviewOrWatch(item)}
                    variant="default"
                  >
                    <Play className="h-4 w-4 mr-2" /> {item.is_purchased ? 'Watch now' : (item.preview_url ? 'Preview' : 'Details')}
                  </Button>
                  {!item.is_purchased && (
                    <Button
                      className="flex-1"
                      onClick={() => handlePurchase(item)}
                      disabled={processingId === item.id}
                      variant="outline"
                    >
                      {processingId === item.id ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing</>) : (<><Lock className="h-4 w-4 mr-2" /> Unlock</>)}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <VideoPlayer
        title={playerTitle}
        videoUrl={playerUrl}
        videoId={playerVideoId}
        isOpen={playerOpen}
        onClose={() => setPlayerOpen(false)}
      />
    </main>
  );
};

export default Premium;
