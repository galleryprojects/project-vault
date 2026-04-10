// src/app/api/tg-hook/route.ts
import { NextResponse } from 'next/server';
import { approveDeposit, rejectDeposit } from '@/app/actions/admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.callback_query) return NextResponse.json({ ok: true });

    const { data, message } = body.callback_query;
    
    // Security Fix: Check the chat where the message actually lives
    const chatId = message.chat.id.toString();
    if (chatId !== process.env.TELEGRAM_CHAT_ID) return NextResponse.json({ ok: true });

    const messageId = message.message_id;
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

    // --- DYNAMIC TELEGRAM UPDATER ---
    // Safely gets the existing text whether it's a standard message or a photo caption
    const originalText = message.text || message.caption || '';
    const isPhoto = !!message.photo;
    const apiEndpoint = isPhoto ? 'editMessageCaption' : 'editMessageText';
    const textParam = isPhoto ? 'caption' : 'text';

    // Helper function to handle the fetch directly so it never fails on photos
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
    // ---------------------------------

    const parts = data.split('_');
    const action = parts[0];
    const subAction = parts[1];

    // [1] FIRST CLICK: Show Specific Options
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

    // [2] SECOND CLICK: Execute Action with Reason
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
        const status = res.success ? `❌ <b>Declined:</b> ${finalReason}` : `⚠️ <b>Error:</b> Update failed.`;
        await updateTgUI(`${originalText}\n\n${status}`);
      }
    }

    // [3] CANCEL CLICK: Reset to original buttons
    if (action === 'cancel') {
      const userId = parts[2];
      const amount = parts[3];
      
      // Cleanly strip away the confirmation question
      const cleanText = originalText.split('\n\n❓')[0];
      
      await updateTgUI(cleanText, [
        [
          { text: "Approve", callback_data: `pre_approve_${userId}_${amount}` },
          { text: "Decline", callback_data: `pre_reject_${userId}` }
        ]
      ]);
    }

    // Acknowledge the callback so the button stops loading
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