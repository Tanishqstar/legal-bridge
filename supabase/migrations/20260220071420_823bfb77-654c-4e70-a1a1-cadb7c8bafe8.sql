
-- Create sessions table
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ratified')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('party_a', 'party_b')),
  content_original TEXT NOT NULL,
  content_translated TEXT,
  language_code TEXT NOT NULL DEFAULT 'en',
  intent TEXT NOT NULL DEFAULT 'inquiry' CHECK (intent IN ('offer', 'acceptance', 'inquiry')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create settlement_terms table
CREATE TABLE public.settlement_terms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  clause_title TEXT NOT NULL,
  clause_content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'disputed', 'rejected')),
  version INT NOT NULL DEFAULT 1,
  proposed_by TEXT NOT NULL DEFAULT 'party_a' CHECK (proposed_by IN ('party_a', 'party_b')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- For V1, allow all authenticated users to CRUD (we'll refine later with party-based access)
CREATE POLICY "Authenticated users can view sessions" ON public.sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create sessions" ON public.sessions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update sessions" ON public.sessions FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view messages" ON public.messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can view terms" ON public.settlement_terms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create terms" ON public.settlement_terms FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update terms" ON public.settlement_terms FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Enable realtime for messages and settlement_terms
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.settlement_terms;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_settlement_terms_updated_at
BEFORE UPDATE ON public.settlement_terms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
