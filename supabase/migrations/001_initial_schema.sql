-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══ USERS ═══
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nickname VARCHAR(50),
  phone VARCHAR(20),
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'user', -- user/owner/admin
  points INTEGER DEFAULT 0,
  xp INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ VENUES ═══
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(200) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  name_ko VARCHAR(200) NOT NULL,
  category VARCHAR(20) NOT NULL, -- club/night/lounge/room/yojeong/hoppa/collatek
  region VARCHAR(50) NOT NULL,
  region_ko VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  features JSONB DEFAULT '[]',
  atmosphere JSONB DEFAULT '[]',
  age_group VARCHAR(50),
  dress_code VARCHAR(100),
  best_time VARCHAR(100),
  parking VARCHAR(200),
  nearby_station VARCHAR(200),
  image_url TEXT,
  rating DECIMAL(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_premium BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  status VARCHAR(30) DEFAULT 'unknown', -- verified_open/unknown/closed_or_unclear
  open_hours VARCHAR(200),
  tags JSONB DEFAULT '[]',
  price_entry VARCHAR(100),
  price_table VARCHAR(100),
  price_drink VARCHAR(100),
  owner_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ REVIEWS ═══
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  rating DECIMAL(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT,
  atmosphere_rating INTEGER CHECK (atmosphere_rating >= 1 AND atmosphere_rating <= 5),
  service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  visit_date DATE,
  is_verified BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ EVENTS ═══
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time VARCHAR(50),
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ POSTS (Community) ═══
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  category VARCHAR(30) NOT NULL, -- free/reviews/tips/fashion/qna/party
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ COMMENTS ═══
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ RESERVATIONS ═══
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reservation_date DATE NOT NULL,
  party_size INTEGER DEFAULT 2,
  status VARCHAR(20) DEFAULT 'pending', -- pending/confirmed/cancelled
  special_requests TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ VENUE PRICES ═══
CREATE TABLE venue_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  item_name VARCHAR(200) NOT NULL,
  price INTEGER NOT NULL,
  category VARCHAR(50), -- entry/table/drink/food/package
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ SUBSCRIPTIONS (SaaS) ═══
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  venue_id UUID REFERENCES venues(id),
  plan VARCHAR(20) NOT NULL DEFAULT 'free', -- free/basic/pro/premium
  status VARCHAR(20) DEFAULT 'active', -- active/paused/cancelled
  price_monthly INTEGER DEFAULT 0,
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ INVOICES ═══
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES subscriptions(id),
  amount INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending/paid/failed
  paid_at TIMESTAMPTZ,
  invoice_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ ANALYTICS EVENTS ═══
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- page_view/reservation/review/search/click
  metadata JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ REFERRALS ═══
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES users(id),
  referred_id UUID REFERENCES users(id),
  reward_amount INTEGER DEFAULT 0,
  reward_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ WEBHOOK LOGS ═══
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'received', -- received/processed/failed
  response_code INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ INDEXES ═══
CREATE INDEX idx_venues_category ON venues(category);
CREATE INDEX idx_venues_region ON venues(region);
CREATE INDEX idx_venues_slug ON venues(slug);
CREATE INDEX idx_venues_active ON venues(is_active);
CREATE INDEX idx_venues_status ON venues(status);
CREATE INDEX idx_venues_premium ON venues(is_premium);
CREATE INDEX idx_reviews_venue ON reviews(venue_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_venue ON events(venue_id);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_user ON posts(user_id);
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_reservations_venue ON reservations(venue_id);
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_venue ON subscriptions(venue_id);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan);
CREATE INDEX idx_analytics_venue ON analytics_events(venue_id);
CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created ON analytics_events(created_at);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_webhook_logs_type ON webhook_logs(event_type);

-- ═══ UPDATED_AT TRIGGER ═══
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER venues_updated_at BEFORE UPDATE ON venues FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
