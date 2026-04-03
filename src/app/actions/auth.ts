'use server';

import { createClient } from '@/lib/supabaseServer';

// Helper to create a clean tracking ID for transactions (e.g., PV-XJ82K)
const generateTrackingId = () => `PV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

/**
 * [1] SIGN UP - GHOST EMAIL LOGIC
 * Creates a user with a virtual @v.io email based on their username.
 */
export async function signUpUser(formData: FormData) {
  const supabase = await createClient(); 
  
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

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
 * [4] UNLOCK VAULT - TIERED EDITION
 */
export async function unlockVault(vaultId: string, amount: number, tier: number = 1) {
  const supabase = await createClient(); 
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  // --- [NEW FIX: STOP DOUBLE CHARGING] ---
  // Check if they already bought this specific vault and tier
  if (vaultId !== "INITIAL_ENTRY") {
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', user.id)
      .eq('media_url', vaultId)
      .eq('tier', tier)
      .single();

    // If we find an order, do NOT charge them. Just return success.
    if (existingOrder) {
      return { success: true, message: "Already Unlocked" }; 
    }
  }
  // ---------------------------------------

  const { data: profile } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', user.id)
    .single();

  if (!profile || profile.balance < amount) {
    return { error: "Insufficient Credits." };
  }
  

  // 1. Deduct Credits
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ 
      balance: profile.balance - amount,
      // If this is the master $3.00 fee, we flip the global 'is_unlocked' switch
      ...(vaultId === "INITIAL_ENTRY" ? { is_unlocked: true } : {})
    })
    .eq('id', user.id);

  if (updateError) return { error: "Transaction Failed" };
  
  // 2. Log Specific Tier Purchase in the 'orders' table
  await supabase.from('orders').insert([{
    user_id: user.id,
    order_id: generateTrackingId(),
    item_type: 'MEDIA_SET',
    item_name: vaultId === "INITIAL_ENTRY" ? "INITIAL ACCESS" : `${vaultId.toUpperCase()} - BATCH ${tier}`, 
    amount: amount,
    status: 'UNLOCKED',
    media_url: vaultId, // Used as a reference for which vault was bought
    tier: tier 
  }]);

  return { success: true };
}

/**
 * [5] SUBMIT DEPOSIT
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

  if (error) return { error: "Database Sync Error." };
  return { success: true };
}

/**
 * [6] LOGOUT
 */
export async function logoutUser() {
  const supabase = await createClient(); 
  await supabase.auth.signOut();
}

/**
/**
 * [7] GET LEDGER
 * Fetches all transaction history (orders and deposits) for the user.
 */
export async function getLedger() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const [ordersRes, depositsRes] = await Promise.all([
    supabase.from('orders').select('*').eq('user_id', user.id),
    supabase.from('deposits').select('*').eq('user_id', user.id)
  ]);

  const history = [
    ...(ordersRes.data || []).map(item => ({
      id: item.id,
      displayId: item.order_id || item.id.toString().slice(0, 8),
      type: 'MEDIA',
      title: item.item_name,
      amount: item.amount,
      status: item.status,
      date: new Date(item.created_at).toLocaleDateString(),
      mediaUrl: item.media_url,
      tier: item.tier // [NEW FIX] Export the tier so the homepage knows!
    })),
    ...(depositsRes.data || []).map(item => ({
      id: item.id, 
      displayId: item.code || 'INTAKE',
      type: 'DEPOSIT',
      title: `${item.platform || 'SYSTEM'} PROTOCOL`,
      amount: item.amount || 0,
      status: item.status,
      date: new Date(item.created_at).toLocaleDateString(),
      mediaUrl: null,
      tier: null
    }))
  ];

  return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * [8] GET VAULT MEDIA
 * Returns all photos/videos associated with a specific vault ID.
 */
export async function getVaultMedia(vaultId: string) {
  const supabase = await createClient(); 
  const { data, error } = await supabase
    .from('vault_media')
    .select('*')
    .eq('vault_id', vaultId)
    .order('display_order', { ascending: true });

  if (error) return [];
  return data || [];
}

/**
/**
 * [9] GET VAULT COVERS & SLIDER MEDIA
 * Fetches ALL images grouped by vault, so the homepage slider works perfectly.
 */
export async function getVaultCovers() {
  const supabase = await createClient(); 
  const { data, error } = await supabase
    .from('vault_media')
    .select('*')
    .order('display_order', { ascending: true }); // Preserves your custom order!

  if (error) return [];
  
  const vaultsMap = new Map();
  for (const item of (data || [])) {
    if (!vaultsMap.has(item.vault_id)) {
      vaultsMap.set(item.vault_id, {
        vault_id: item.vault_id,
        media: [] // Array to hold all images for the slider
      });
    }
    // Push every image into the slider array
    vaultsMap.get(item.vault_id).media.push({
      file_url: item.file_url,
      tier: item.tier || 1,
      display_order: item.display_order || 1
    });
  }
  
  return Array.from(vaultsMap.values());
}

/**
 * [10] CHECK TIER ACCESS
 * Crucial for Tiered Decryption: returns an array of tier numbers (e.g., [1, 2])
 * that the user has already successfully paid for.
 */
export async function getUnlockedTiers(vaultId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('orders')
    .select('tier')
    .eq('user_id', user.id)
    .eq('media_url', vaultId);

  return data?.map(row => row.tier) || []; 
}