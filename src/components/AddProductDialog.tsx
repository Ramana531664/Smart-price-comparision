import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Link, DollarSign, Loader2 } from 'lucide-react';
import { useAddProduct } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function AddProductDialog() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const addProduct = useAddProduct();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    
    try {
      // Call edge function to scrape product info
      const { data, error } = await supabase.functions.invoke('scrape-product', {
        body: { url: url.trim() },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to scrape product');
      }

      // Add product to database
      await addProduct.mutateAsync({
        url: url.trim(),
        name: data.name || 'Unknown Product',
        image_url: data.image_url || null,
        current_price: data.price || null,
        original_price: data.original_price || data.price || null,
        target_price: targetPrice ? parseFloat(targetPrice) : null,
        store: data.store || extractDomain(url),
        last_checked_at: new Date().toISOString(),
      });

      setUrl('');
      setTargetPrice('');
      setOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add product',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const extractDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
    } catch {
      return 'Unknown';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary text-primary-foreground gap-2 shadow-elevated hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" />
          Track Product
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Add Product to Track</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="url" className="flex items-center gap-2">
              <Link className="h-4 w-4 text-muted-foreground" />
              Product URL
            </Label>
            <Input
              id="url"
              type="url"
              placeholder="https://amazon.com/product/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="target" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Target Price (optional)
            </Label>
            <Input
              id="target"
              type="number"
              step="0.01"
              placeholder="99.99"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Get notified when the price drops below this amount
            </p>
          </div>
          <Button 
            type="submit" 
            className="w-full gradient-primary text-primary-foreground"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Fetching product info...
              </>
            ) : (
              'Start Tracking'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
