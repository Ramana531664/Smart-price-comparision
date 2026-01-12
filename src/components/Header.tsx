import { Zap, Package } from 'lucide-react';
import { CartDrawer } from './CartDrawer';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';

export function Header() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="p-2 rounded-lg gradient-primary">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl">PriceHawk</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="hidden sm:flex gap-2">
            <Link to="/orders">
              <Package className="h-4 w-4" />
              Track Orders
            </Link>
          </Button>
          <CartDrawer />
        </div>
      </div>
    </header>
  );
}
