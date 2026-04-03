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

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  order_id TEXT,
  item_name TEXT,
  item_type TEXT,
  amount NUMERIC,
  status TEXT,
  media_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- [1] Create the Media Table (The Shelf)
CREATE TABLE IF NOT EXISTS vault_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vault_id TEXT NOT NULL, -- This links to the URL (e.g., 'cyber-set-01')
  file_url TEXT NOT NULL, -- The link to your real picture/video
  media_type TEXT DEFAULT 'IMAGE', -- IMAGE or VIDEO
  display_order INT DEFAULT 0, -- Order of appearance
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- [2] Enable Security
ALTER TABLE vault_media ENABLE ROW LEVEL SECURITY;

-- [3] Access Policy: Anyone can view the records 
-- (We lock the actual files in Storage later)
CREATE POLICY "Allow public read access" ON vault_media
  FOR SELECT USING (true);