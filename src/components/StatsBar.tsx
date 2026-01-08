import { Card } from '@/components/ui/card';
import { Package, TrendingDown, Target, DollarSign } from 'lucide-react';
import { Product } from '@/hooks/useProducts';

interface StatsBarProps {
  products: Product[];
}

export function StatsBar({ products }: StatsBarProps) {
  const totalProducts = products.length;
  
  const productsWithPriceDrop = products.filter(p => 
    p.original_price && p.current_price && p.current_price < p.original_price
  ).length;
  
  const productsAtTarget = products.filter(p => 
    p.target_price && p.current_price && p.current_price <= p.target_price
  ).length;
  
  const totalSavings = products.reduce((acc, p) => {
    if (p.original_price && p.current_price && p.current_price < p.original_price) {
      return acc + (p.original_price - p.current_price);
    }
    return acc;
  }, 0);

  const stats = [
    {
      label: 'Tracked Products',
      value: totalProducts,
      icon: Package,
      color: 'text-primary',
    },
    {
      label: 'Price Drops',
      value: productsWithPriceDrop,
      icon: TrendingDown,
      color: 'text-success',
    },
    {
      label: 'Targets Hit',
      value: productsAtTarget,
      icon: Target,
      color: 'text-accent',
    },
    {
      label: 'Total Savings',
      value: `$${totalSavings.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-warning',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
