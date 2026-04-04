# PropertyPix Pro - Database Schema

Supabase PostgreSQL database.

---

## Tables

### users

User profiles and account info.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  plan TEXT DEFAULT 'free', -- 'free' | 'pro' | 'enterprise'
  credits INTEGER DEFAULT 5,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
```

---

### listings

Property listings.

```sql
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  address TEXT,
  price INTEGER,
  description TEXT,
  images TEXT[], -- Array of image URLs
  status TEXT DEFAULT 'draft', -- 'draft' | 'active' | 'archived'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_listings_user_id ON listings(user_id);
CREATE INDEX idx_listings_status ON listings(status);

-- RLS
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own listings" ON listings
  FOR ALL USING (auth.uid() = user_id);
```

---

### jobs

Processing job history.

```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL, -- 'enhance' | 'staging' | 'floorplan' | 'video'
  status TEXT DEFAULT 'pending', -- 'pending' | 'processing' | 'completed' | 'failed'
  input_url TEXT,
  output_url TEXT,
  params JSONB, -- Job-specific parameters
  error TEXT,
  credits_used INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);

-- RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own jobs" ON jobs
  FOR SELECT USING (auth.uid() = user_id);
```

---

### portals

External portal credentials (encrypted).

```sql
CREATE TABLE portals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  portal_name TEXT NOT NULL, -- 'immobilienscout24', 'immowelt', etc.
  credentials JSONB, -- Encrypted credentials
  status TEXT DEFAULT 'pending', -- 'pending' | 'connected' | 'error'
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_portals_user_id ON portals(user_id);

-- RLS
ALTER TABLE portals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own portals" ON portals
  FOR ALL USING (auth.uid() = user_id);
```

---

### credits

Credit transactions.

```sql
CREATE TABLE credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  amount INTEGER NOT NULL, -- Positive for purchases, negative for usage
  type TEXT NOT NULL, -- 'purchase' | 'usage' | 'bonus'
  description TEXT,
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_credits_user_id ON credits(user_id);
CREATE INDEX idx_credits_created_at ON credits(created_at DESC);
```

---

## Views

### user_credits_balance

Current credit balance per user.

```sql
CREATE VIEW user_credits_balance AS
SELECT 
  user_id,
  SUM(amount) AS balance
FROM credits
GROUP BY user_id;
```

### job_stats

Aggregated job statistics.

```sql
CREATE VIEW job_stats AS
SELECT 
  user_id,
  type,
  COUNT(*) AS total_jobs,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) FILTER (WHERE status = 'completed') AS avg_duration_seconds
FROM jobs
GROUP BY user_id, type;
```

---

## Functions

### handle_new_user()

Auto-create user profile on signup.

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

### decrement_credits()

Deduct credits atomically.

```sql
CREATE OR REPLACE FUNCTION decrement_credits(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  SELECT credits INTO current_balance FROM users WHERE id = p_user_id;
  
  IF current_balance < p_amount THEN
    RETURN FALSE;
  END IF;
  
  UPDATE users 
  SET credits = credits - p_amount,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Indexes Summary

| Table | Index | Purpose |
|-------|-------|---------|
| `users` | `id` (PK) | Primary key |
| `listings` | `user_id` | User's listings |
| `listings` | `status` | Filter by status |
| `jobs` | `user_id` | User's jobs |
| `jobs` | `status` | Queue processing |
| `jobs` | `created_at` | History ordering |
| `credits` | `user_id` | User transactions |
| `portals` | `user_id` | User's portals |

---

## Migrations

Migrations are managed via Supabase CLI:

```bash
# Create migration
supabase migration new add_xxx_column

# Apply migrations
supabase db push

# Reset database
supabase db reset
```

---

*Last updated: April 2026*
