import { useState } from 'react';
import { Header } from '@/components/Header';
import { AddProductDialog } from '@/components/AddProductDialog';
import { ProductCard } from '@/components/ProductCard';
import { PriceHistoryChart } from '@/components/PriceHistoryChart';
import { EmptyState } from '@/components/EmptyState';
import { StatsBar } from '@/components/StatsBar';
import { useProducts, Product } from '@/hooks/useProducts';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const Index = () => {
  const { data: products, isLoading } = useProducts();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleViewHistory = (product: Product) => {
    setSelectedProduct(product);
    setHistoryOpen(true);
  };

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.store?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        {products && products.length > 0 && <StatsBar products={products} />}
        
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <AddProductDialog />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !products || products.length === 0 ? (
          <EmptyState />
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            No products match your search
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product}
                onViewHistory={handleViewHistory}
              />
            ))}
          </div>
        )}
      </main>

      {/* Price History Modal */}
      <PriceHistoryChart 
        product={selectedProduct}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
    </div>
  );
};

export default Index;
