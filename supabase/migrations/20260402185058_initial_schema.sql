-- Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT,
  balance NUMERIC DEFAULT 0,
  user_id_display TEXT,
  is_unlocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deposits Table
CREATE TABLE IF NOT EXISTS deposits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT,
  code TEXT,
  amount NUMERIC,
  status TEXT,
  platform TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders Table (Includes order_id and the NEW tier column)
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  order_id TEXT,
  item_name TEXT,
  item_type TEXT,
  amount NUMERIC,
  status TEXT,
  media_url TEXT,
  tier INT DEFAULT 1, -- [NEW] Tracks which batch the user bought
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vault Media Table (Includes the NEW tier column)
CREATE TABLE IF NOT EXISTS vault_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vault_id TEXT NOT NULL, 
  file_url TEXT NOT NULL, 
  media_type TEXT DEFAULT 'IMAGE', 
  price NUMERIC DEFAULT 0,
  tier INT DEFAULT 1, -- [NEW] Assigns picture to Batch 1 or Batch 2
  display_order INT DEFAULT 0, 
  start_time INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security Policies
-- [1] Enable Security (Safe to run multiple times)
ALTER TABLE vault_media ENABLE ROW LEVEL SECURITY;

-- [2] Drop the policy if it exists before creating it again
-- This prevents the "already exists" error
DROP POLICY IF EXISTS "Allow public read access" ON vault_media;

-- [3] Create the policy fresh
CREATE POLICY "Allow public read access" ON vault_media
  FOR SELECT USING (true);