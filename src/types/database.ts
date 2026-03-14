export type VenueCategory = 'club' | 'night' | 'lounge' | 'room' | 'yojeong' | 'hoppa';
export type VenueStatus = 'verified_open' | 'unknown' | 'closed_or_unclear';
export type UserRole = 'user' | 'owner' | 'admin';
export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'premium';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';
export type InvoiceStatus = 'pending' | 'paid' | 'failed';
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';

export interface DbUser {
  id: string;
  email: string;
  nickname: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  points: number;
  xp: number;
  created_at: string;
  updated_at: string;
}

export interface DbVenue {
  id: string;
  slug: string;
  name: string;
  name_ko: string;
  category: VenueCategory;
  region: string;
  region_ko: string;
  address: string;
  description: string | null;
  short_description: string | null;
  features: string[];
  atmosphere: string[];
  age_group: string | null;
  dress_code: string | null;
  best_time: string | null;
  parking: string | null;
  nearby_station: string | null;
  image_url: string | null;
  rating: number;
  review_count: number;
  is_premium: boolean;
  is_verified: boolean;
  status: VenueStatus;
  open_hours: string | null;
  tags: string[];
  price_entry: string | null;
  price_table: string | null;
  price_drink: string | null;
  staff_nickname: string | null;
  staff_phone: string | null;
  district: string | null;
  owner_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbReview {
  id: string;
  venue_id: string | null;
  user_id: string | null;
  rating: number;
  content: string | null;
  atmosphere_rating: number | null;
  service_rating: number | null;
  value_rating: number | null;
  visit_date: string | null;
  is_verified: boolean;
  helpful_count: number;
  created_at: string;
}

export interface DbEvent {
  id: string;
  venue_id: string | null;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  image_url: string | null;
  is_featured: boolean;
  created_at: string;
}

export interface DbPost {
  id: string;
  user_id: string | null;
  category: string;
  title: string;
  content: string;
  likes: number;
  views: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbComment {
  id: string;
  post_id: string | null;
  user_id: string | null;
  content: string;
  likes: number;
  parent_id: string | null;
  created_at: string;
}

export interface DbReservation {
  id: string;
  venue_id: string | null;
  user_id: string | null;
  reservation_date: string;
  party_size: number;
  status: ReservationStatus;
  special_requests: string | null;
  created_at: string;
}

export interface DbVenuePrice {
  id: string;
  venue_id: string | null;
  item_name: string;
  price: number;
  category: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DbSubscription {
  id: string;
  user_id: string | null;
  venue_id: string | null;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  price_monthly: number;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
}

export interface DbInvoice {
  id: string;
  subscription_id: string | null;
  amount: number;
  status: InvoiceStatus;
  paid_at: string | null;
  invoice_url: string | null;
  created_at: string;
}

export interface DbAnalyticsEvent {
  id: string;
  venue_id: string | null;
  event_type: string;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface DbReferral {
  id: string;
  referrer_id: string | null;
  referred_id: string | null;
  reward_amount: number;
  reward_claimed: boolean;
  created_at: string;
}

export interface DbWebhookLog {
  id: string;
  event_type: string;
  payload: Record<string, unknown>;
  status: string;
  response_code: number | null;
  created_at: string;
}

// Supabase Database type for full type safety
export interface Database {
  public: {
    Tables: {
      users: { Row: DbUser; Insert: Partial<DbUser>; Update: Partial<DbUser> };
      venues: { Row: DbVenue; Insert: Partial<DbVenue>; Update: Partial<DbVenue> };
      reviews: { Row: DbReview; Insert: Partial<DbReview>; Update: Partial<DbReview> };
      events: { Row: DbEvent; Insert: Partial<DbEvent>; Update: Partial<DbEvent> };
      posts: { Row: DbPost; Insert: Partial<DbPost>; Update: Partial<DbPost> };
      comments: { Row: DbComment; Insert: Partial<DbComment>; Update: Partial<DbComment> };
      reservations: { Row: DbReservation; Insert: Partial<DbReservation>; Update: Partial<DbReservation> };
      venue_prices: { Row: DbVenuePrice; Insert: Partial<DbVenuePrice>; Update: Partial<DbVenuePrice> };
      subscriptions: { Row: DbSubscription; Insert: Partial<DbSubscription>; Update: Partial<DbSubscription> };
      invoices: { Row: DbInvoice; Insert: Partial<DbInvoice>; Update: Partial<DbInvoice> };
      analytics_events: { Row: DbAnalyticsEvent; Insert: Partial<DbAnalyticsEvent>; Update: Partial<DbAnalyticsEvent> };
      referrals: { Row: DbReferral; Insert: Partial<DbReferral>; Update: Partial<DbReferral> };
      webhook_logs: { Row: DbWebhookLog; Insert: Partial<DbWebhookLog>; Update: Partial<DbWebhookLog> };
    };
  };
}
