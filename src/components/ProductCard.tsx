import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ExternalLink, 
  RefreshCw, 
  Trash2, 
  TrendingDown, 
  TrendingUp,
  Target,
  Clock,
  BarChart2
} from 'lucide-react';
import { Product, useDeleteProduct, useRefreshPrice } from '@/hooks/useProducts';
import { formatDistanceToNow } from 'date-fns';

interface ProductCardProps {
  product: Product;
  onViewHistory: (product: Product) => void;
}

export function ProductCard({ product, onViewHistory }: ProductCardProps) {
  const deleteProduct = useDeleteProduct();
  const refreshPrice = useRefreshPrice();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshPrice.mutateAsync(product.id);
    setIsRefreshing(false);
  };

  const priceChange = product.original_price && product.current_price
    ? ((product.current_price - product.original_price) / product.original_price) * 100
    : 0;

  const isAtTarget = product.target_price && product.current_price 
    ? product.current_price <= product.target_price 
    : false;

  return (
    <Card className="overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-300 animate-fade-in">
      <div className="flex">
        {/* Product Image */}
        <div className="w-32 h-32 flex-shrink-0 bg-muted flex items-center justify-center overflow-hidden">
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-muted-foreground text-4xl">📦</div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 p-4 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-xs">
                  {product.store || 'Unknown'}
                </Badge>
                {isAtTarget && (
                  <Badge className="bg-success text-success-foreground text-xs gap-1">
                    <Target className="h-3 w-3" />
                    Target Hit!
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-sm line-clamp-2 mb-2">
                {product.name}
              </h3>
            </div>
          </div>

          {/* Price Section */}
          <div className="flex items-end gap-3 mb-3">
            <span className="text-2xl font-display font-bold">
              ${product.current_price?.toFixed(2) || '—'}
            </span>
            {product.original_price && product.original_price !== product.current_price && (
              <span className="text-sm text-muted-foreground line-through">
                ${product.original_price.toFixed(2)}
              </span>
            )}
            {priceChange !== 0 && (
              <Badge 
                variant="outline" 
                className={`text-xs gap-1 ${
                  priceChange < 0 
                    ? 'border-price-down text-price-down' 
                    : 'border-price-up text-price-up'
                }`}
              >
                {priceChange < 0 ? (
                  <TrendingDown className="h-3 w-3" />
                ) : (
                  <TrendingUp className="h-3 w-3" />
                )}
                {Math.abs(priceChange).toFixed(1)}%
              </Badge>
            )}
          </div>

          {/* Target Price */}
          {product.target_price && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Target className="h-3 w-3" />
              Target: ${product.target_price.toFixed(2)}
            </div>
          )}

          {/* Last Checked */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto">
            <Clock className="h-3 w-3" />
            {product.last_checked_at 
              ? `Updated ${formatDistanceToNow(new Date(product.last_checked_at))} ago`
              : 'Never checked'}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 p-2 border-l border-border">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onViewHistory(product)}
          >
            <BarChart2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            asChild
          >
            <a href={product.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => deleteProduct.mutate(product.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
