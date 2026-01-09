import { useState } from 'react';
import { Search, Link, Loader2, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProductResult {
  name: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviews?: number;
  store: string;
  url: string;
  imageUrl?: string;
  delivery?: string;
  inStock: boolean;
}

interface ComparisonResult {
  products: ProductResult[];
  recommendation: {
    bestValue: ProductResult | null;
    cheapest: ProductResult | null;
    highestRated: ProductResult | null;
    reasoning: string;
  };
}

interface ProductSearchProps {
  onResults: (results: ComparisonResult | null) => void;
  isSearching: boolean;
  setIsSearching: (v: boolean) => void;
}

export function ProductSearch({ onResults, isSearching, setIsSearching }: ProductSearchProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [activeTab, setActiveTab] = useState('search');

  const handleSearch = async () => {
    const query = activeTab === 'search' ? searchQuery : productUrl;
    
    if (!query.trim()) {
      toast({
        title: "Error",
        description: activeTab === 'search' 
          ? "Please enter a product name to search" 
          : "Please enter a product URL",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    onResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('compare-products', {
        body: activeTab === 'search' 
          ? { query: query.trim() }
          : { url: query.trim() },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to find products');
      }

      onResults(data.data);
      
      toast({
        title: "Success",
        description: `Found ${data.data.products.length} products across multiple stores`,
      });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: error instanceof Error ? error.message : "Failed to search products",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
          <span className="text-gradient">Smart</span> Price Comparison
        </h1>
        <p className="text-muted-foreground text-lg">
          Find the best deals across Amazon, Flipkart, Myntra, and more
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="search" className="gap-2">
            <Search className="h-4 w-4" />
            Search Product
          </TabsTrigger>
          <TabsTrigger value="url" className="gap-2">
            <Link className="h-4 w-4" />
            Paste URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for any product (e.g., iPhone 15, Samsung TV, Nike shoes...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-12 h-14 text-lg"
              disabled={isSearching}
            />
          </div>
        </TabsContent>

        <TabsContent value="url" className="space-y-4">
          <div className="relative">
            <Link className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Paste product URL from any e-commerce site..."
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-12 h-14 text-lg"
              disabled={isSearching}
            />
          </div>
        </TabsContent>

        <Button 
          onClick={handleSearch} 
          disabled={isSearching}
          className="w-full h-14 text-lg gradient-primary gap-2"
        >
          {isSearching ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Searching across stores...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Compare Prices with AI
            </>
          )}
        </Button>
      </Tabs>

      <div className="flex flex-wrap justify-center gap-3 mt-6 text-sm text-muted-foreground">
        <span className="px-3 py-1 bg-secondary rounded-full">Amazon</span>
        <span className="px-3 py-1 bg-secondary rounded-full">Flipkart</span>
        <span className="px-3 py-1 bg-secondary rounded-full">Myntra</span>
        <span className="px-3 py-1 bg-secondary rounded-full">Ajio</span>
        <span className="px-3 py-1 bg-secondary rounded-full">Croma</span>
        <span className="px-3 py-1 bg-secondary rounded-full">+ More</span>
      </div>
    </div>
  );
}
