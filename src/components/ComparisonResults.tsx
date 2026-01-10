import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Star, 
  Truck, 
  Award, 
  TrendingDown,
  ThumbsUp,
  ShoppingCart,
  Sparkles
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

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

interface ComparisonResultsProps {
  results: ComparisonResult;
}

function getStoreColor(store: string): string {
  const colors: Record<string, string> = {
    'amazon.in': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    'flipkart.com': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    'myntra.com': 'bg-pink-500/10 text-pink-600 border-pink-500/20',
    'ajio.com': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    'croma.com': 'bg-green-500/10 text-green-600 border-green-500/20',
    'reliancedigital.in': 'bg-red-500/10 text-red-600 border-red-500/20',
  };
  return colors[store] || 'bg-secondary text-secondary-foreground';
}

function getStoreName(store: string): string {
  const names: Record<string, string> = {
    'amazon.in': 'Amazon',
    'flipkart.com': 'Flipkart',
    'myntra.com': 'Myntra',
    'ajio.com': 'Ajio',
    'croma.com': 'Croma',
    'reliancedigital.in': 'Reliance Digital',
  };
  return names[store] || store;
}

function ProductCard({ product, badges }: { product: ProductResult; badges: string[] }) {
  const price = product.price ?? 0;
  const discount = product.originalPrice && price
    ? Math.round(((product.originalPrice - price) / product.originalPrice) * 100)
    : 0;
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart({
      name: product.name,
      price: price,
      originalPrice: product.originalPrice,
      store: product.store,
      url: product.url,
      imageUrl: product.imageUrl
    });
    toast.success('Added to cart!', {
      description: product.name.slice(0, 50) + '...',
    });
  };

  return (
    <Card className="overflow-hidden hover:shadow-elevated transition-all duration-300 animate-fade-in">
      <div className="p-4">
        {/* Badges Row */}
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="outline" className={getStoreColor(product.store)}>
            {getStoreName(product.store)}
          </Badge>
          {badges.includes('bestValue') && (
            <Badge className="bg-primary text-primary-foreground gap-1">
              <Award className="h-3 w-3" />
              Best Value
            </Badge>
          )}
          {badges.includes('cheapest') && (
            <Badge className="bg-success text-success-foreground gap-1">
              <TrendingDown className="h-3 w-3" />
              Cheapest
            </Badge>
          )}
          {badges.includes('highestRated') && (
            <Badge className="bg-warning text-warning-foreground gap-1">
              <ThumbsUp className="h-3 w-3" />
              Top Rated
            </Badge>
          )}
          {!product.inStock && (
            <Badge variant="destructive">Out of Stock</Badge>
          )}
        </div>

        {/* Product Image */}
        {product.imageUrl && (
          <div className="mb-3 aspect-square rounded-lg overflow-hidden bg-secondary/30">
            <img 
              src={product.imageUrl} 
              alt={product.name}
              className="w-full h-full object-contain"
            />
          </div>
        )}

        {/* Product Name */}
        <h3 className="font-semibold text-sm line-clamp-2 mb-3 min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Price Section */}
        <div className="flex items-end gap-2 mb-3">
          <span className="text-2xl font-display font-bold">
            ₹{price.toLocaleString('en-IN')}
          </span>
          {product.originalPrice && product.originalPrice > price && (
            <>
              <span className="text-sm text-muted-foreground line-through">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
              <Badge variant="outline" className="border-price-down text-price-down text-xs">
                {discount}% off
              </Badge>
            </>
          )}
        </div>

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1 text-warning">
              <Star className="h-4 w-4 fill-current" />
              <span className="font-medium">{product.rating}</span>
            </div>
            {product.reviews && (
              <span className="text-xs text-muted-foreground">
                ({product.reviews.toLocaleString()} reviews)
              </span>
            )}
          </div>
        )}

        {/* Delivery */}
        {product.delivery && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <Truck className="h-3 w-3" />
            {product.delivery}
          </div>
        )}

        {/* Add to Cart Button */}
        <Button 
          className="w-full gap-2" 
          onClick={handleAddToCart}
          disabled={!product.inStock}
        >
          <ShoppingCart className="h-4 w-4" />
          Add to Cart
        </Button>
      </div>
    </Card>
  );
}

export function ComparisonResults({ results }: ComparisonResultsProps) {
  const { products, recommendation } = results;

  // Determine badges for each product
  const getBadges = (product: ProductResult): string[] => {
    const badges: string[] = [];
    if (recommendation.bestValue?.url === product.url) badges.push('bestValue');
    if (recommendation.cheapest?.url === product.url) badges.push('cheapest');
    if (recommendation.highestRated?.url === product.url) badges.push('highestRated');
    return badges;
  };

  // Sort products: recommended first, then by price
  const sortedProducts = [...products].sort((a, b) => {
    const aBadges = getBadges(a).length;
    const bBadges = getBadges(b).length;
    if (aBadges !== bBadges) return bBadges - aBadges;
    return a.price - b.price;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* AI Recommendation */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">AI Recommendation</h3>
            <p className="text-sm text-muted-foreground">{recommendation.reasoning}</p>
          </div>
        </div>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Found {products.length} products
        </h2>
      </div>

      {/* Product Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedProducts.map((product, index) => (
          <ProductCard 
            key={`${product.store}-${index}`} 
            product={product} 
            badges={getBadges(product)}
          />
        ))}
      </div>
    </div>
  );
}
