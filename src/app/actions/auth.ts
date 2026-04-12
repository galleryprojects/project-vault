'use server';


import { createClient } from '@/lib/supabaseServer';
import { generateCryptoAddress } from '@/lib/crypto/CryptoEngine';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { sendTelegramAlert, sendTelegramPhoto } from '@/lib/notifications';

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

      // 1. STATIC WALLET LOGIC: Get the user's permanent address
      // We no longer check for 'status: PENDING'. We just get the very first address they ever generated.
      const { data: existingWallet } = await supabase
        .from('deposits')
        .select('address, derivation_index')
        .eq('user_id', user.id)
        .eq('platform', coin)
        .order('created_at', { ascending: true }) // Grabs the oldest one (their permanent wallet)
        .limit(1);

      // If they EVER generated an address, return it forever. Do not create a new one.
      if (existingWallet && existingWallet.length > 0 && existingWallet[0].address) {
        return { 
          success: true, 
          address: existingWallet[0].address, 
          index: existingWallet[0].derivation_index 
        };
      }

      // 2. Generate New Address ONLY IF THIS IS THEIR FIRST TIME EVER
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

      // 3. Save Permanent Address Assignment to Database
      const { error: dbError } = await supabase
        .from('deposits')
        .insert([{
          user_id: user.id, 
          type: 'CRYPTO', 
          platform: coin, 
          amount: 0, 
          status: 'ASSIGNED', // Using 'ASSIGNED' instead of 'PENDING' to mark it as their forever wallet
          address: uniqueAddress, 
          derivation_index: nextIndex
        }]);
        
      if (dbError) throw dbError;

      // 4. Register Webhook for the new permanent address
      try {
        const BLOCKCYPHER_TOKEN = process.env.BLOCKCYPHER_TOKEN;
        if (BLOCKCYPHER_TOKEN) {
          await fetch(`https://api.blockcypher.com/v1/${coin.toLowerCase()}/main/hooks?token=${BLOCKCYPHER_TOKEN}`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              event: 'unconfirmed-tx', 
              confirmations: 0, 
              address: uniqueAddress, 
              url: 'https://ltxdyydmerdqfvsvomwx.supabase.co/functions/v1/crypto-webhook' 
            })
          });
        }
      } catch (e) {
        console.error("WEBHOOK_REGISTRATION_FAILED");
      }

      return { success: true, address: uniqueAddress, index: nextIndex };
    }

    // ==========================================
    // BRANCH B: GIFT CARD LOGIC
    // ==========================================
    // Inside submitDeposit...
    if (method === 'GIFTCARD') {
      const platform = formData.get('platform') as string;
      const gcType = formData.get('gcType') as string; 
      const code = gcType === 'PHYSICAL' ? '[ PHYSICAL UPLOAD ]' : formData.get('code') as string;

      // 1. Insert Deposit & Grab the ID
      const { data: depositRecord, error: dbError } = await supabase
        .from('deposits')
        .insert([{
          user_id: user.id,
          type: 'GIFTCARD',
          platform: platform,
          code: code,
          amount: amount,
          status: 'PENDING'
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      // 🚨 GODMODE: Dynamic "Topic-Per-User" Routing
      const targetGroupId = gcType === 'PHYSICAL' ? process.env.TELEGRAM_PHYSICAL_GC_GROUP_ID : process.env.TELEGRAM_ECODE_GC_GROUP_ID;
      let userThreadId: string | undefined = undefined;

      try {
        const adminSupabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        
        // Find if this user already has a topic in THIS specific group
        let query = adminSupabase.from('deposits')
            .select('telegram_thread_id')
            .eq('user_id', user.id)
            .not('telegram_thread_id', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1);
            
        // Keep Physical and E-Code folders strictly separated
        if (gcType === 'PHYSICAL') query = query.eq('code', '[ PHYSICAL UPLOAD ]');
        else query = query.neq('code', '[ PHYSICAL UPLOAD ]');
        
        const { data: previous } = await query;

        if (previous && previous.length > 0 && previous[0].telegram_thread_id) {
           userThreadId = previous[0].telegram_thread_id; // Reuse existing folder
        } else {
           // Create NEW User Folder
           const botToken = process.env.TELEGRAM_BOT_TOKEN;
           const shortId = user.id.slice(0, 8).toUpperCase();
           const topicName = `👤 USER ${shortId}`;
           
           const topicRes = await fetch(`https://api.telegram.org/bot${botToken}/createForumTopic`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ chat_id: targetGroupId, name: topicName })
           });
           const topicData = await topicRes.json();
           
           if (topicData.ok) {
             userThreadId = topicData.result.message_thread_id.toString();
             // Save it so we reuse it next time!
             await adminSupabase.from('deposits').update({ telegram_thread_id: userThreadId }).eq('id', depositRecord.id);
           }
        }
      } catch (err) {
        console.log("Topic Engine Bypassed (Did you run the SQL command?)");
      }

      // --- TELEGRAM NOTIFICATION ---
      const caption = `🚨 <b>New Gift Card Submission</b>\n\n` +
                      `👤 <b>User:</b> <code>${user.id.slice(0, 8)}</code>\n` +
                      `💳 <b>Brand:</b> ${platform}\n` +
                      `💰 <b>Amount:</b> $${amount}\n` +
                      `📝 <b>Format:</b> ${gcType}\n` +
                      (gcType === 'ECODE' ? `🔑 <b>Code:</b> <code>${code}</code>` : ``);

      const buttons = [[
          { text: "Approve", callback_data: `pre_approve_${user.id}_${amount}` },
          { text: "Decline", callback_data: `pre_reject_${user.id}` }
      ]];

      // 1. Try to send to the saved folder
      let tgResult;
      if (gcType === 'PHYSICAL') {
        const imageFile = formData.get('cardImage') as File;
        tgResult = await sendTelegramPhoto(imageFile, caption, buttons, userThreadId, targetGroupId);
      } else {
        tgResult = await sendTelegramAlert(caption, buttons, userThreadId, targetGroupId);
      }

      // ==========================================
      // 🚨 GODMODE: SELF-HEALING PROTOCOL
      // ==========================================
      if (tgResult && tgResult.ok === false && tgResult.description?.includes('thread not found')) {
        console.log("⚠️ Dead Folder Detected! Rebuilding user folder automatically...");
        
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const shortId = user.id.slice(0, 8).toUpperCase();
        const adminSupabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

        // 2. Build a brand new topic in Telegram
        const topicRes = await fetch(`https://api.telegram.org/bot${botToken}/createForumTopic`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: targetGroupId, name: `👤 USER ${shortId}` })
        });
        const topicData = await topicRes.json();
        console.log("X-RAY - TOPIC CREATION RESPONSE:", topicData);

        if (topicData.ok) {
          const newThreadId = topicData.result.message_thread_id.toString();
          
          // 3. Heal the Database: Wipe old dead IDs and assign the new healthy one
          await adminSupabase.from('deposits')
            .update({ telegram_thread_id: newThreadId })
            .eq('user_id', user.id);

          // 4. Resend the original message to the new folder
          if (gcType === 'PHYSICAL') {
            await sendTelegramPhoto(formData.get('cardImage') as File, caption, buttons, newThreadId, targetGroupId);
          } else {
            await sendTelegramAlert(caption, buttons, newThreadId, targetGroupId);
          }
          console.log("✅ Self-Healing Complete. Folder regenerated and message delivered.");
        }
      }

      return { success: true }
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
    // 🚨 PRO UPDATE: Chain the filters to force-hide 'UNDERPAID' and 'ASSIGNED'
    supabase.from('deposits')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'UNDERPAID')
      .neq('status', 'ASSIGNED')
  ]);

  const history = [
    ...(ordersRes.data || []).map(item => ({
      id: item.id,
      displayId: item.order_id || item.id.toString().slice(0, 8),
      type: 'MEDIA',
      title: item.item_name,
      amount: item.amount,
      status: item.status,
      date: item.created_at, // <-- FIX: Passing the RAW timestamp
      mediaUrl: item.media_url,
      tier: item.tier 
    })),
    ...(depositsRes.data || []).map(item => ({
      id: item.id, 
      displayId: item.id.toString().slice(0, 8).toUpperCase(),
      type: 'DEPOSIT',
      title: `${item.platform || 'SYSTEM'} PAYMENT`,
      amount: item.amount || 0,
      status: item.status,
      date: item.created_at, // <-- FIX: Passing the RAW timestamp
      mediaUrl: null,
      tier: null
    }))
  ];

  // FIX: Sorting by the raw timestamp guarantees exact chronological order
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
    // 1. Fetch blockchain transactions
    const res = await fetch(`https://api.blockcypher.com/v1/${coin.toLowerCase()}/main/addrs/${address}`);
    const data = await res.json();
    
    const allTxs = [...(data.unconfirmed_txrefs || []), ...(data.txrefs || [])];
    if (allTxs.length === 0) return { success: false, error: "No transactions detected yet." };

    // 2. FETCH LIVE PRICE FROM BINANCE API (STRICT MODE - NO FALLBACK)
    const priceRes = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${coin}USDT`);
    if (!priceRes.ok) throw new Error("LIVE_PRICE_API_FAILED"); 
    const priceData = await priceRes.json();
    const livePrice = parseFloat(priceData.price);

    let totalCredited = 0;

    // 3. Process each transaction with the exact Live Price
    for (const tx of allTxs) {
      if (tx.tx_output_n === -1) continue; // Skip outgoing transfers
      
      const exactUsdValue = (tx.value / 100000000.0) * livePrice;

      // ==========================================
      // 🔒 THE SILENT LOCK PROTOCOL (PHASE 1)
      // ==========================================
      if (exactUsdValue < 9.68) {
        // Check if we already locked this one to avoid duplicate errors
        const { data: existingTx } = await supabase
          .from('deposits')
          .select('id')
          .eq('tx_hash', tx.tx_hash)
          .maybeSingle();

        if (!existingTx) {
          await supabase.from('deposits').insert({
            address: address,
            platform: coin,
            amount: exactUsdValue,
            status: 'UNDERPAID',
            tx_hash: tx.tx_hash,
            // Ensure this doesn't accidentally trigger a balance update trigger
          });
          console.warn(`[SILENT LOCK] Blocked ${coin} Tx: ${tx.tx_hash} - Value: $${exactUsdValue}`);
        }
        
        continue; // 🛑 Halt processing for this transaction and move to the next
      }
      // ==========================================

      // If we pass the $20 check, proceed normally
      const { error } = await supabase.rpc('confirm_crypto_deposit', {
        target_address: address,
        transaction_id: tx.tx_hash,
        calculated_usd: exactUsdValue 
      });

      if (!error) totalCredited += exactUsdValue;
    }


    if (totalCredited > 0) {
      const cryptoGroupId = process.env.TELEGRAM_CRYPTO_GROUP_ID;
      let userThreadId: string | undefined = undefined;
      let depInfo: any = null;
      const adminSupabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

      try {
        // 1. Get user ID and check for existing crypto folder
        const { data } = await adminSupabase.from('deposits').select('user_id, telegram_thread_id').eq('address', address).limit(1).single();
        depInfo = data;
        
        if (depInfo?.telegram_thread_id) {
           userThreadId = depInfo.telegram_thread_id;
        } else if (depInfo?.user_id) {
           // Create the very first Crypto topic for this user
           const botToken = process.env.TELEGRAM_BOT_TOKEN;
           const shortId = depInfo.user_id.slice(0, 8).toUpperCase();
           const topicRes = await fetch(`https://api.telegram.org/bot${botToken}/createForumTopic`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ chat_id: cryptoGroupId, name: `👤 CRYPTO | ${shortId}` })
           });
           const topicData = await topicRes.json();
           
           if (topicData.ok) {
             userThreadId = topicData.result.message_thread_id.toString();
             await adminSupabase.from('deposits').update({ telegram_thread_id: userThreadId }).eq('address', address);
           }
        }
      } catch(e) {}

      // 2. Try to send to the saved/new folder
      const alertMsg = `⚡ <b>CRYPTO DEPOSIT CREDITED</b>\n\n🪙 <b>Coin:</b> ${coin}\n💵 <b>USD Value:</b> $${totalCredited.toFixed(2)}\n📥 <b>Wallet:</b> <code>${address.slice(0, 10)}...</code>`;
      let tgResult = await sendTelegramAlert(alertMsg, undefined, userThreadId, cryptoGroupId);

      // ==========================================
      // 🚨 GODMODE: CRYPTO SELF-HEALING PROTOCOL
      // ==========================================
      if (tgResult && tgResult.ok === false && tgResult.description?.includes('thread not found')) {
        console.log("⚠️ Dead Crypto Folder Detected! Rebuilding automatically...");
        
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const shortId = depInfo?.user_id ? depInfo.user_id.slice(0, 8).toUpperCase() : address.slice(0,8).toUpperCase();

        // 3. Build a brand new topic
        const topicRes = await fetch(`https://api.telegram.org/bot${botToken}/createForumTopic`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: cryptoGroupId, name: `👤 CRYPTO | ${shortId}` })
        });
        const topicData = await topicRes.json();

        if (topicData.ok) {
          const newThreadId = topicData.result.message_thread_id.toString();
          
          // 4. Heal the Database
          await adminSupabase.from('deposits').update({ telegram_thread_id: newThreadId }).eq('address', address);

          // 5. Resend the message to the new folder
          await sendTelegramAlert(alertMsg, undefined, newThreadId, cryptoGroupId);
          console.log("✅ Crypto Self-Healing Complete.");
        }
      }

      return { success: true };
    }

    return { success: false, error: "All visible transactions have already been credited." };

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("SYNC_ERROR:", errMsg);
    return { success: false, error: "Check failed. Ensure network is stable." };
  }
}



/**
 * [14] SUBMIT SUPPORT TICKET
 */
export async function submitSupportTicket(formData: FormData) {
  console.log("➡️ [1] Ticket Submission Started");
  
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log("❌ [2] Error: No user found. Session might be expired.");
      return { error: "AUTH_REQUIRED" };
    }
    console.log("✅ [2] User verified:", user.id.slice(0, 8));

    const category = formData.get('category') as string;
    const message = formData.get('message') as string;
    const imageFile = formData.get('image') as File | null;
    console.log(`✅ [3] Form Parsed. Category: ${category}`);

    console.log("➡️ [4] Attempting Database Insert...");
    const { data: ticket, error: dbError } = await supabase
      .from('tickets')
      .insert([{ user_id: user.id, category, message, status: 'OPENED' }])
      .select()
      .single();

    if (dbError) {
      console.error("❌ [4] DB FAULT:", dbError.message, dbError.details);
      return { error: `DB_ERROR: ${dbError.message}` };
    }
    console.log("✅ [4] Saved to DB! Ticket ID:", ticket.id.slice(0, 8));

    console.log("➡️ [5] Creating Dynamic Folder in Telegram...");
    
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const groupChatId = process.env.TELEGRAM_CHAT_ID;
    
    const shortId = ticket.id.slice(0, 8).toUpperCase();
    const topicName = `🎫 TICKET #${shortId}`;
    
    // Explicitly declare as string
    let dynamicThreadId: string | undefined = undefined;

    try {
      const topicRes = await fetch(`https://api.telegram.org/bot${botToken}/createForumTopic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chat_id: groupChatId, 
          name: topicName 
        })
      });
      const topicData = await topicRes.json();
      
      if (topicData.ok) {
        // 🚨 FIX: Force Telegram's integer into a strict String
        dynamicThreadId = topicData.result.message_thread_id.toString(); 
        console.log(`✅ Folder Created! Thread ID: ${dynamicThreadId}`);
      } else {
        console.error("❌ Telegram refused to create folder:", topicData);
      }
    } catch (err) {
      console.error("❌ Failed to contact Telegram API:", err);
    }

    const caption = `🚨 <b>NEW SUPPORT TICKET</b>\n\n` +
                    `👤 <b>User:</b> <code>${user.id.slice(0, 8)}</code>\n` +
                    `🎫 <b>Ticket:</b> #${shortId}\n` +
                    `🏷️ <b>Category:</b> ${category}\n\n` +
                    `💬 <b>Message:</b>\n<i>${message}</i>`;

    if (imageFile && imageFile.size > 0) {
      await sendTelegramPhoto(imageFile, caption, undefined, dynamicThreadId);
    } else {
      await sendTelegramAlert(caption, undefined, dynamicThreadId);
    }
    
    console.log("✅ [5] Ticket routed perfectly!");
    
    // 🚨 NEW: 4. Save the Thread ID and log the first message into the Chat History
    // 🚨 THE FIX: Use Admin Client to bypass RLS and force the save!
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (dynamicThreadId) {
      const { error: updateErr } = await adminSupabase
        .from('tickets')
        .update({ telegram_thread_id: dynamicThreadId })
        .eq('id', ticket.id);
        
      if (updateErr) console.error("❌ Failed to link Folder ID:", updateErr);
    }

    // Insert the first message into the live chat table using Admin Privileges
    await adminSupabase.from('ticket_messages').insert([{
      ticket_id: ticket.id,
      sender_type: 'USER',
      message: message
    }]);

    console.log("✅ [6] Chat History Initialized and Linked!");
    
    return { success: true };


  } catch (err: any) {
    console.error("❌ [FATAL CRASH]:", err);
    return { error: err.message || "Unknown Server Crash" };
  }
}

/**
 * [15] GET MY TICKETS (Upgraded for Chat History)
 */
export async function getMyTickets() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Grab the ticket AND all its messages at the same time
  const { data, error } = await supabase
    .from('tickets')
    .select('*, ticket_messages(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return [];
  
  return data.map(t => ({
    id: t.id,
    display_id: t.id.slice(0, 8).toUpperCase(),
    category: t.category,
    status: t.status,
    created_at: t.created_at,
    // Sort the messages chronologically (oldest at top, newest at bottom)
    messages: (t.ticket_messages || []).sort((a: any, b: any) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }));
}

/**
 * [16] USER REPLY TO TICKET
 */
export async function replyToTicket(ticketId: string, message: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "AUTH_REQUIRED" };

  // 1. Save user's message to DB
  await supabase.from('ticket_messages').insert([{
    ticket_id: ticketId,
    sender_type: 'USER',
    message: message
  }]);

  // 2. Change status back to OPENED so you know they replied
  await supabase.from('tickets').update({ status: 'OPENED' }).eq('id', ticketId);

  // 3. Get the Telegram Folder ID for this ticket
  const { data: ticket } = await supabase
    .from('tickets')
    .select('telegram_thread_id')
    .eq('id', ticketId)
    .single();
  
  // 4. Send their message directly into that specific Telegram Folder
  if (ticket?.telegram_thread_id) {
     const caption = `👤 <b>User Reply:</b>\n<i>${message}</i>`;
     await sendTelegramAlert(caption, undefined, ticket.telegram_thread_id);
  }

  return { success: true };
}


/**
 * [17] CHECK IF VIRGIN ACCOUNT
 * Returns true if the user has ZERO transaction history.
 */
export async function checkIsFirstTimer() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Check deposits table for any successful or pending entries
  const { count } = await supabase
    .from('deposits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  return count === 0;
}