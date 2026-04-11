-- Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT,
  balance NUMERIC DEFAULT 0,
  user_id_display TEXT,
  is_unlocked BOOLEAN DEFAULT FALSE,
  has_onboarded BOOLEAN DEFAULT FALSE,
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
  address TEXT,
  derivation_index INT DEFAULT 0,
  txid TEXT,
  unique_deposit_address UNIQUE (address),
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
  duration NUMERIC DEFAULT 0;
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'OPENED' CHECK (status IN ('OPENED', 'PENDING', 'CLOSED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
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

-- 1. Explicitly enable Row Level Security for the table
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- 2. Allow users to INSERT a ticket (only if the user_id matches their own account)
CREATE POLICY "Users can create tickets" 
ON tickets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 3. Allow users to SELECT/VIEW their tickets (only their own)
CREATE POLICY "Users can view own tickets" 
ON tickets FOR SELECT 
USING (auth.uid() = user_id);  