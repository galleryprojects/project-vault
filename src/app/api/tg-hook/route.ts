// src/app/api/tg-hook/route.ts
import { NextResponse } from 'next/server';
import { approveDeposit, rejectDeposit } from '@/app/actions/admin';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ==========================================
    // [NEW] PART 1: ADMIN CHAT REPLIES (DYNAMIC FOLDERS)
    // ==========================================
    if (body.message && body.message.text && body.message.message_thread_id) {
      
      // Ignore messages sent by the bot itself (like the initial ticket alert)
      if (body.message.from?.is_bot) return NextResponse.json({ ok: true });

      const threadId = body.message.message_thread_id.toString();
      const adminReply = body.message.text;

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY! 
      );

      // Find the exact ticket linked to this Telegram folder
      const { data: ticket, error: fetchErr } = await supabase
        .from('tickets')
        .select('id')
        .eq('telegram_thread_id', threadId)
        .single();

      if (ticket) {
        // Save reply into live chat history
        await supabase.from('ticket_messages').insert([{
          ticket_id: ticket.id,
          sender_type: 'ADMIN',
          message: adminReply
        }]);

        // Update status
        await supabase.from('tickets').update({ status: 'ANSWERED' }).eq('id', ticket.id);

        // 🚨 SEND CONFIRMATION TO ADMIN IN TELEGRAM
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: body.message.chat.id,
            message_thread_id: threadId,
            text: "✅ Sent to user!"
          })
        });

        return NextResponse.json({ ok: true }); 
      }
    }

    // ==========================================
    // PART 2: EXISTING INLINE BUTTON CLICKS (DEPOSITS)
    // ==========================================
    if (!body.callback_query) return NextResponse.json({ ok: true });

    const { data, message } = body.callback_query;
    
    // 🚨 GODMODE FIX: Whitelist all dedicated groups for button clicks
    const chatId = message.chat.id.toString();
    const allowedChats = [
      process.env.TELEGRAM_CHAT_ID,
      process.env.TELEGRAM_PHYSICAL_GC_GROUP_ID,
      process.env.TELEGRAM_ECODE_GC_GROUP_ID,
      process.env.TELEGRAM_CRYPTO_GROUP_ID
    ];

    if (!allowedChats.includes(chatId)) {
      return NextResponse.json({ ok: true });
    }

    const messageId = message.message_id;
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

    const originalText = message.text || message.caption || '';
    const isPhoto = !!message.photo;
    const apiEndpoint = isPhoto ? 'editMessageCaption' : 'editMessageText';
    const textParam = isPhoto ? 'caption' : 'text';

    const updateTgUI = async (newText: string, buttons?: any) => {
      const payload: any = {
        chat_id: chatId,
        message_id: messageId,
        [textParam]: newText,
        parse_mode: 'HTML'
      };
      if (buttons) payload.reply_markup = { inline_keyboard: buttons };

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${apiEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    };

    const parts = data.split('_');
    const action = parts[0];
    const subAction = parts[1];

    if (action === 'pre') {
      const userId = parts[2];
      
      if (subAction === 'approve') {
        const amount = parts[3];
        await updateTgUI(`${originalText}\n\n❓ <b>Confirm:</b> Add $${amount} to this member's balance?`, [
          [
            { text: "✅ Yes, Proceed", callback_data: `confirm_approve_${userId}_${amount}` },
            { text: "❌ Cancel", callback_data: `cancel_none_${userId}_${amount}` }
          ]
        ]);
      } else if (subAction === 'reject') {
        await updateTgUI(`${originalText}\n\n❓ <b>Select Rejection Reason:</b>`, [
          [
            { text: "Bad Card", callback_data: `confirm_reject_BADCARD_${userId}` },
            { text: "Wrong Code", callback_data: `confirm_reject_WRONGCODE_${userId}` }
          ],
          [
            { text: "🔙 Cancel", callback_data: `cancel_none_${userId}_0` }
          ]
        ]);
      }
    }

    if (action === 'confirm') {
      if (subAction === 'approve') {
        const userId = parts[2];
        const amount = parts[3];
        const res = await approveDeposit("TG_AUTO", userId, parseFloat(amount));
        const status = res.success ? `✅ <b>Approved:</b> Credit has been applied.` : `⚠️ <b>Error:</b> Update failed.`;
        await updateTgUI(`${originalText}\n\n${status}`);
      } 
      
      if (subAction === 'reject') {
        const reasonCode = parts[2];
        const tgtUser = parts[3];
        const finalReason = reasonCode === 'BADCARD' ? 'FAILED: BAD CARD' : 'FAILED: WRONG CODE';
        
        const res = await rejectDeposit(tgtUser, finalReason, true);
        const status = res.success 
          ? `❌ <b>Declined:</b> ${finalReason}` 
          : `⚠️ <b>Error:</b> ${res.error || 'System fault'}`;
          
        await updateTgUI(`${originalText}\n\n${status}`);
      }
    }

    if (action === 'cancel') {
      const userId = parts[2];
      const amount = parts[3];
      const cleanText = originalText.split('\n\n❓')[0];
      
      await updateTgUI(cleanText, [
        [
          { text: "Approve", callback_data: `pre_approve_${userId}_${amount}` },
          { text: "Decline", callback_data: `pre_reject_${userId}` }
        ]
      ]);
    }

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: body.callback_query.id })
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("TG HOOK ERROR:", err);
    return NextResponse.json({ ok: true });
  }
}