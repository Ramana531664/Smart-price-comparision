import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  ArrowLeft,
  Package,
  Loader2,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  ShieldCheck
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
  product_image_url: string | null;
  quantity: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  created_at: string;
}

const statusOptions = [
  { value: 'processing', label: 'Processing', icon: <Clock className="h-4 w-4" /> },
  { value: 'shipped', label: 'Shipped', icon: <Truck className="h-4 w-4" /> },
  { value: 'delivered', label: 'Delivered', icon: <CheckCircle2 className="h-4 w-4" /> },
  { value: 'cancelled', label: 'Cancelled', icon: <XCircle className="h-4 w-4" /> }
];

const statusColors: Record<string, string> = {
  processing: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
  shipped: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
  delivered: 'bg-green-500/20 text-green-600 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-600 border-red-500/30'
};

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: authLoading, user } = useAuthContext();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/');
      return;
    }

    if (isAdmin) {
      fetchOrders();
      
      // Set up realtime subscription
      const channel = supabase
        .channel('admin-orders')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setOrders(prev => [payload.new as Order, ...prev]);
              toast.info('New order received!');
            } else if (payload.eventType === 'UPDATE') {
              setOrders(prev => prev.map(o => 
                o.id === payload.new.id ? payload.new as Order : o
              ));
            } else if (payload.eventType === 'DELETE') {
              setOrders(prev => prev.filter(o => o.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAdmin, authLoading, navigate]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);
      
      if (error) throw error;
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

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
          Back to Home
        </Button>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage orders and track deliveries</p>
            </div>
          </div>
          <Button variant="outline" onClick={fetchOrders} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statusOptions.map(status => {
            const count = orders.filter(o => o.order_status === status.value).length;
            return (
              <Card key={status.value} className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${statusColors[status.value]}`}>
                    {status.icon}
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm text-muted-foreground">{status.label}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground mt-4">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
            <p className="text-muted-foreground">Orders will appear here when customers place them.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Product Image */}
                  <div className="lg:w-20 lg:h-20 w-full h-32 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                    {order.product_image_url ? (
                      <img 
                        src={order.product_image_url}
                        alt={order.product_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                    )}
                  </div>

                  {/* Order Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-semibold line-clamp-1">{order.product_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {order.customer_name} • {order.customer_email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={order.order_status}
                          onValueChange={(value) => updateOrderStatus(order.id, value)}
                          disabled={updatingOrderId === order.id}
                        >
                          <SelectTrigger className={`w-36 ${statusColors[order.order_status]}`}>
                            {updatingOrderId === order.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map(status => (
                              <SelectItem key={status.value} value={status.value}>
                                <div className="flex items-center gap-2">
                                  {status.icon}
                                  {status.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Order Date</p>
                        <p className="font-medium">{formatDate(order.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Amount</p>
                        <p className="font-semibold">₹{order.total_amount.toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Payment</p>
                        <Badge variant="secondary" className="capitalize">{order.payment_method}</Badge>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Delivery</p>
                        <p className="text-xs">
                          {order.city}, {order.state} - {order.pincode}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
