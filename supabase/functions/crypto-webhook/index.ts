import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    const addresses = payload.addresses || []
    const txHash = payload.hash
    const totalSatoshis = payload.total

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Find our address and what coin it uses
    let matchedAddress = null;
    let matchedCoin = 'BTC'; 
    
    for (const addr of addresses) {
      const { data } = await supabase.from('deposits').select('address, platform').eq('address', addr).order('created_at', { ascending: true }).limit(1).maybeSingle();
      if (data) { 
        matchedAddress = addr; 
        matchedCoin = data.platform || 'BTC';
        break; 
      }
    }

    if (!matchedAddress) return new Response("No match", { status: 200 });

    // 2. FETCH LIVE PRICE FROM BINANCE API (STRICT MODE - NO FALLBACK)
    const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${matchedCoin}USDT`);
    if (!res.ok) throw new Error("LIVE_PRICE_API_FAILED");
    const data = await res.json();
    const livePrice = parseFloat(data.price);

    // 3. Exact Math
    const exactUsdValue = (totalSatoshis / 100000000.0) * livePrice;

    // ==========================================
    // 🔒 THE SILENT LOCK PROTOCOL (WEBHOOK)
    // ==========================================
    if (exactUsdValue < 20) {
      console.warn(`[WEBHOOK LOCK] Dropping underpaid Tx: ${txHash}. Value: $${exactUsdValue}`);
      
      // Check if it was already locked by the manual Detect button
      const { data: existingTx } = await supabase
        .from('deposits')
        .select('id')
        .eq('tx_hash', txHash)
        .maybeSingle();

      if (!existingTx) {
        // Log it directly as UNDERPAID so it's locked forever.
        await supabase.from('deposits').insert({
          address: matchedAddress,
          platform: matchedCoin,
          amount: exactUsdValue,
          status: 'UNDERPAID',
          tx_hash: txHash
        });
      }

      // Return 200 OK so Blockcypher stops retrying, but DO NOT credit the user.
      return new Response(JSON.stringify({ success: true, note: "Locked as UNDERPAID" }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    // ==========================================

    // 4. Send the exact USD amount to the database (Proceed Normally)
    const { error } = await supabase.rpc('confirm_crypto_deposit', {
      target_address: matchedAddress,
      transaction_id: txHash,
      calculated_usd: exactUsdValue 
    })

    if (error) throw error

    return new Response(JSON.stringify({ success: true, address: matchedAddress, credited_usd: exactUsdValue }), { 
      headers: { "Content-Type": "application/json" },
      status: 200 
    })

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("WEBHOOK_CRASHED:", errorMessage)
    return new Response(errorMessage, { status: 500 }) // 500 status forces Blockcypher to retry later
  }
})