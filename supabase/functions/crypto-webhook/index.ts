import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    console.log("RECEIVED_PAYLOAD:", JSON.stringify(payload))

    // 1. Extract Data
    const address = payload.addresses ? payload.addresses[0] : null
    const txHash = payload.hash
    const totalSatoshis = payload.total
    const token = Deno.env.get('BLOCKCYPHER_TOKEN');

    if (!address || !txHash) {
      throw new Error("Missing address or hash in payload")
    }

    // 2. Connect to Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. Call the SQL "Magic" Function
    console.log(`Processing payment for: ${address}`)
    const { error } = await supabase.rpc('confirm_crypto_deposit', {
      target_address: address,
      transaction_id: txHash,
      satoshis_received: totalSatoshis
    })

    if (error) throw error

    return new Response(JSON.stringify({ success: true }), { 
      headers: { "Content-Type": "application/json" },
      status: 200 
    })

  } catch (err) {
    // THIS IS THE IMPORTANT PART: It forces the error into your logs
    console.error("WEBHOOK_CRASHED:", err.message)
    return new Response(JSON.stringify({ error: err.message }), { 
      headers: { "Content-Type": "application/json" },
      status: 500 
    })
  }
})