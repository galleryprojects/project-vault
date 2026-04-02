'use server';

import { createClient } from '@/lib/supabaseServer';

/**
 * [1] SIGN UP - GHOST EMAIL LOGIC
 */
export async function signUpUser(formData: FormData) {
  const supabase = await createClient(); 
  
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  // Security Check: 6 char minimum
  if (password.length < 6) {
    return { error: "Security Breach: Passphrase must be at least 6 characters." };
  }

  if (password !== confirmPassword) {
    return { error: "Access Denied: Passphrases do not match." };
  }

  const internalIdentifier = `${username.toLowerCase()}@v.io`;

  const { data, error } = await supabase.auth.signUp({
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
 * [4] UNLOCK VAULT - ONE-TIME $6.00 FEE (UPDATED WITH LEDGER LOGGING)
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

  if (!profile || profile.balance < 6.00) {
    return { error: "Insufficient Credits. Please Deposit." };
  }

  // Deduct $6.00 and Set Unlocked to TRUE
  const { error } = await supabase
    .from('profiles')
    .update({ 
      balance: profile.balance - 6.00,
      is_unlocked: true 
    })
    .eq('id', user.id);

  if (error) return { error: "Transaction Failed" };
  
  // LOG TO LEDGER (This powers the Order History page)
  await supabase.from('ledger').insert([{
    user_id: user.id,
    type: 'MEDIA',
    title: 'CYBER SET 01 (VIDEO)', // Update this if you have dynamic vault names
    amount: 6.00,
    status: 'UNLOCKED',
    file_name: 'CS_01_VAULT.MP4'
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
    console.error("DB Error:", error);
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
 * [7] GET LEDGER - FETCH ALL HISTORY FOR ORDER PAGE
 * This pulls from both the 'ledger' and 'deposits' tables.
 */
export async function getLedger() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return [];

  // Fetch Media buys
  const { data: ledgerItems } = await supabase
    .from('ledger')
    .select('*')
    .eq('user_id', user.id);

  // Fetch Money in
  const { data: depositItems } = await supabase
    .from('deposits')
    .select('*')
    .eq('user_id', user.id);

  // Combine and format for the frontend VaultEntry type
  const history = [
    ...(ledgerItems || []).map(item => ({
      id: item.id.toString().slice(0, 8),
      type: 'MEDIA',
      title: item.title,
      amount: item.amount,
      status: item.status,
      date: new Date(item.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
      fileName: item.file_name
    })),
    ...(depositItems || []).map(item => ({
      id: item.code || 'INTAKE',
      type: 'DEPOSIT',
      title: `${item.platform || 'SYSTEM'} PROTOCOL`,
      amount: item.amount || 0,
      status: item.status,
      date: new Date(item.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
      fileName: null
    }))
  ];

  // Sort by newest first
  return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}