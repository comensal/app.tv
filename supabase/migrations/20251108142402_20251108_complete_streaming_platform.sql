/*
  # Complete Streaming Platform Schema

  1. Core Tables
    - `organizations` - Empresas/plataformas (HBO Max, TV Express, etc)
    - `subscription_plans` - Planos de assinatura por organização
    - `users` - Usuários base
    - `user_subscriptions` - Subscriptions do usuário
    - `user_credits` - Sistema de créditos
    
  2. Content Management
    - `content` - Filmes e séries
    - `channels` - Canais de TV aberta
    - `watch_history` - Histórico de visualização

  3. Security
    - RLS em todas as tabelas
    - Admins gerenciam organizações
    - Usuários veem conteúdo da sua organização
*/

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  description text,
  theme_color text DEFAULT '#000000',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  is_admin boolean DEFAULT false,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price_monthly numeric DEFAULT 0,
  max_credits integer DEFAULT 0,
  max_simultaneous_streams integer DEFAULT 1,
  hd_quality boolean DEFAULT false,
  includes_channels boolean DEFAULT true,
  includes_movies boolean DEFAULT true,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status text DEFAULT 'active',
  current_credits integer DEFAULT 0,
  monthly_credits_limit integer DEFAULT 0,
  monthly_credits_used integer DEFAULT 0,
  expires_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('movie', 'series', 'episode')),
  title text NOT NULL,
  description text,
  poster_url text,
  backdrop_url text,
  category text,
  duration_minutes integer,
  release_date date,
  rating numeric CHECK (rating >= 0 AND rating <= 10),
  credits_cost integer DEFAULT 0,
  stream_url text,
  thumbnail_url text,
  director text,
  cast_info text,
  is_active boolean DEFAULT true,
  views_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  stream_url text NOT NULL,
  logo_url text,
  credits_cost integer DEFAULT 0,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  transaction_type text NOT NULL,
  description text,
  reference_id text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS watch_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id uuid REFERENCES content(id) ON DELETE SET NULL,
  channel_id uuid REFERENCES channels(id) ON DELETE SET NULL,
  watch_time integer DEFAULT 0,
  credits_spent integer DEFAULT 0,
  watched_at timestamptz DEFAULT now(),
  completed boolean DEFAULT false
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations visible to all"
  ON organizations FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage organizations"
  ON organizations FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE is_admin = true))
  WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE is_admin = true));

CREATE POLICY "Admins can insert organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE is_admin = true));

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR is_admin = true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Subscription plans visible to authenticated"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins manage subscription plans"
  ON subscription_plans FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true));

CREATE POLICY "Users see own subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true));

CREATE POLICY "Users can insert subscriptions"
  ON user_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users see content from subscribed org"
  ON content FOR SELECT
  TO authenticated
  USING (
    is_active = true AND (
      EXISTS (
        SELECT 1 FROM user_subscriptions
        WHERE user_subscriptions.user_id = auth.uid()
        AND user_subscriptions.organization_id = content.organization_id
        AND user_subscriptions.status = 'active'
      ) OR
      (SELECT is_admin FROM users WHERE users.id = auth.uid()) = true
    )
  );

CREATE POLICY "Admins manage content"
  ON content FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true));

CREATE POLICY "Users see channels from subscribed org"
  ON channels FOR SELECT
  TO authenticated
  USING (
    is_active = true AND (
      EXISTS (
        SELECT 1 FROM user_subscriptions
        WHERE user_subscriptions.user_id = auth.uid()
        AND user_subscriptions.organization_id = channels.organization_id
        AND user_subscriptions.status = 'active'
      ) OR
      (SELECT is_admin FROM users WHERE users.id = auth.uid()) = true
    )
  );

CREATE POLICY "Admins manage channels"
  ON channels FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true));

CREATE POLICY "Users see own credits"
  ON user_credits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins see all credits"
  ON user_credits FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true));

CREATE POLICY "Users see own history"
  ON watch_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert watch history"
  ON watch_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS organizations_slug_idx ON organizations(slug);
CREATE INDEX IF NOT EXISTS organizations_active_idx ON organizations(is_active);
CREATE INDEX IF NOT EXISTS users_organization_idx ON users(organization_id);
CREATE INDEX IF NOT EXISTS users_is_admin_idx ON users(is_admin);
CREATE INDEX IF NOT EXISTS subscription_plans_org_idx ON subscription_plans(organization_id);
CREATE INDEX IF NOT EXISTS subscription_plans_active_idx ON subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS user_subscriptions_user_idx ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS user_subscriptions_org_idx ON user_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS user_subscriptions_status_idx ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS content_org_idx ON content(organization_id);
CREATE INDEX IF NOT EXISTS content_type_idx ON content(type);
CREATE INDEX IF NOT EXISTS content_active_idx ON content(is_active);
CREATE INDEX IF NOT EXISTS channels_org_idx ON channels(organization_id);
CREATE INDEX IF NOT EXISTS channels_active_idx ON channels(is_active);
CREATE INDEX IF NOT EXISTS user_credits_user_idx ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS watch_history_user_idx ON watch_history(user_id);
