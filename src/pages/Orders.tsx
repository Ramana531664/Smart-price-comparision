import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft,
  Package,
  Search,
  Loader2,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  MapPin
} from 'lucide-react';

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  city: string;
  state: string;
  pincode: string;
  product_name: string;
  product_price: number;
  product_store: string;
  product_url: string | null;
  product_image_url: string | null;
  quantity: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  created_at: string;
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  processing: { 
    label: 'Processing', 
    icon: <Clock className="h-4 w-4" />, 
    color: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30' 
  },
  shipped: { 
    label: 'Shipped', 
    icon: <Truck className="h-4 w-4" />, 
    color: 'bg-blue-500/20 text-blue-600 border-blue-500/30' 
  },
  delivered: { 
    label: 'Delivered', 
    icon: <CheckCircle2 className="h-4 w-4" />, 
    color: 'bg-green-500/20 text-green-600 border-green-500/30' 
  },
  cancelled: { 
    label: 'Cancelled', 
    icon: <XCircle className="h-4 w-4" />, 
    color: 'bg-red-500/20 text-red-600 border-red-500/30' 
  }
};

export default function Orders() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchEmail, setSearchEmail] = useState(searchParams.get('email') || '');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (searchParams.get('email')) {
      handleSearch();
    }
  }, []);

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_email', searchEmail.trim().toLowerCase())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || statusConfig.processing;
    return (
      <Badge variant="outline" className={`gap-1 ${config.color}`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Shopping
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Package className="h-12 w-12 mx-auto text-primary mb-4" />
            <h1 className="text-3xl font-bold mb-2">Track Your Orders</h1>
            <p className="text-muted-foreground">
              Enter your email address to view your order history and status
            </p>
          </div>

          {/* Search Form */}
          <Card className="p-6 mb-8">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
              className="flex gap-3"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Search Orders'
                )}
              </Button>
            </form>
          </Card>

          {/* Results */}
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground mt-4">Searching for your orders...</p>
            </div>
          ) : hasSearched ? (
            orders.length > 0 ? (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">
                  Found {orders.length} order{orders.length !== 1 ? 's' : ''}
                </h2>
                
                {orders.map((order) => (
                  <Card key={order.id} className="p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Product Image */}
                      <div className="sm:w-24 sm:h-24 w-full h-40 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                        {order.product_image_url ? (
                          <img 
                            src={order.product_image_url}
                            alt={order.product_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">
                            📦
                          </div>
                        )}
                      </div>

                      {/* Order Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-semibold line-clamp-2">{order.product_name}</h3>
                            <p className="text-sm text-muted-foreground">{order.product_store}</p>
                          </div>
                          {getStatusBadge(order.order_status)}
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4 mt-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Order Date</p>
                            <p className="font-medium">{formatDate(order.created_at)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Quantity</p>
                            <p className="font-medium">{order.quantity}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Total Amount</p>
                            <p className="font-semibold text-lg">₹{order.total_amount.toLocaleString('en-IN')}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Payment</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="capitalize">
                                {order.payment_method}
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className={order.payment_status === 'completed' 
                                  ? 'bg-green-500/20 text-green-600 border-green-500/30' 
                                  : 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30'}
                              >
                                {order.payment_status}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="mt-4 p-3 rounded-lg bg-secondary/50">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <div className="text-sm">
                              <p className="font-medium">{order.customer_name}</p>
                              <p className="text-muted-foreground">
                                {order.shipping_address}, {order.city}, {order.state} - {order.pincode}
                              </p>
                              <p className="text-muted-foreground">{order.customer_phone}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No orders found</h3>
                <p className="text-muted-foreground mb-6">
                  We couldn't find any orders associated with this email address.
                </p>
                <Button onClick={() => navigate('/')}>
                  Start Shopping
                </Button>
              </Card>
            )
          ) : null}
        </div>
      </main>
    </div>
  );
}
