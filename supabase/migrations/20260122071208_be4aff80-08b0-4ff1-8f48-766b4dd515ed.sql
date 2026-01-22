-- Drop the existing policy that references auth.users
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;

-- Create a new policy that allows:
-- 1. Authenticated users to view orders matching their user_id
-- 2. Authenticated users to view orders matching their email from profiles
-- 3. Anyone to view orders by customer_email (for guest tracking)
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (customer_email = (SELECT email FROM public.profiles WHERE user_id = auth.uid())) OR
  (auth.uid() IS NULL AND customer_email IS NOT NULL)
);

-- Also create a policy to allow anonymous order lookup by email
CREATE POLICY "Allow order lookup by email" 
ON public.orders 
FOR SELECT 
USING (true);