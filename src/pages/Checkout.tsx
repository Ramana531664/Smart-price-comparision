import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCart } from '@/contexts/CartContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  CreditCard, 
  Wallet, 
  Banknote, 
  ArrowLeft, 
  ShieldCheck,
  Truck,
  Package,
  CheckCircle2,
  Loader2
} from 'lucide-react';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, totalAmount, clearCart } = useCart();
  const { user } = useAuthContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    paymentMethod: 'card'
  });

  // Pre-fill email if user is logged in
  useEffect(() => {
    if (user?.email && !formData.email) {
      setFormData(prev => ({ ...prev, email: user.email || '' }));
    }
  }, [user]);

  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'number') {
      const formatted = value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
      setCardData(prev => ({ ...prev, [name]: formatted }));
    } else if (name === 'expiry') {
      const formatted = value.replace(/\D/g, '').slice(0, 4).replace(/(.{2})/, '$1/');
      setCardData(prev => ({ ...prev, [name]: formatted }));
    } else if (name === 'cvv') {
      setCardData(prev => ({ ...prev, [name]: value.replace(/\D/g, '').slice(0, 3) }));
    } else {
      setCardData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create orders for each item
      for (const item of items) {
        const { error } = await supabase.from('orders').insert({
          user_id: user?.id || null,
          customer_name: formData.name,
          customer_email: formData.email.toLowerCase(),
          customer_phone: formData.phone,
          shipping_address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          product_name: item.name,
          product_price: item.price,
          product_store: item.store,
          product_url: item.url,
          product_image_url: item.imageUrl,
          quantity: item.quantity,
          total_amount: item.price * item.quantity,
          payment_method: formData.paymentMethod,
          payment_status: 'completed',
          order_status: 'processing'
        });

        if (error) throw error;
      }

      setOrderId(`ORD-${Date.now()}`);
      setOrderComplete(true);
      clearCart();
      toast.success('Order placed successfully!');
    } catch (error) {
      console.error('Order error:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0 && !orderComplete) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Add some products to checkout</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
        </main>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 max-w-lg text-center">
          <div className="animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
            <p className="text-muted-foreground mb-4">
              Thank you for your order. Your order ID is:
            </p>
            <p className="text-lg font-mono font-semibold text-primary mb-6">{orderId}</p>
            
            <Card className="p-4 text-left mb-6">
              <h3 className="font-semibold mb-2">What happens next?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" />
                  Your order will be processed within 24 hours
                </li>
                <li className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Expected delivery: 3-7 business days
                </li>
              </ul>
            </Card>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => navigate('/orders')} variant="outline" className="flex-1">
                <Package className="h-4 w-4 mr-2" />
                Track Order
              </Button>
              <Button onClick={() => navigate('/')} className="flex-1">
                Continue Shopping
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
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
          Back to Shopping
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Shipping Info */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping Information
              </h2>
              
              <div className="grid gap-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      value={formData.name}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input 
                      id="phone" 
                      name="phone" 
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
                
                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Input 
                    id="address" 
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="House/Flat No., Street, Area"
                    required 
                  />
                </div>
                
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input 
                      id="city" 
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input 
                      id="state" 
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input 
                      id="pincode" 
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment Method */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Method
              </h2>
              
              <RadioGroup 
                value={formData.paymentMethod} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-secondary/50 transition-colors">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex-1 cursor-pointer flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Credit/Debit Card
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-secondary/50 transition-colors">
                  <RadioGroupItem value="upi" id="upi" />
                  <Label htmlFor="upi" className="flex-1 cursor-pointer flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    UPI
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-secondary/50 transition-colors">
                  <RadioGroupItem value="cod" id="cod" />
                  <Label htmlFor="cod" className="flex-1 cursor-pointer flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    Cash on Delivery
                  </Label>
                </div>
              </RadioGroup>

              {/* Card Details */}
              {formData.paymentMethod === 'card' && (
                <div className="mt-4 space-y-4 p-4 rounded-lg bg-secondary/30">
                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input 
                      id="cardNumber" 
                      name="number"
                      value={cardData.number}
                      onChange={handleCardChange}
                      placeholder="1234 5678 9012 3456"
                      required={formData.paymentMethod === 'card'}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiry">Expiry</Label>
                      <Input 
                        id="expiry" 
                        name="expiry"
                        value={cardData.expiry}
                        onChange={handleCardChange}
                        placeholder="MM/YY"
                        required={formData.paymentMethod === 'card'}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input 
                        id="cvv" 
                        name="cvv"
                        type="password"
                        value={cardData.cvv}
                        onChange={handleCardChange}
                        placeholder="123"
                        required={formData.paymentMethod === 'card'}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="cardName">Name on Card</Label>
                    <Input 
                      id="cardName" 
                      name="name"
                      value={cardData.name}
                      onChange={handleCardChange}
                      required={formData.paymentMethod === 'card'}
                    />
                  </div>
                </div>
              )}

              {formData.paymentMethod === 'upi' && (
                <div className="mt-4 p-4 rounded-lg bg-secondary/30">
                  <Label htmlFor="upiId">UPI ID</Label>
                  <Input 
                    id="upiId" 
                    placeholder="yourname@upi"
                    required={formData.paymentMethod === 'upi'}
                  />
                </div>
              )}
            </Card>

            <Button 
              type="submit" 
              className="w-full h-12 text-lg"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-5 w-5 mr-2" />
                  Pay ₹{totalAmount.toLocaleString('en-IN')}
                </>
              )}
            </Button>
          </form>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-4 h-fit">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Summary
              </h2>
              
              <div className="space-y-4 mb-6">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3">
                    {item.imageUrl && (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium line-clamp-2">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">{item.store}</p>
                      <p className="text-sm">
                        ₹{item.price.toLocaleString('en-IN')} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-success">Free</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="mt-6 p-3 rounded-lg bg-success/10 border border-success/20">
                <div className="flex items-center gap-2 text-sm text-success">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Secure checkout - Your data is protected</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
