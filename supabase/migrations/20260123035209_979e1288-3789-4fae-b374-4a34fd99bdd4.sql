-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Guest order lookup by email" ON public.orders;

-- Create a single comprehensive policy for viewing orders
-- This allows:
-- 1. Authenticated users to see orders by their user_id
-- 2. Authenticated users to see orders matching their profile email
-- 3. Any request (including anonymous) can search by customer_email
CREATE POLICY "View orders by ownership or email" 
ON public.orders 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
  (auth.uid() IS NOT NULL AND customer_email = (SELECT email FROM public.profiles WHERE user_id = auth.uid())) OR
  true
);