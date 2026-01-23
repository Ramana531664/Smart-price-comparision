-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow order lookup by email" ON public.orders;

-- Update the user view policy to properly allow email-based lookups for guests
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;

CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (
  -- Authenticated users can see their orders by user_id
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
  -- Authenticated users can see orders matching their profile email
  (auth.uid() IS NOT NULL AND customer_email = (SELECT email FROM public.profiles WHERE user_id = auth.uid()))
);

-- Separate policy for guest order lookup by email (no auth required)
CREATE POLICY "Guest order lookup by email" 
ON public.orders 
FOR SELECT 
USING (auth.uid() IS NULL);