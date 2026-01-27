import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Package, 
  CheckCircle2, 
  Truck, 
  MapPin, 
  Clock,
  Warehouse,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrackingEvent {
  id: string;
  order_id: string;
  status: string;
  location: string;
  description: string | null;
  timestamp: string;
}

interface OrderTrackingTimelineProps {
  orderId: string;
  orderStatus: string;
  customerCity: string;
}

const statusIcons: Record<string, React.ReactNode> = {
  'order_placed': <Package className="h-5 w-5" />,
  'processing': <Clock className="h-5 w-5" />,
  'picked_up': <Warehouse className="h-5 w-5" />,
  'in_transit': <Truck className="h-5 w-5" />,
  'out_for_delivery': <MapPin className="h-5 w-5" />,
  'delivered': <Home className="h-5 w-5" />,
  'completed': <CheckCircle2 className="h-5 w-5" />,
};

const defaultTrackingSteps = [
  { status: 'order_placed', label: 'Order Placed', location: 'Online' },
  { status: 'processing', label: 'Processing', location: 'Warehouse' },
  { status: 'shipped', label: 'Shipped', location: 'In Transit' },
  { status: 'delivered', label: 'Delivered', location: 'Destination' },
];

export function OrderTrackingTimeline({ orderId, orderStatus, customerCity }: OrderTrackingTimelineProps) {
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTrackingEvents();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel(`tracking-${orderId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'order_tracking',
          filter: `order_id=eq.${orderId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTrackingEvents(prev => [...prev, payload.new as TrackingEvent].sort(
              (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const fetchTrackingEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('order_tracking')
        .select('*')
        .eq('order_id', orderId)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      setTrackingEvents(data || []);
    } catch (error) {
      console.error('Error fetching tracking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  // If no tracking events exist, show default status-based timeline
  const getDefaultTimeline = () => {
    const statusOrder = ['processing', 'shipped', 'delivered', 'cancelled'];
    const currentIndex = statusOrder.indexOf(orderStatus);
    
    return defaultTrackingSteps.map((step, index) => {
      const isCompleted = index <= currentIndex && orderStatus !== 'cancelled';
      const isCurrent = index === currentIndex && orderStatus !== 'cancelled';
      const isCancelled = orderStatus === 'cancelled';
      
      return {
        ...step,
        isCompleted,
        isCurrent,
        isCancelled: isCancelled && index === currentIndex,
        location: step.status === 'delivered' ? customerCity : step.location
      };
    });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 py-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Use actual tracking events if available, otherwise show default timeline
  if (trackingEvents.length > 0) {
    return (
      <div className="py-4">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" />
          Tracking Details
        </h4>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
          
          <div className="space-y-6">
            {trackingEvents.map((event, index) => {
              const { date, time } = formatDateTime(event.timestamp);
              const isLatest = index === trackingEvents.length - 1;
              
              return (
                <div key={event.id} className="relative flex gap-4">
                  {/* Icon */}
                  <div className={cn(
                    "relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2",
                    isLatest 
                      ? "bg-primary border-primary text-primary-foreground" 
                      : "bg-background border-green-500 text-green-500"
                  )}>
                    {statusIcons[event.status] || <Package className="h-5 w-5" />}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn(
                        "font-medium capitalize",
                        isLatest && "text-primary"
                      )}>
                        {event.status.replace(/_/g, ' ')}
                      </span>
                      {isLatest && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>{event.location}</span>
                    </div>
                    
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {event.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                      <Clock className="h-3 w-3" />
                      <span>{date} at {time}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Default timeline based on order status
  const timeline = getDefaultTimeline();
  
  return (
    <div className="py-4">
      <h4 className="font-semibold mb-4 flex items-center gap-2">
        <Truck className="h-4 w-4 text-primary" />
        Order Progress
      </h4>
      
      {/* Progress bar */}
      <div className="relative mb-6">
        <div className="flex justify-between mb-2">
          {timeline.map((step, index) => (
            <div 
              key={step.status}
              className={cn(
                "flex flex-col items-center flex-1",
                index === 0 && "items-start",
                index === timeline.length - 1 && "items-end"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2 z-10",
                step.isCompleted || step.isCurrent
                  ? "bg-primary border-primary text-primary-foreground"
                  : step.isCancelled
                    ? "bg-destructive border-destructive text-destructive-foreground"
                    : "bg-muted border-border text-muted-foreground"
              )}>
                {statusIcons[step.status] || <Package className="h-4 w-4" />}
              </div>
              <span className={cn(
                "text-xs mt-2 text-center",
                (step.isCompleted || step.isCurrent) ? "text-foreground font-medium" : "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
        
        {/* Progress line */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-border -z-0">
          <div 
            className="h-full bg-primary transition-all duration-500"
            style={{ 
              width: `${(timeline.filter(s => s.isCompleted).length / (timeline.length - 1)) * 100}%` 
            }}
          />
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground text-center">
        {orderStatus === 'processing' && 'Your order is being prepared for shipment'}
        {orderStatus === 'shipped' && 'Your order is on its way to you'}
        {orderStatus === 'delivered' && 'Your order has been delivered successfully'}
        {orderStatus === 'cancelled' && 'This order has been cancelled'}
      </p>
    </div>
  );
}
