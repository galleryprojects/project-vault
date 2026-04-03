'use server';

// Fix: We import createClient directly so we can use it everywhere
import { createClient } from '@/lib/supabaseServer';
// Fix: We import the specific creator for the Service Role client
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { checkAdminBypass } from './admin-bypass';

interface VaultMedia {
  id: string;
  vault_id: string;
  file_url: string;
  tier: number;
  created_at?: string;
}

/**
 * [MASTER KEY] This client has "God Mode" permissions to bypass RLS.
 * It uses the SERVICE_ROLE_KEY from your .env.local
 */
const getAdminClient = () => {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! 
  );
};

/**
 * [1] ADMIN DATA: Fetch Master Vault Statistics
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
    console.error("Admin Stats Error:", error);
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
 * [2] ADMIN: Multi-Image Uploader
 * Uses the Service Role client to force upload through RLS
 */
export async function uploadVaultMedia(formData: FormData) {
  const isAuthorized = await checkAdminBypass();
  if (!isAuthorized) throw new Error("Unauthorized Access");

  const supabase = getAdminClient();
  
  const vaultId = formData.get('vaultId') as string;
  const tier = parseInt(formData.get('tier') as string);
  const files = formData.getAll('files') as File[];

  const uploadResults = [];

  for (const file of files) {
    const fileName = `${vaultId}/${Date.now()}-${file.name.replace(/\s/g, '_')}`;
    
    const { data: storageData, error: storageError } = await supabase.storage
      .from('vault-assets')
      .upload(fileName, file, { upsert: true });

    if (storageError) {
      console.error("Storage Error:", storageError);
      continue;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('vault-assets')
      .getPublicUrl(fileName);

    const { error: dbError } = await supabase
      .from('vault_media')
      .insert({
        vault_id: vaultId,
        file_url: publicUrl,
        tier: tier
      });

    if (!dbError) uploadResults.push(publicUrl);
  }

  return { 
    success: true, 
    count: uploadResults.length,
    message: `Successfully processed ${uploadResults.length} images for ${vaultId}.` 
  };
}

/**
 * [3] ADMIN: Fetch All Users and Balances
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
    console.error("User Registry Error:", error);
    return [];
  }

  return data;
}

/**
 * [4] ADMIN: Manual Balance Adjustment
 */
export async function adjustUserBalance(userId: string, amount: number) {
  const isAuthorized = await checkAdminBypass();
  if (!isAuthorized) return { success: false, error: "Unauthorized" };

  const supabase = await createClient();

  // Get current balance
  const { data: profile } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', userId)
    .single();

  const newBalance = (profile?.balance || 0) + amount;

  const { error } = await supabase
    .from('profiles')
    .update({ balance: newBalance })
    .eq('id', userId);

  if (error) return { success: false, error: error.message };
  return { success: true, newBalance };
}

