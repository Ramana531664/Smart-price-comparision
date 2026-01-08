import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Product {
  id: string;
  url: string;
  name: string;
  image_url: string | null;
  current_price: number | null;
  original_price: number | null;
  target_price: number | null;
  store: string | null;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PriceHistory {
  id: string;
  product_id: string;
  price: number;
  recorded_at: string;
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Product[];
    },
  });
}

export function usePriceHistory(productId: string | null) {
  return useQuery({
    queryKey: ['price-history', productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from('price_history')
        .select('*')
        .eq('product_id', productId)
        .order('recorded_at', { ascending: true });
      
      if (error) throw error;
      return data as PriceHistory[];
    },
    enabled: !!productId,
  });
}

export function useAddProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Product added', description: 'Now tracking price changes' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error adding product', 
        description: error.message,
        variant: 'destructive'
      });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Product removed', description: 'No longer tracking this product' });
    },
  });
}

export function useRefreshPrice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (productId: string) => {
      const { data, error } = await supabase.functions.invoke('refresh-price', {
        body: { productId },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['price-history'] });
      toast({ title: 'Price refreshed', description: 'Latest price has been fetched' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error refreshing price', 
        description: error.message,
        variant: 'destructive'
      });
    },
  });
}
