import { Zap } from 'lucide-react';
import { CartDrawer } from './CartDrawer';
import { Link } from 'react-router-dom';

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
          <p className="text-sm text-muted-foreground hidden sm:block">
            AI-Powered Price Comparison
          </p>
          <CartDrawer />
        </div>
      </div>
    </header>
  );
}
