
-- Drop all existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can view sessions" ON public.sessions;
DROP POLICY IF EXISTS "Authenticated users can create sessions" ON public.sessions;
DROP POLICY IF EXISTS "Authenticated users can update sessions" ON public.sessions;
DROP POLICY IF EXISTS "Authenticated users can view messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can create messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can view terms" ON public.settlement_terms;
DROP POLICY IF EXISTS "Authenticated users can create terms" ON public.settlement_terms;
DROP POLICY IF EXISTS "Authenticated users can update terms" ON public.settlement_terms;
DROP POLICY IF EXISTS "Authenticated users can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated users can create audit logs" ON public.audit_logs;

-- Recreate as PERMISSIVE (default) + also allow anon for V1 demo (no auth yet)
CREATE POLICY "Anyone can view sessions" ON public.sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can create sessions" ON public.sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update sessions" ON public.sessions FOR UPDATE USING (true);

CREATE POLICY "Anyone can view messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Anyone can create messages" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update messages" ON public.messages FOR UPDATE USING (true);

CREATE POLICY "Anyone can view terms" ON public.settlement_terms FOR SELECT USING (true);
CREATE POLICY "Anyone can create terms" ON public.settlement_terms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update terms" ON public.settlement_terms FOR UPDATE USING (true);

CREATE POLICY "Anyone can view audit logs" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Anyone can create audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);
