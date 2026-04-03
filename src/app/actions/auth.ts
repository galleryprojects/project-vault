'use server';

import { createClient } from '@/lib/supabaseServer';

// [NEW] Helper to create a clean tracking ID (e.g., PV-XJ82K)
const generateTrackingId = () => `PV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

/**
 * [1] SIGN UP - GHOST EMAIL LOGIC
 */
export async function signUpUser(formData: FormData) {
  const supabase = await createClient(); 
  
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  // Security Check: 7 char minimum as per UI
  if (password.length < 7) {
    return { error: "Security Breach: Passphrase must be at least 7 characters." };
  }

  if (password !== confirmPassword) {
    return { error: "Access Denied: Passphrases do not match." };
  }

  const internalIdentifier = `${username.toLowerCase()}@v.io`;

  const { error } = await supabase.auth.signUp({
    email: internalIdentifier,
    password,
    options: {
      data: { username },
    },
  });

  if (error) return { error: error.message };
  return { success: true };
}

/**
 * [2] LOGIN - GHOST EMAIL LOGIC
 */
export async function loginUser(formData: FormData) {
  const supabase = await createClient(); 
  
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const internalIdentifier = `${username.toLowerCase()}@v.io`;

  const { error } = await supabase.auth.signInWithPassword({
    email: internalIdentifier,
    password: password,
  });

  if (error) {
    return { error: "Authentication Failed: Invalid Credentials." };
  }

  return { success: true };
}

/**
 * [3] GET PROFILE - REAL-TIME BALANCE
 */
export async function getProfile() {
  const supabase = await createClient(); 
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}

/**
 * [4] UNLOCK VAULT - DYNAMIC CONTENT DECRYPTION
 * Now accepts vaultId and amount so it can handle any vault (e.g., 'mary')
 */
export async function unlockVault(vaultId: string, amount: number) {
  const supabase = await createClient(); 
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  const { data: profile } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', user.id)
    .single();

  // Check against the passed amount (e.g., 6.00)
  if (!profile || profile.balance < amount) {
    return { error: `Insufficient Credits. $${amount.toFixed(2)} Required.` };
  }

  const trackingId = generateTrackingId();

  // 1. Deduct the specific amount for THIS vault
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ 
      balance: profile.balance - amount 
    })
    .eq('id', user.id);

  if (updateError) return { error: "Transaction Failed" };
  
  // 2. Log the purchase using the dynamic vaultId (e.g., 'mary')
  await supabase.from('orders').insert([{
    user_id: user.id,
    order_id: trackingId,
    item_type: 'MEDIA_SET',
    item_name: vaultId.toUpperCase().replace(/-/g, ' '), 
    amount: amount,
    status: 'UNLOCKED',
    media_url: vaultId // Storing the vaultId here so we can check it later
  }]);

  return { success: true };
}

/**
 * [5] SUBMIT DEPOSIT - INTAKE TERMINAL
 */
export async function submitDeposit(formData: FormData) {
  const supabase = await createClient(); 
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { error: "Authentication Required" };

  const code = formData.get('code') as string;
  const method = formData.get('method') as string; 
  const platform = formData.get('platform') as string;
  const amountStr = formData.get('amount') as string;
  const status = formData.get('status') as string || 'PENDING';

  const amount = amountStr ? parseFloat(amountStr) : null;

  const { error } = await supabase
    .from('deposits')
    .insert([{ 
      user_id: user.id, 
      code: code || 'AUTO_GEN', 
      type: method,
      platform: platform,
      amount: amount,
      status: status 
    }]);

  if (error) {
    return { error: "Database Sync Error. Check SQL Constraints." };
  }
  
  return { success: true };
}

/**
 * [6] LOGOUT - CLEAR SESSION
 */
export async function logoutUser() {
  const supabase = await createClient(); 
  await supabase.auth.signOut();
}

/**
 * [7] GET LEDGER - FETCH ALL HISTORY
 * Updated to match your 'orders' table columns.
 */
export async function getLedger() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return [];

  // Parallel fetch for speed
  const [ordersRes, depositsRes] = await Promise.all([
    supabase.from('orders').select('*').eq('user_id', user.id),
    supabase.from('deposits').select('*').eq('user_id', user.id)
  ]);

  const history = [
    ...(ordersRes.data || []).map(item => ({
      id: item.id,
      displayId: item.order_id || item.id.toString().slice(0, 8), // [CHANGED]
      type: 'MEDIA',
      title: item.item_name, // [CHANGED]
      amount: item.amount,
      status: item.status,
      date: new Date(item.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
      mediaUrl: item.media_url // [CHANGED]
    })),
    ...(depositsRes.data || []).map(item => ({
      id: item.id, 
      displayId: item.code || 'INTAKE', // Matches the 'displayId' key in orders
      type: 'DEPOSIT',
      title: `${item.platform || 'SYSTEM'} PROTOCOL`,
      amount: item.amount || 0,
      status: item.status,
      date: new Date(item.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
      mediaUrl: null
    }))
  ];

  // Sort by newest first using the raw timestamp
  return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}


/**
 * [8] GET VAULT MEDIA - FETCH REAL PICTURES/VIDEOS
 */
export async function getVaultMedia(vaultId: string) {
  const supabase = await createClient(); 
  
  const { data, error } = await supabase
    .from('vault_media')
    .select('*')
    .eq('vault_id', vaultId)
    .order('display_order', { ascending: true }); // Keeps your photos in order

  if (error) {
    console.error("Database fetch error:", error);
    return [];
  }
  
  return data || [];
}

/**
 * [9] GET VAULT COVERS - FOR THE HOMEPAGE DASHBOARD
 */
export async function getVaultCovers() {
  const supabase = await createClient(); 
  
  // Fetch all media
  const { data, error } = await supabase
    .from('vault_media')
    .select('*')
    .order('created_at', { ascending: true }); 

  if (error) {
    console.error("Database fetch error:", error);
    return [];
  }
  
  // Filter out duplicates so we only get ONE cover per vault_id
  const covers = [];
  const seen = new Set();
  
  for (const item of (data || [])) {
    if (!seen.has(item.vault_id)) {
      seen.add(item.vault_id);
      covers.push({
        vault_id: item.vault_id,
        cover_url: item.file_url
      });
    }
  }
  
  return covers;
}


/**
 * [10] CHECK ACCESS - NEW
 * Verifies if the user has already purchased a specific vault
 */
export async function checkVaultAccess(vaultId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('orders')
    .select('id')
    .eq('user_id', user.id)
    .eq('media_url', vaultId) // We use media_url to store the vaultId reference
    .single();

  return !!data; // Returns true if they bought it, false if not
}