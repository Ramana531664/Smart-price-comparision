import { useState } from 'react';
import { Header } from '@/components/Header';
import { ProductSearch } from '@/components/ProductSearch';
import { ComparisonResults } from '@/components/ComparisonResults';
import { Loader2 } from 'lucide-react';

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

const Index = () => {
  const [results, setResults] = useState<ComparisonResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Search Section */}
        <section className="py-8 md:py-12">
          <ProductSearch 
            onResults={setResults}
            isSearching={isSearching}
            setIsSearching={setIsSearching}
          />
        </section>

        {/* Loading State */}
        {isSearching && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground text-lg">
              Searching across multiple stores...
            </p>
            <p className="text-sm text-muted-foreground">
              This may take 15-30 seconds
            </p>
          </div>
        )}

        {/* Results Section */}
        {!isSearching && results && results.products.length > 0 && (
          <section className="py-8">
            <ComparisonResults results={results} />
          </section>
        )}

        {/* No Results */}
        {!isSearching && results && results.products.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              No products found. Try a different search term.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
