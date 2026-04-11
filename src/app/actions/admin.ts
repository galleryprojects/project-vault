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
 * [2] UPLOAD_MEDIA: THE_FACTORY (HARDENED & PARALLEL)
 */
/**
 * [GOD_MODE_PATCH]: Hardened Media Factory
 * This version strips hashtags from IDs before they reach the DB or R2.
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
    const durations = formData.getAll('durations') as string[];
    const tiers = formData.getAll('tiers') as string[];

    // Map files into upload promises for PARALLEL processing
    const uploadPromises = files.map(async (file, i) => {
      // [FIX 1]: Strip hashtags and spaces immediately. 
      // This ensures syexclusives.com/vault/nh6c works without %23%23 encoding.
      const rawVaultId = (slugs[i] || globalVaultId).toLowerCase().trim();
      const sanitizedId = rawVaultId.replace(/#/g, '').replace(/\s/g, '_');
      
      const isVideo = file.type.startsWith('video/');
      const displayOrder = i === 0 ? 0 : 1; // Index 0 is always the Cover

      // [FIX 2]: Use the clean sanitizedId for the Cloudflare R2 path
      const fileName = `${sanitizedId}/${Date.now()}-${file.name.replace(/\s/g, '_')}`;
      
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      await r2.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileName,
        Body: fileBuffer,
        ContentType: file.type,
      }));

      // Generate the public URL using your branded domain
      const publicUrl = `${process.env.R2_PUBLIC_DOMAIN}/${fileName}`;

      // [FIX 3]: Professional Price Logic
      // Uses your custom price if provided, otherwise defaults to 2.00 for videos.
      const rawPrice = prices[i];
      const finalPrice = isVideo ? parseFloat(rawPrice && rawPrice !== "" ? rawPrice : "2.00") : 0;

      // [FIX 4]: Insert metadata using the sanitized ID for the database
      const { error: dbError } = await supabase
        .from('vault_media')
        .insert({
          vault_id: sanitizedId, // No more ## stored in Supabase
          file_url: publicUrl,
          media_type: isVideo ? 'video' : 'image',
          tier: isVideo ? 99 : (parseInt(tiers[i] || '1') || 1),  
          price: finalPrice,
          start_time: isVideo ? parseInt(startTimes[i] || '0') : 0,
          duration: isVideo ? parseFloat(durations[i] || '0') : 0,
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
    return { success: false, error: err.message || "Failed" };
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
 * [6] DEPOSIT_VERIFY: AUTHORIZE_SYNC (Scrubbed & Silent)
 */
export async function approveDeposit(depositId: string, userId: string, amount: number) {
  const isAuthorized = await checkAdminBypass();
  
  // Silent Security: If not authorized and not a valid TG bypass, exit immediately.
  if (!isAuthorized && depositId !== "TG_AUTO") {
    return { success: false };
  }

  const supabase = getAdminClient();

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', userId)
      .single();

    if (!profile) return { success: false };

    const newBalance = (Number(profile.balance) || 0) + Number(amount);

    // 1. Inject Balance
    await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', userId);

    // 2. Close Loop
    if (depositId === "TG_AUTO") {
      await supabase
        .from('deposits')
        .update({ status: 'SUCCESS' })
        .eq('user_id', userId)
        .eq('status', 'PENDING');
    } else {
      await supabase
        .from('deposits')
        .update({ status: 'SUCCESS' })
        .eq('id', depositId);
    }

    return { success: true, newBalance };
  } catch (err) {
    console.error("SYNC_CRASH"); // Internal log only
    return { success: false };
  }
}

/**
 * [7] DEPOSIT_VERIFY: REJECT_CLAIM (Scrubbed & Silent)
 */
export async function rejectDeposit(identifier: string, reason: string = 'FAILED', isTelegram: boolean = false) {
  // We use your existing getAdminClient() which ALREADY has God-Mode
  const supabase = getAdminClient();

  if (!isTelegram) {
    const isAuthorized = await checkAdminBypass();
    if (!isAuthorized) return { success: false, error: "Unauthorized access" };
  }

  let targetId = identifier;

  if (isTelegram) {
     const { data, error: findError } = await supabase
        .from('deposits')
        .select('id')
        .eq('user_id', identifier)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

     if (findError) return { success: false, error: `Find Error: ${findError.message}` };
     if (!data) return { success: false, error: "No pending request found." };
     
     targetId = data.id;
  }

  // Execute the final update
  const { error } = await supabase
    .from('deposits')
    .update({ status: reason })
    .eq('id', targetId);

  if (error) return { success: false, error: `Supabase Error: ${error.message}` };
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
export async function addMediaToCollection(vaultId: string, tier: number, files: File[], durations: number[] = []) {
  const isAuthorized = await checkAdminBypass();
  if (!isAuthorized) return { success: false };

  const supabase = getAdminClient();
  const results = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const isVideo = file.type.startsWith('video/');
    const fileDuration = durations[i] || 0; // Grab the specific duration for this file

    const sanitizedVaultFolder = vaultId.replace(/#/g, '').replace(/\s/g, '_');
    const fileName = `${sanitizedVaultFolder}/${Date.now()}-${file.name.replace(/\s/g, '_')}`;

    try {
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      await r2.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileName,
        Body: fileBuffer,
        ContentType: file.type,
      }));

      const publicUrl = `${process.env.R2_PUBLIC_DOMAIN}/${fileName}`;

      const { error: dbErr } = await supabase.from('vault_media').insert({
        vault_id: vaultId,
        file_url: publicUrl,
        media_type: isVideo ? 'video' : 'image', // Ensures DB knows it's a video
        tier: tier,
        duration: fileDuration, // Injects the duration
        display_order: 1 
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
export async function swapMediaFile(mediaId: string, oldFileUrl: string, newFile: File, newDuration: number = 0) {
  const isAuthorized = await checkAdminBypass();
  if (!isAuthorized) return { success: false };

  const supabase = getAdminClient();
  let publicUrl = "";

  try {
    const urlParts = oldFileUrl.split(`${process.env.R2_BUCKET_NAME}/`);
    const oldKey = urlParts.length > 1 ? urlParts[1] : oldFileUrl.split('/').slice(-2).join('/');
    
    await r2.send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: oldKey,
    }));

    const vaultId = oldKey.split('/')[0];
    const sanitizedVaultFolder = vaultId.replace(/#/g, '').replace(/\s/g, '_');
    const fileName = `${sanitizedVaultFolder}/${Date.now()}-${newFile.name.replace(/\s/g, '_')}`;
    const fileBuffer = Buffer.from(await newFile.arrayBuffer());
    
    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      Body: fileBuffer,
      ContentType: newFile.type,
    }));

    publicUrl = `${process.env.R2_PUBLIC_DOMAIN}/${fileName}`;
  } catch (err: any) {
    return { success: false, error: err.message ||"SWAP ERROR" };
  }

  const isVideo = newFile.type.startsWith('video/');

  // Updates Database row with new URL AND the new duration
  const { error: dbErr } = await supabase
    .from('vault_media')
    .update({ 
      file_url: publicUrl,
      media_type: isVideo ? 'video' : 'image',
      duration: newDuration 
    })
    .eq('id', mediaId);

  return { success: !dbErr, newUrl: publicUrl };
}

/**
 * [14] EDIT_MEDIA: Update Specific Asset Details (Sneak Peeks)
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



/**
 * [15] VAULT_MANAGER: Delete Entire Vault
 */
export async function deleteEntireVault(vaultId: string) {
  const isAuthorized = await checkAdminBypass();
  if (!isAuthorized) return { success: false, error: "UNAUTHORIZED_PROTOCOL" };

  const supabase = getAdminClient();

  // 1. Fetch all media for this vault to delete from Cloudflare R2
  const { data: mediaAssets, error: fetchErr } = await supabase
    .from('vault_media')
    .select('file_url')
    .eq('vault_id', vaultId);

  if (fetchErr) return { success: false, error: fetchErr.message };

  // 2. Nuke all files from R2 Storage
  if (mediaAssets && mediaAssets.length > 0) {
    const deletePromises = mediaAssets.map(async (asset) => {
      try {
        const urlParts = asset.file_url.split(`${process.env.R2_BUCKET_NAME}/`);
        const fileKey = urlParts.length > 1 ? urlParts[1] : asset.file_url.split('/').slice(-2).join('/');
        
        await r2.send(new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: fileKey,
        }));
      } catch (err) {
        console.error(`R2_DELETE_ERROR for ${asset.file_url}`, err);
      }
    });
    await Promise.all(deletePromises);
  }

  // 3. Erase the Vault from the Database
  const { error: dbErr } = await supabase
    .from('vault_media')
    .delete()
    .eq('vault_id', vaultId);

  return { success: !dbErr, error: dbErr?.message };
}