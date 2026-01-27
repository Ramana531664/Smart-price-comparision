import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Package, 
  CheckCircle2, 
  Truck, 
  MapPin, 
  Clock,
  Warehouse,
  Home,
  CircleDot
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
  orderDate: string;
}

const statusIcons: Record<string, React.ReactNode> = {
  'order_placed': <Package className="h-5 w-5" />,
  'processing': <Clock className="h-5 w-5" />,
  'picked_up': <Warehouse className="h-5 w-5" />,
  'in_transit': <Truck className="h-5 w-5" />,
  'shipped': <Truck className="h-5 w-5" />,
  'out_for_delivery': <MapPin className="h-5 w-5" />,
  'delivered': <Home className="h-5 w-5" />,
  'completed': <CheckCircle2 className="h-5 w-5" />,
};

export function OrderTrackingTimeline({ orderId, orderStatus, customerCity, orderDate }: OrderTrackingTimelineProps) {
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Define the order journey stages
  const journeyStages = [
    { 
      status: 'processing', 
      label: 'Order Placed & Processing', 
      icon: <Package className="h-5 w-5" />,
      description: 'Order confirmed and being prepared'
    },
    { 
      status: 'shipped', 
      label: 'Shipped', 
      icon: <Truck className="h-5 w-5" />,
      description: 'Package picked up and in transit'
    },
    { 
      status: 'out_for_delivery', 
      label: 'Out for Delivery', 
      icon: <MapPin className="h-5 w-5" />,
      description: 'Package is out for delivery in your area'
    },
    { 
      status: 'delivered', 
      label: 'Delivered', 
      icon: <Home className="h-5 w-5" />,
      description: 'Package delivered successfully'
    },
  ];

  // Map order status to journey stage index
  const getStageIndex = (status: string): number => {
    switch (status) {
      case 'processing': return 0;
      case 'shipped': return 1;
      case 'out_for_delivery': return 2;
      case 'delivered': return 3;
      case 'cancelled': return -1;
      default: return 0;
    }
  };

  const currentStageIndex = getStageIndex(orderStatus);

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

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 py-4">
        {[1, 2, 3, 4].map(i => (
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

  const isCancelled = orderStatus === 'cancelled';

  return (
    <div className="py-4 space-y-6">
      {/* Order Journey Timeline */}
      <div>
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" />
          Order Journey
        </h4>

        {isCancelled ? (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center">
            <p className="text-destructive font-medium">This order has been cancelled</p>
          </div>
        ) : (
          <div className="relative">
            {journeyStages.map((stage, index) => {
              const isCompleted = index < currentStageIndex;
              const isCurrent = index === currentStageIndex;
              const isPending = index > currentStageIndex;
              
              // Calculate estimated/actual times
              const orderDateTime = formatDateTime(orderDate);
              let stageTime = null;
              
              if (index === 0 && (isCompleted || isCurrent)) {
                stageTime = orderDateTime;
              }
              
              // Check if we have actual tracking data for this stage
              const trackingEvent = trackingEvents.find(e => e.status === stage.status);
              if (trackingEvent) {
                stageTime = formatDateTime(trackingEvent.timestamp);
              }

              return (
                <div key={stage.status} className="relative flex gap-4 pb-8 last:pb-0">
                  {/* Vertical line */}
                  {index < journeyStages.length - 1 && (
                    <div 
                      className={cn(
                        "absolute left-5 top-10 w-0.5 h-full -ml-px",
                        isCompleted ? "bg-green-500" : "bg-border"
                      )}
                    />
                  )}
                  
                  {/* Icon */}
                  <div className={cn(
                    "relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 flex-shrink-0 transition-all",
                    isCompleted && "bg-green-500 border-green-500 text-white",
                    isCurrent && "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20",
                    isPending && "bg-muted border-border text-muted-foreground"
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      stage.icon
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn(
                        "font-medium",
                        isCompleted && "text-green-600",
                        isCurrent && "text-primary",
                        isPending && "text-muted-foreground"
                      )}>
                        {stage.label}
                      </span>
                      {isCurrent && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full animate-pulse">
                          Current
                        </span>
                      )}
                      {isCompleted && (
                        <span className="text-xs bg-green-500/20 text-green-600 px-2 py-0.5 rounded-full">
                          Completed
                        </span>
                      )}
                    </div>
                    
                    <p className={cn(
                      "text-sm mt-1",
                      isPending ? "text-muted-foreground/60" : "text-muted-foreground"
                    )}>
                      {stage.description}
                    </p>
                    
                    {/* Location for delivered stage */}
                    {stage.status === 'delivered' && (isCompleted || isCurrent) && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{customerCity}</span>
                      </div>
                    )}
                    
                    {/* Show time if available */}
                    {stageTime && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        <Clock className="h-3 w-3" />
                        <span>{stageTime.date} at {stageTime.time}</span>
                      </div>
                    )}
                    
                    {/* Show tracking event location if available */}
                    {trackingEvent && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{trackingEvent.location}</span>
                        {trackingEvent.description && (
                          <span className="text-muted-foreground/70">- {trackingEvent.description}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed Tracking Events (if any) */}
      {trackingEvents.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-4 flex items-center gap-2 text-sm">
            <CircleDot className="h-4 w-4 text-primary" />
            Detailed Tracking Updates
          </h4>
          <div className="space-y-3">
            {trackingEvents.slice().reverse().map((event) => {
              const { date, time } = formatDateTime(event.timestamp);
              
              return (
                <div key={event.id} className="flex gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium capitalize">
                        {event.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">{event.location}</span>
                    </div>
                    {event.description && (
                      <p className="text-muted-foreground">{event.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {date} at {time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delivery Info */}
      {!isCancelled && currentStageIndex < 3 && (
        <div className="bg-secondary/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Delivery Address</p>
              <p className="text-sm text-muted-foreground">{customerCity}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {currentStageIndex === 0 && "Your order is being processed and will be shipped soon."}
                {currentStageIndex === 1 && "Your order is on its way! Expected delivery in 2-5 business days."}
                {currentStageIndex === 2 && "Your order will be delivered today!"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
