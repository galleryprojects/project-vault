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
 * [4] UNLOCK VAULT - $3.00 FEE (UPDATED FOR 'ORDERS' TABLE)
 */
export async function unlockVault() {
  const supabase = await createClient(); 
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  // Get current balance
  const { data: profile } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', user.id)
    .single();

  if (!profile || profile.balance < 3.00) {
    return { error: "Insufficient Credits. Please Deposit." };
  }

  const trackingId = generateTrackingId();

  // 1. Deduct $3.00
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ 
      balance: profile.balance - 3.00,
      is_unlocked: true 
    })
    .eq('id', user.id);

  if (updateError) return { error: "Transaction Failed" };
  
  // 2. [CHANGED] LOG TO 'ORDERS' TABLE
  await supabase.from('orders').insert([{
    user_id: user.id,
    order_id: trackingId,      // New Column
    item_type: 'MEDIA',
    item_name: 'CYBER SET 01 (VIDEO)', 
    amount: 6.00,
    status: 'UNLOCKED',
    media_url: 'CS_01_VAULT.MP4'
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