'use server';


import { createClient } from '@/lib/supabaseServer';
import { generateCryptoAddress } from '@/lib/crypto/CryptoEngine';
import { createClient as createAdminClient } from '@supabase/supabase-js';

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

  // SAFETY CHECK: If username is missing, return early
  if (!username) {
    return { error: "Authentication Failed: Username is required." };
  }

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
    .select('*, has_onboarded')
    .eq('id', user.id)
    .single();

  return profile;
}

/**
 * [4] UNLOCK VAULT - TIERED EDITION (Amnesia Proof)
 */
export async function unlockVault(vaultId: string, amount: number, tier: number = 1) {
  const supabase = await createClient(); 
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  // --- [ THE IRON-CLAD DOUBLE CHARGE DEFENSE ] ---
  if (vaultId === "INITIAL_ENTRY") {
    // 1. Check if they already paid the $3 lifetime fee
    const { data: profileCheck } = await supabase.from('profiles').select('is_unlocked').eq('id', user.id).single();
    if (profileCheck?.is_unlocked) {
      return { success: true, message: "Already Unlocked" };
    }
  } else {
    // 2. Check if they already bought this specific vault/tier
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', user.id)
      .eq('media_url', vaultId)
      .eq('tier', tier)
      .single();

    if (existingOrder) {
      return { success: true, message: "Already Unlocked" }; 
    }
  }
  // ------------------------------------------------

  const { data: profile } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', user.id)
    .single();

  if (!profile || profile.balance < amount) {
    return { error: "Insufficient Credits." };
  }
  
  // Deduct Credits
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ 
      balance: profile.balance - amount,
      ...(vaultId === "INITIAL_ENTRY" ? { is_unlocked: true } : {})
    })
    .eq('id', user.id);

  if (updateError) return { error: "Transaction Failed" };
  
  // Log Purchase
  await supabase.from('orders').insert([{
    user_id: user.id,
    order_id: generateTrackingId(),
    item_type: 'MEDIA_SET',
    item_name: vaultId === "INITIAL_ENTRY" ? "INITIAL ACCESS" : `${vaultId.toUpperCase()} - BATCH ${tier}`, 
    amount: amount,
    status: 'UNLOCKED',
    media_url: vaultId,
    tier: tier 
  }]);

  return { success: true };
}
  

/**
 * [5] SUBMIT DEPOSIT (Bulletproof Edition)
 */
export async function submitDeposit(formData: FormData) {
  const supabase = await createClient();
  
  // 1. Auth Guard
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "AUTH_REQUIRED" };

  const method = formData.get('method') as string;
  const rawAmount = formData.get('amount');
  const amount = rawAmount ? parseFloat(rawAmount as string) : null; 

  try {
    if (method === 'CRYPTO') {
      const coin = formData.get('platform') as 'BTC' | 'LTC';

      // 1. Smart Resume: Return existing address if one is already pending
      const { data: existingPending } = await supabase
        .from('deposits')
        .select('address, derivation_index')
        .eq('user_id', user.id)
        .eq('platform', coin)
        .eq('status', 'PENDING')
        .maybeSingle();

      if (existingPending && existingPending.address) {
        return { 
          success: true, 
          address: existingPending.address,
          index: existingPending.derivation_index 
        };
      }

      // 2. Generate New Address
      const adminSupabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY! 
      );

      const { data: lastDeposit } = await adminSupabase
        .from('deposits')
        .select('derivation_index')
        .eq('platform', coin)
        .order('derivation_index', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextIndex = (lastDeposit?.derivation_index ?? -1) + 1;
      const uniqueAddress = generateCryptoAddress(coin, nextIndex);


      // 3. IMPORTANT: Save to Database FIRST
      // This ensures the row exists so the Webhook doesn't error out if it's fast.
      const { error: dbError } = await supabase
        .from('deposits')
        .insert([{
          user_id: user.id,
          type: 'CRYPTO',
          platform: coin,
          amount: amount, 
          status: 'PENDING',
          address:uniqueAddress,
          derivation_index: nextIndex
        }]);

      if (dbError) throw dbError;

      // 4. NOW: Register with BlockCypher
        try {
          const BLOCKCYPHER_TOKEN = process.env.BLOCKCYPHER_TOKEN;
          const WEBHOOK_URL = 'https://ltxdyydmerdqfvsvomwx.supabase.co/functions/v1/crypto-webhook';
          
          if (!BLOCKCYPHER_TOKEN) throw new Error("Missing Token");

          // [PATCH]: Change this block inside submitDeposit in auth.ts
          const hookRes = await fetch(`https://api.blockcypher.com/v1/${coin.toLowerCase()}/main/hooks?token=${BLOCKCYPHER_TOKEN}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'tx-confirmation', // Triggers on every confirmation
              confirmations: 0,         // 0 = Immediate mempool detection
              address: uniqueAddress,
              url: WEBHOOK_URL
            })
          });

          const hookData = await hookRes.json();
          console.log("BLOCKCYPHER_HOOK_ID:", hookData.id);
        } catch (webhookErr: any) {
          console.error("WEBHOOK_REGISTRATION_FAILED:", webhookErr.message);
        }

      return { success: true, address: uniqueAddress, index: nextIndex };
    }

    // ==========================================
    // BRANCH B: GIFT CARD LOGIC
    // ==========================================
    if (method === 'GIFTCARD') {
      const platform = formData.get('platform') as string;
      const code = formData.get('code') as string;

      const { error: dbError } = await supabase
        .from('deposits')
        .insert([{
          user_id: user.id,
          type: 'GIFTCARD',
          platform: platform,
          code: code,
          amount: amount,
          status: 'PENDING'
        }]);

      if (dbError) throw dbError;
      return { success: true };
    }

    return { error: "INVALID_METHOD" };

  } catch (err: any) {
    console.error("DEPOSIT_ERROR:", err);
    return { error: "ERRORxxo" };
  }
}

/**
 * [6] LOGOUT
 */
export async function logoutUser() {
  const supabase = await createClient(); 
  await supabase.auth.signOut();
}

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
      title: `${item.platform || 'SYSTEM'} PAYMENT`,
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


/**
 * [11] UNLOCK MEDIA ASSET - INDIVIDUAL SELECTION
 * Replaces tier-based unlocking with single-item reveals for Pay-Per-View videos.
 */
export async function unlockMediaAsset(mediaId: string, price: number, title: string) {
  const supabase = await createClient(); 
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required." };

  // 1. Check if this specific selection is already owned
  const { data: existing } = await supabase
    .from('orders')
    .select('id')
    .eq('user_id', user.id)
    .eq('media_url', mediaId) 
    .single();

  if (existing) return { success: true, message: "Selection already owned." };

  // 2. Verify Credits
  const { data: profile } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', user.id)
    .single();

  if (!profile || profile.balance < price) {
    return { error: "Insufficient credits for this selection." };
  }

  // 3. Process Transaction
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ balance: profile.balance - price })
    .eq('id', user.id);

  if (updateError) return { error: "Transaction could not be processed." };

  // 4. Log the permanent unlock specifically for this video
  await supabase.from('orders').insert([{
    user_id: user.id,
    order_id: `VLT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
    item_type: 'SINGLE_MEDIA',
    item_name: title,
    amount: price,
    status: 'UNLOCKED',
    media_url: mediaId,
    tier: 99 // Placed high so it doesn't trigger Image Tier unlocks
  }]);

  return { success: true };
}

/**
 * [12] GET UNLOCKED ASSETS
 * Fetches the IDs of all individual videos the user has unlocked.
 */
export async function getUnlockedAssets() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('orders')
    .select('media_url')
    .eq('user_id', user.id)
    .eq('item_type', 'SINGLE_MEDIA');

  return data?.map(row => row.media_url) || [];
}


export async function completeOnboardingAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { success: false };

  const { error } = await supabase
    .from('profiles')
    .update({ has_onboarded: true })
    .eq('id', user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}


/**
 * [13] INSTANT_SYNC: Manually check blockchain for unconfirmed balance
 * This credits the user as soon as the transaction is seen in the mempool.
 */
export async function syncCryptoDeposit(address: string, coin: string) {
  const supabase = await createClient();
  
  try {
    // 1. Fetch balance directly from BlockCypher (includes unconfirmed/mempool)
    const res = await fetch(`https://api.blockcypher.com/v1/${coin.toLowerCase()}/main/addrs/${address}/balance`);
    const data = await res.json();
    
    // total_received includes both confirmed and unconfirmed satoshis
    const totalSatoshis = data.total_received || 0;

    if (totalSatoshis > 0) {
      // 2. Trigger the SQL confirm function immediately
      const { error } = await supabase.rpc('confirm_crypto_deposit', {
        target_address: address,
        transaction_id: `MANUAL_SYNC_${Date.now()}`,
        satoshis_received: totalSatoshis
      });

      if (error) return { success: false, error: error.message };
      return { success: true };
    }
    
    return { success: false, error: "No transaction detected on the blockchain yet." };
  } catch (err: any) {
    console.error("SYNC_ERROR:", err.message);
    return { success: false, error: "Blockchain connection failed. Try again in 1 minute." };
  }
}