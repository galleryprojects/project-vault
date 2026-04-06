'use server';

import { createClient } from '@/lib/supabaseServer';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { checkAdminBypass } from './admin-bypass';
import { supabase } from '@/lib/supabase';
// [PATCH 1] Import AWS SDK for Cloudflare R2
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// --- PROTOCOL INTERFACES ---
interface VaultMedia {
  id: string;
  vault_id: string;
  file_url: string;
  tier: number;
  created_at?: string;
}

type AdminUploadResponse = 
  | { success: true; count: number; message: string }
  | { success: false; error: string };

// --- ADMIN_CLIENT_BYPASS (GOD_MODE) ---
// This uses the Service Role Key to bypass all RLS policies.
const getAdminClient = () => {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! 
  );
};

// [PATCH 2] Initialize Cloudflare R2 Client
const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

/**
 * [1] MEDIA_METRICS: ARCHIVE_STATS
 */
export async function getAdminVaultStats() {
  const isAuthorized = await checkAdminBypass();
  if (!isAuthorized) return [];

  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('vault_media')
    .select('*')
    .order('vault_id', { ascending: true });
  
  if (error || !data) {
    console.error("ADMIN_ERROR: // STATS_FETCH_FAILURE", error);
    return [];
  }

  const stats: Record<string, any> = {};
  
  (data as VaultMedia[]).forEach((item) => {
    if (!stats[item.vault_id]) {
      stats[item.vault_id] = { 
        id: item.vault_id, 
        total: 0, 
        tier1: 0, 
        tier2: 0, 
        tier3: 0 
      };
    }
    
    stats[item.vault_id].total += 1;
    if (item.tier === 1) stats[item.vault_id].tier1 += 1;
    if (item.tier === 2) stats[item.vault_id].tier2 += 1;
    if (item.tier === 3) stats[item.vault_id].tier3 += 1;
  });
  
  return Object.values(stats);
}


/**
 * [2] MEDIA_INJECTION: THE_FACTORY (HARDENED & PARALLEL)
 */
export async function uploadVaultMedia(formData: FormData): Promise<AdminUploadResponse> {
  try {
    const isAuthorized = await checkAdminBypass();
    if (!isAuthorized) return { success: false, error: "UNAUTHORIZED_PROTOCOL" };

    const supabase = getAdminClient();
    
    // Extract all arrays from the form
    const globalVaultId = formData.get('vaultId') as string;
    const files = formData.getAll('files') as File[];
    const slugs = formData.getAll('slugs') as string[];
    const prices = formData.getAll('prices') as string[];
    const startTimes = formData.getAll('startTimes') as string[];
    const tiers = formData.getAll('tiers') as string[];

    // Map files into upload promises for PARALLEL processing
    const uploadPromises = files.map(async (file, i) => {
      const currentVaultId = (slugs[i] || globalVaultId).toLowerCase().trim();
      const isVideo = file.type.startsWith('video/');
      const displayOrder = i === 0 ? 0 : 1; // Index 0 is always the Cover
      
      const fileName = `${currentVaultId}/${Date.now()}-${file.name.replace(/\s/g, '_')}`;

      // [PATCH 3] Upload to Cloudflare R2 instead of Supabase Storage
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      await r2.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileName,
        Body: fileBuffer,
        ContentType: file.type,
      }));

      // Generate the public URL (We use the endpoint for now, will update to custom domain later)
      const publicUrl = `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET_NAME}/${fileName}`;

      // 3. Insert metadata with Auto-Pilot logic
      const { error: dbError } = await supabase
        .from('vault_media')
        .insert({
          vault_id: currentVaultId,
          file_url: publicUrl,
          media_type: isVideo ? 'video' : 'image',
          tier: isVideo ? 99 : parseInt(tiers[i] || '1'),
          price: isVideo ? parseFloat(prices[i] || '2.00') : 0,
          start_time: isVideo ? parseInt(startTimes[i] || '0') : 0,
          display_order: displayOrder
        });

      if (dbError) throw new Error(`DB Error: ${dbError.message}`);
      return publicUrl;
    });

    // Run all uploads simultaneously
    const results = await Promise.all(uploadPromises);

    return { 
      success: true, 
      count: results.length,
      message: `SYNC_COMPLETE: ${results.length} assets injected.` 
    };
  } catch (err: any) {
    console.error("UPLOAD_FAILURE:", err);
    return { success: false, error: err.message || "INTERNAL_SYSTEM_FAILURE" };
  }
}

/**
 * [3] GHOST_REGISTRY: USER_ACCESS
 */
export async function getAdminUserRegistry() {
  const isAuthorized = await checkAdminBypass();
  if (!isAuthorized) return [];

  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, balance, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("REGISTRY_ERROR: // FETCH_FAILURE", error);
    return [];
  }

  return data;
}

/**
 * [4] CREDIT_MANIPULATION: MANUAL_ADJUST
 */
export async function adjustUserBalance(userId: string, amount: number) {
  const isAuthorized = await checkAdminBypass();
  if (!isAuthorized) return { success: false, error: "Unauthorized" };

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', userId)
    .single();

  const currentBalance = Number(profile?.balance) || 0;
  const newBalance = currentBalance + Number(amount);

  const { error } = await supabase
    .from('profiles')
    .update({ balance: newBalance })
    .eq('id', userId);

  if (error) return { success: false, error: error.message };
  return { success: true, newBalance };
}

/**
 * [5] DEPOSIT_VERIFY: INBOUND_MONITOR
 * Updated to fetch user_id_display for the Admin UI
 */
export async function getPendingDeposits() {
  const isAuthorized = await checkAdminBypass();
  if (!isAuthorized) return [];

  const supabase = getAdminClient();
  
  // We explicitly pull user_id_display from the profile join
  const { data, error } = await supabase
    .from('deposits')
    .select(`
      *,
      profiles!user_id (
        username,
        user_id_display
      )
    `)
    .eq('status', 'PENDING')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("DEPOSIT_FETCH_ERROR:", error);
    return [];
  }

  return data;
}


/**
 * [6] DEPOSIT_VERIFY: AUTHORIZE_SYNC
 * Hardened with full exports and error logging
 */
export async function approveDeposit(depositId: string, userId: string, amount: number) {
  const isAuthorized = await checkAdminBypass();
  if (!isAuthorized) return { success: false, error: "UNAUTHORIZED_PROTOCOL" };

  // Use the Admin Client (Service Role) to bypass all RLS policies
  const supabase = getAdminClient();

  // 1. Fetch current profile balance
  const { data: profile, error: profileFetchErr } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', userId)
    .single();

  if (profileFetchErr) return { success: false, error: "PROFILE_FETCH_FAILED" };

  const currentBalance = Number(profile?.balance) || 0;
  const injectionAmount = Number(amount);
  const newBalance = currentBalance + injectionAmount;

  // 2. Update the user balance
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ balance: newBalance })
    .eq('id', userId);

  if (profileError) return { success: false, error: "BALANCE_SYNC_FAILED" };

  // 3. Close the Deposit Loop
  // We use the exact 'id' from the deposit record
  const { error: depositError } = await supabase
    .from('deposits')
    .update({ status: 'SUCCESS' })
    .eq('id', depositId);

  if (depositError) {
    // Log the exact database error to the console for debugging
    console.error("DEPOSIT_LOOP_FAILURE_LOG:", depositError);
    return { success: false, error: `DEPOSIT_LOOP_FAILURE: ${depositError.message}` };
  }

  return { success: true, newBalance };
}

/**
 * [7] DEPOSIT_VERIFY: REJECT_CLAIM
 */
export async function rejectDeposit(depositId: string) {
  const isAuthorized = await checkAdminBypass();
  if (!isAuthorized) return { success: false, error: "UNAUTHORIZED_PROTOCOL" };

  const supabase = getAdminClient();

  const { error } = await supabase
    .from('deposits')
    .update({ status: 'FAILED' })
    .eq('id', depositId);

  if (error) return { success: false, error: "REJECTION_PROTOCOL_FAILED" };
  return { success: true };
}


/**
 * [8] MEDIA_MANAGER: Fetch Collection Gallery
 */
export async function getCollectionMedia(vaultId: string) {
  const isAuthorized = await checkAdminBypass();
  if (!isAuthorized) return [];

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('vault_media')
    .select('*')
    .eq('vault_id', vaultId)
    .order('display_order', { ascending: true });

  if (error) return [];
  return data;
}

/**
 * [9] MEDIA_MANAGER: Update Collection Settings
 */
export async function updateCollectionMetadata(oldVaultId: string, newVaultId: string, newTier: number) {
  const isAuthorized = await checkAdminBypass();
  if (!isAuthorized) return { success: false };

  const supabase = getAdminClient();
  const { error } = await supabase
    .from('vault_media')
    .update({ 
      vault_id: newVaultId.toLowerCase().trim(), 
      tier: newTier 
    })
    .eq('vault_id', oldVaultId);

  return { success: !error, error };
}

/**
 * [10] MEDIA_MANAGER: Swap Cover Image
 */
export async function setMediaAsCover(vaultId: string, mediaId: string) {
  const isAuthorized = await checkAdminBypass();
  if (!isAuthorized) return { success: false };

  const supabase = getAdminClient();

  // 1. Reset all assets in this vault to payload status (1)
  await supabase
    .from('vault_media')
    .update({ display_order: 1 })
    .eq('vault_id', vaultId);

  // 2. Set the chosen asset as primary (0)
  const { error } = await supabase
    .from('vault_media')
    .update({ display_order: 0 })
    .eq('id', mediaId);

  return { success: !error };
}

/**
 * [11] MEDIA_MANAGER: Delete Media Asset
 */
export async function deleteMediaAsset(mediaId: string, fileUrl: string) {
  const isAuthorized = await checkAdminBypass();
  if (!isAuthorized) return { success: false };

  const supabase = getAdminClient();

  // [PATCH 4] Delete from Cloudflare R2 instead of Supabase Storage
  try {
    // Extract the key from the URL (e.g. from https://.../bucket-name/vault/file.jpg)
    // This handles both direct R2 endpoints and custom domains
    const urlParts = fileUrl.split(`${process.env.R2_BUCKET_NAME}/`);
    const fileKey = urlParts.length > 1 ? urlParts[1] : fileUrl.split('/').slice(-2).join('/');
    
    await r2.send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileKey,
    }));
  } catch (err) {
    console.error("R2_DELETE_ERROR", err);
  }

  const { error } = await supabase
    .from('vault_media')
    .delete()
    .eq('id', mediaId);

  return { success: !error };
}


/**
 * [12] MEDIA_MANAGER: Add to Existing Collection
 */
export async function addMediaToCollection(vaultId: string, tier: number, files: File[]) {
  const isAuthorized = await checkAdminBypass();
  if (!isAuthorized) return { success: false };

  const supabase = getAdminClient();
  const results = [];

  for (const file of files) {
    const fileName = `${vaultId}/${Date.now()}-${file.name.replace(/\s/g, '_')}`;
    
    // [PATCH 5] Upload directly to Cloudflare R2
    try {
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      await r2.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileName,
        Body: fileBuffer,
        ContentType: file.type,
      }));

      const publicUrl = `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET_NAME}/${fileName}`;

      const { error: dbErr } = await supabase.from('vault_media').insert({
        vault_id: vaultId,
        file_url: publicUrl,
        tier: tier,
        display_order: 1 // Default as payload
      });

      if (!dbErr) results.push(publicUrl);
    } catch (err) {
      console.error("R2_UPLOAD_ERROR", err);
    }
  }

  return { success: true, count: results.length };
}

/**
 * [13] MEDIA_MANAGER: Swap Specific Asset File
 */
export async function swapMediaFile(mediaId: string, oldFileUrl: string, newFile: File) {
  const isAuthorized = await checkAdminBypass();
  if (!isAuthorized) return { success: false };

  const supabase = getAdminClient();

  // [PATCH 6] Swap logic for Cloudflare R2
  let publicUrl = "";

  try {
    // 1. Delete old file from R2
    const urlParts = oldFileUrl.split(`${process.env.R2_BUCKET_NAME}/`);
    const oldKey = urlParts.length > 1 ? urlParts[1] : oldFileUrl.split('/').slice(-2).join('/');
    
    await r2.send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: oldKey,
    }));

    // 2. Upload new file to R2
    const vaultId = oldKey.split('/')[0];
    const fileName = `${vaultId}/${Date.now()}-${newFile.name.replace(/\s/g, '_')}`;
    const fileBuffer = Buffer.from(await newFile.arrayBuffer());
    
    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      Body: fileBuffer,
      ContentType: newFile.type,
    }));

    publicUrl = `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET_NAME}/${fileName}`;
  } catch (err: any) {
    return { success: false, error: err.message || "R2_SWAP_ERROR" };
  }

  // 3. Update Database row with new URL
  const { error: dbErr } = await supabase
    .from('vault_media')
    .update({ file_url: publicUrl })
    .eq('id', mediaId);

  return { success: !dbErr, newUrl: publicUrl };
}

/**
 * [14] MEDIA_MANAGER: Update Specific Asset Details (Sneak Peeks)
 */
export async function updateAssetMetadata(assetId: string, price: string, startTime: number) {
  const isAuthorized = await checkAdminBypass();
  if (!isAuthorized) return { success: false };

  const supabase = getAdminClient();
  
  const { error } = await supabase
    .from('vault_media')
    .update({ 
      price: parseFloat(price), 
      start_time: startTime 
    })
    .eq('id', assetId);

  return { success: !error, error };
}