-- Create order_tracking table for detailed tracking history
CREATE TABLE public.order_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read tracking for their orders (matches orders policy)
CREATE POLICY "Anyone can view order tracking"
  ON public.order_tracking
  FOR SELECT
  USING (true);

-- Admins can insert/update tracking
CREATE POLICY "Admins can insert tracking"
  ON public.order_tracking
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update tracking"
  ON public.order_tracking
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_order_tracking_order_id ON public.order_tracking(order_id);
CREATE INDEX idx_order_tracking_timestamp ON public.order_tracking(timestamp DESC);

-- Enable realtime for tracking updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_tracking;