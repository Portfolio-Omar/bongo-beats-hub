
-- Security flags table for tracking suspicious accounts
CREATE TABLE public.security_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  flag_type text NOT NULL, -- 'bot_detected', 'multi_account', 'suspicious_activity', 'manual'
  description text,
  severity text NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  resolved boolean NOT NULL DEFAULT false,
  resolved_by text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.security_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read all security flags" ON public.security_flags
  FOR SELECT USING (true);

CREATE POLICY "Admin insert security flags" ON public.security_flags
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin update security flags" ON public.security_flags
  FOR UPDATE USING (true);

CREATE POLICY "Admin delete security flags" ON public.security_flags
  FOR DELETE USING (true);

-- Device fingerprints for multi-account detection
CREATE TABLE public.device_fingerprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  fingerprint text NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read all fingerprints" ON public.device_fingerprints
  FOR SELECT USING (true);

CREATE POLICY "Users insert own fingerprints" ON public.device_fingerprints
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Account suspensions
CREATE TABLE public.account_suspensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reason text NOT NULL,
  suspended_by text,
  suspended_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  lifted_at timestamptz,
  lifted_by text
);

ALTER TABLE public.account_suspensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage suspensions" ON public.account_suspensions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Users read own suspension" ON public.account_suspensions
  FOR SELECT USING (auth.uid() = user_id);

-- Login activity tracking
CREATE TABLE public.login_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ip_address text,
  user_agent text,
  login_at timestamptz NOT NULL DEFAULT now(),
  is_suspicious boolean NOT NULL DEFAULT false
);

ALTER TABLE public.login_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read all login activity" ON public.login_activity
  FOR SELECT USING (true);

CREATE POLICY "Users insert own login activity" ON public.login_activity
  FOR INSERT WITH CHECK (auth.uid() = user_id);
