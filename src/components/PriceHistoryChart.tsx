import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePriceHistory, Product } from '@/hooks/useProducts';
import { format } from 'date-fns';
import { Loader2, TrendingDown } from 'lucide-react';

interface PriceHistoryChartProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PriceHistoryChart({ product, open, onOpenChange }: PriceHistoryChartProps) {
  const { data: history, isLoading } = usePriceHistory(product?.id || null);

  const chartData = history?.map((h) => ({
    date: format(new Date(h.recorded_at), 'MMM d'),
    price: Number(h.price),
    fullDate: format(new Date(h.recorded_at), 'PPpp'),
  })) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            Price History
          </DialogTitle>
        </DialogHeader>
        
        {product && (
          <div className="mb-4">
            <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
            <p className="text-xs text-muted-foreground">{product.store}</p>
          </div>
        )}

        <div className="h-64 w-full">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <TrendingDown className="h-12 w-12 mb-2 opacity-50" />
              <p>No price history yet</p>
              <p className="text-xs">Prices will be recorded as they change</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                  labelFormatter={(_, payload) => payload[0]?.payload.fullDate}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
