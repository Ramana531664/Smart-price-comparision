import { TrendingDown, Plus } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mb-6 shadow-elevated">
        <TrendingDown className="h-10 w-10 text-primary-foreground" />
      </div>
      <h2 className="font-display text-2xl font-bold mb-2">Start Tracking Prices</h2>
      <p className="text-muted-foreground max-w-md mb-6">
        Add products from your favorite online stores and we'll monitor price changes for you. 
        Get notified when prices drop!
      </p>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Plus className="h-4 w-4" />
        Click "Track Product" to get started
      </div>
    </div>
  );
}
