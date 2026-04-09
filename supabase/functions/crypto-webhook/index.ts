import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    console.log("RECEIVED_PAYLOAD:", JSON.stringify(payload))

    // 1. HARDENED DATA EXTRACTION
    // BlockCypher often lists multiple addresses; we need the one in our DB.
    const addresses = payload.addresses || []
    const txHash = payload.hash
    const totalSatoshis = payload.total

    // 2. Initialize Admin Client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. BROADCAST SEARCH: Try to find which address belongs to us
    let matchedAddress = null;
    for (const addr of addresses) {
      const { data } = await supabase.from('deposits').select('address').eq('address', addr).eq('status', 'PENDING').maybeSingle();
      if (data) { matchedAddress = addr; break; }
    }

    if (!matchedAddress) {
      console.log("SKIP: No matching PENDING deposit found in payload.");
      return new Response("No match", { status: 200 });
    }

    // 4. TRIGGER SQL SYNC
    const { error } = await supabase.rpc('confirm_crypto_deposit', {
      target_address: matchedAddress,
      transaction_id: txHash,
      satoshis_received: totalSatoshis
    })

    if (error) throw error

    return new Response(JSON.stringify({ success: true, address: matchedAddress }), { 
      headers: { "Content-Type": "application/json" },
      status: 200 
    })

  } catch (err) {
    console.error("WEBHOOK_CRASHED:", err.message)
    return new Response(err.message, { status: 500 })
  }
})