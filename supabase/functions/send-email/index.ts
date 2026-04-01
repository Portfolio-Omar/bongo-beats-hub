import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_NAME = "Bongo Old Skool";
const SITE_URL = "https://oldskoool.netlify.app";
const LOGO_URL = "https://fyspaszcchdknujhwpfs.supabase.co/storage/v1/object/public/avatars/site-logo.png";
const ADMIN_EMAIL = "omaryw003@gmail.com";

const baseTemplate = (content: string) => {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#d4af37,#b8860b);padding:30px;text-align:center;">
<img src="${LOGO_URL}" alt="${SITE_NAME}" width="80" height="80" style="border-radius:50%;margin-bottom:12px;border:3px solid rgba(255,255,255,0.3);" />
<h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;letter-spacing:0.5px;">${SITE_NAME}</h1>
<p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:13px;">Classic Bongo Flava Music</p>
</td></tr>
<tr><td style="padding:32px 30px;">
${content}
</td></tr>
<tr><td style="background-color:#fafafa;padding:20px 30px;text-align:center;border-top:1px solid #e4e4e7;">
<p style="color:#71717a;font-size:12px;margin:0 0 8px;">
<a href="${SITE_URL}" style="display:inline-block;background:linear-gradient(135deg,#d4af37,#b8860b);color:#ffffff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:13px;">Visit ${SITE_NAME}</a>
</p>
<p style="color:#a1a1aa;font-size:11px;margin:8px 0 0;">
&copy; ${new Date().getFullYear()} ${SITE_NAME}. All rights reserved.
</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
};

const btn = (text: string, url: string) =>
  `<div style="text-align:center;margin:28px 0;"><a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#d4af37,#b8860b);color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">${text}</a></div>`;

const templates: Record<string, (data: any) => { subject: string; html: string }> = {
  welcome: (data) => ({
    subject: `Welcome to ${SITE_NAME}!`,
    html: baseTemplate(`
<h2 style="color:#18181b;margin:0 0 16px;font-size:22px;">Karibu, ${data.name || "Music Lover"}!</h2>
<p style="color:#3f3f46;line-height:1.6;">Welcome to <strong>${SITE_NAME}</strong> - your home for classic Bongo Flava music from the golden 2000s era.</p>
<p style="color:#3f3f46;line-height:1.6;">Here is what you can do:</p>
<ul style="color:#3f3f46;line-height:1.8;">
<li>Stream hundreds of classic Bongo Flava tracks</li>
<li>Earn KSh by listening to music (after registration fee)</li>
<li>Create playlists and save favorites</li>
<li>Compete on our leaderboard</li>
</ul>
${btn("Start Listening", SITE_URL + "/music")}
<p style="color:#71717a;font-size:13px;">To activate earnings, pay a one-time KSh 150 registration fee via M-Pesa Buy Goods to <strong>4097548</strong>.</p>
`),
  }),

  payment_submitted: (data) => ({
    subject: `Payment Received - ${SITE_NAME}`,
    html: baseTemplate(`
<h2 style="color:#18181b;margin:0 0 16px;">Payment Submitted Successfully</h2>
<p style="color:#3f3f46;line-height:1.6;">Hi ${data.name || "there"},</p>
<p style="color:#3f3f46;line-height:1.6;">We have received your M-Pesa payment with code <strong>${data.mpesa_code}</strong> for KSh ${data.amount || 150}.</p>
<div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0;">
<p style="color:#166534;margin:0;font-weight:600;">Your payment is under review</p>
<p style="color:#15803d;margin:8px 0 0;font-size:14px;">Our admin team will verify it shortly. You will receive a confirmation email once approved.</p>
</div>
${btn("View Your Profile", SITE_URL + "/profile")}
`),
  }),

  payment_verified: (data) => ({
    subject: `Payment Verified - Start Earning! - ${SITE_NAME}`,
    html: baseTemplate(`
<h2 style="color:#18181b;margin:0 0 16px;">Payment Verified!</h2>
<p style="color:#3f3f46;line-height:1.6;">Hi ${data.name || "there"},</p>
<p style="color:#3f3f46;line-height:1.6;">Great news! Your registration payment has been verified. You can now earn KSh by listening to music!</p>
<div style="background-color:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:20px 0;">
<p style="color:#854d0e;margin:0;font-weight:600;">Earning Rate: KSh 1.5 per song</p>
<p style="color:#a16207;margin:8px 0 0;font-size:14px;">Share to boost to KSh 3, or buy a Booster for even higher rates!</p>
</div>
${btn("Start Earning Now", SITE_URL + "/monetization")}
`),
  }),

  payment_rejected: (data) => ({
    subject: `Payment Not Verified - ${SITE_NAME}`,
    html: baseTemplate(`
<h2 style="color:#18181b;margin:0 0 16px;">Payment Verification Failed</h2>
<p style="color:#3f3f46;line-height:1.6;">Hi ${data.name || "there"},</p>
<p style="color:#3f3f46;line-height:1.6;">Unfortunately, your payment with M-Pesa code <strong>${data.mpesa_code || "N/A"}</strong> could not be verified.</p>
${data.notes ? `<p style="color:#3f3f46;line-height:1.6;"><strong>Reason:</strong> ${data.notes}</p>` : ""}
${btn("Resubmit Payment", SITE_URL + "/profile")}
`),
  }),

  reward_milestone: (data) => ({
    subject: `Milestone Reached! - ${SITE_NAME}`,
    html: baseTemplate(`
<h2 style="color:#18181b;margin:0 0 16px;">Congratulations!</h2>
<p style="color:#3f3f46;line-height:1.6;">Hi ${data.name || "there"},</p>
<p style="color:#3f3f46;line-height:1.6;">You have reached an amazing milestone:</p>
<div style="background-color:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
<p style="color:#0369a1;margin:0;font-size:28px;font-weight:700;">${data.milestone}</p>
<p style="color:#0284c7;margin:8px 0 0;font-size:14px;">${data.description || "Keep listening and earning!"}</p>
</div>
${btn("Keep Listening", SITE_URL + "/music")}
`),
  }),

  referral_bonus: (data) => ({
    subject: `Referral Bonus Earned! - ${SITE_NAME}`,
    html: baseTemplate(`
<h2 style="color:#18181b;margin:0 0 16px;">Referral Bonus!</h2>
<p style="color:#3f3f46;line-height:1.6;">Hi ${data.name || "there"},</p>
<p style="color:#3f3f46;line-height:1.6;">Your friend has listened to 10 songs, and you have earned a <strong>KSh 10</strong> referral bonus!</p>
<div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0;text-align:center;">
<p style="color:#166534;margin:0;font-size:24px;font-weight:700;">+KSh 10</p>
<p style="color:#15803d;margin:8px 0 0;">Added to your balance</p>
</div>
${btn("View Your Earnings", SITE_URL + "/monetization")}
`),
  }),

  withdrawal_submitted: (data) => ({
    subject: `Withdrawal Request - ${SITE_NAME}`,
    html: baseTemplate(`
<h2 style="color:#18181b;margin:0 0 16px;">Withdrawal Request Submitted</h2>
<p style="color:#3f3f46;line-height:1.6;">Hi ${data.name || "there"},</p>
<p style="color:#3f3f46;line-height:1.6;">Your withdrawal request has been received:</p>
<table style="width:100%;margin:20px 0;border-collapse:collapse;">
<tr><td style="padding:8px 0;color:#71717a;">Amount</td><td style="padding:8px 0;font-weight:600;color:#18181b;">KSh ${data.amount}</td></tr>
<tr><td style="padding:8px 0;color:#71717a;">Method</td><td style="padding:8px 0;font-weight:600;color:#18181b;">${(data.payment_method || "M-PESA").toUpperCase()}</td></tr>
<tr><td style="padding:8px 0;color:#71717a;">Details</td><td style="padding:8px 0;font-weight:600;color:#18181b;">${data.payment_details || "N/A"}</td></tr>
</table>
<p style="color:#71717a;font-size:13px;">Processing usually takes 24-48 hours.</p>
${btn("Track Your Withdrawal", SITE_URL + "/monetization")}
`),
  }),

  withdrawal_approved: (data) => ({
    subject: `Withdrawal Approved - ${SITE_NAME}`,
    html: baseTemplate(`
<h2 style="color:#18181b;margin:0 0 16px;">Withdrawal Approved!</h2>
<p style="color:#3f3f46;line-height:1.6;">Hi ${data.name || "there"},</p>
<p style="color:#3f3f46;line-height:1.6;">Your withdrawal of <strong>KSh ${data.amount}</strong> has been approved and sent to your ${(data.payment_method || "M-Pesa").toUpperCase()} account.</p>
<div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0;text-align:center;">
<p style="color:#166534;margin:0;font-size:24px;font-weight:700;">KSh ${data.amount}</p>
<p style="color:#15803d;margin:8px 0 0;">Successfully processed</p>
</div>
<table style="width:100%;margin:20px 0;border-collapse:collapse;">
<tr><td style="padding:8px 0;color:#71717a;">Method</td><td style="padding:8px 0;font-weight:600;color:#18181b;">${(data.payment_method || "M-Pesa").toUpperCase()}</td></tr>
<tr><td style="padding:8px 0;color:#71717a;">Details</td><td style="padding:8px 0;font-weight:600;color:#18181b;">${data.payment_details || "N/A"}</td></tr>
</table>
${btn("View Your Balance", SITE_URL + "/monetization")}
`),
  }),

  withdrawal_rejected: (data) => ({
    subject: `Withdrawal Request Declined - ${SITE_NAME}`,
    html: baseTemplate(`
<h2 style="color:#18181b;margin:0 0 16px;">Withdrawal Request Declined</h2>
<p style="color:#3f3f46;line-height:1.6;">Hi ${data.name || "there"},</p>
<p style="color:#3f3f46;line-height:1.6;">Unfortunately, your withdrawal request of <strong>KSh ${data.amount}</strong> has been declined.</p>
${data.notes ? `<div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:20px 0;"><p style="color:#991b1b;margin:0;font-weight:600;">Reason</p><p style="color:#b91c1c;margin:8px 0 0;font-size:14px;">${data.notes}</p></div>` : ""}
<p style="color:#3f3f46;line-height:1.6;">If you believe this is an error, please contact our support team.</p>
${btn("Contact Support", SITE_URL + "/contact")}
`),
  }),

  withdrawal_processed: (data) => ({
    subject: `Withdrawal Processed - ${SITE_NAME}`,
    html: baseTemplate(`
<h2 style="color:#18181b;margin:0 0 16px;">Withdrawal Processed!</h2>
<p style="color:#3f3f46;line-height:1.6;">Hi ${data.name || "there"},</p>
<p style="color:#3f3f46;line-height:1.6;">Your withdrawal of <strong>KSh ${data.amount}</strong> has been processed and sent to your ${(data.payment_method || "M-Pesa").toUpperCase()} account.</p>
${btn("View Your Balance", SITE_URL + "/monetization")}
`),
  }),

  daily_reset: (data) => ({
    subject: `New Day, New Earnings! - ${SITE_NAME}`,
    html: baseTemplate(`
<h2 style="color:#18181b;margin:0 0 16px;">New Day, New Earnings!</h2>
<p style="color:#3f3f46;line-height:1.6;">Hi ${data.name || "there"},</p>
<p style="color:#3f3f46;line-height:1.6;">Your daily counters have been reset. You can now listen to up to 150 songs today and earn KSh rewards!</p>
${btn("Start Listening", SITE_URL + "/music")}
`),
  }),

  // ADMIN EMAILS
  admin_new_signup: (data) => ({
    subject: `New User Signup - ${SITE_NAME}`,
    html: baseTemplate(`
<h2 style="color:#18181b;margin:0 0 16px;">New User Registration</h2>
<table style="width:100%;margin:20px 0;border-collapse:collapse;">
<tr><td style="padding:8px 0;color:#71717a;">Email</td><td style="padding:8px 0;font-weight:600;color:#18181b;">${data.email}</td></tr>
<tr><td style="padding:8px 0;color:#71717a;">Name</td><td style="padding:8px 0;font-weight:600;color:#18181b;">${data.name || "Not set"}</td></tr>
<tr><td style="padding:8px 0;color:#71717a;">Date</td><td style="padding:8px 0;font-weight:600;color:#18181b;">${new Date().toLocaleString()}</td></tr>
</table>
${btn("View Admin Panel", SITE_URL + "/admin")}
`),
  }),

  admin_payment_submitted: (data) => ({
    subject: `New Payment - ${SITE_NAME}`,
    html: baseTemplate(`
<h2 style="color:#18181b;margin:0 0 16px;">New Payment Submitted</h2>
<table style="width:100%;margin:20px 0;border-collapse:collapse;">
<tr><td style="padding:8px 0;color:#71717a;">User</td><td style="padding:8px 0;font-weight:600;color:#18181b;">${data.name || data.email || "Unknown"}</td></tr>
<tr><td style="padding:8px 0;color:#71717a;">M-Pesa Code</td><td style="padding:8px 0;font-weight:600;color:#18181b;">${data.mpesa_code}</td></tr>
<tr><td style="padding:8px 0;color:#71717a;">Amount</td><td style="padding:8px 0;font-weight:600;color:#18181b;">KSh ${data.amount || 150}</td></tr>
</table>
${btn("Verify Payment", SITE_URL + "/admin")}
`),
  }),

  admin_withdrawal_request: (data) => ({
    subject: `Withdrawal Request - ${SITE_NAME}`,
    html: baseTemplate(`
<h2 style="color:#18181b;margin:0 0 16px;">New Withdrawal Request</h2>
<table style="width:100%;margin:20px 0;border-collapse:collapse;">
<tr><td style="padding:8px 0;color:#71717a;">User</td><td style="padding:8px 0;font-weight:600;color:#18181b;">${data.name || data.email || "Unknown"}</td></tr>
<tr><td style="padding:8px 0;color:#71717a;">Amount</td><td style="padding:8px 0;font-weight:600;color:#18181b;">KSh ${data.amount}</td></tr>
<tr><td style="padding:8px 0;color:#71717a;">Method</td><td style="padding:8px 0;font-weight:600;color:#18181b;">${(data.payment_method || "").toUpperCase()}</td></tr>
<tr><td style="padding:8px 0;color:#71717a;">Details</td><td style="padding:8px 0;font-weight:600;color:#18181b;">${data.payment_details}</td></tr>
</table>
${btn("Process Withdrawal", SITE_URL + "/admin")}
`),
  }),

  admin_feedback: (data) => ({
    subject: `New Feedback - ${SITE_NAME}`,
    html: baseTemplate(`
<h2 style="color:#18181b;margin:0 0 16px;">New Feedback Received</h2>
<table style="width:100%;margin:20px 0;border-collapse:collapse;">
<tr><td style="padding:8px 0;color:#71717a;">From</td><td style="padding:8px 0;font-weight:600;color:#18181b;">${data.name}</td></tr>
<tr><td style="padding:8px 0;color:#71717a;">Email</td><td style="padding:8px 0;font-weight:600;color:#18181b;">${data.email}</td></tr>
</table>
<div style="background-color:#f4f4f5;border-radius:8px;padding:16px;margin:16px 0;">
<p style="color:#3f3f46;margin:0;white-space:pre-wrap;">${data.feedback}</p>
</div>
${btn("View All Feedback", SITE_URL + "/admin")}
`),
  }),

  short_published: (data) => ({
    subject: `Your Short is Live! - ${SITE_NAME}`,
    html: baseTemplate(`
<h2 style="color:#18181b;margin:0 0 16px;">Your Short is Published!</h2>
<p style="color:#3f3f46;line-height:1.6;">Hi ${data.name || "there"},</p>
<p style="color:#3f3f46;line-height:1.6;">Your short <strong>"${data.title || "Untitled"}"</strong> has been published and is now visible to everyone!</p>
<div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0;text-align:center;">
<p style="color:#166534;margin:0;font-weight:600;">🎬 Your short is now live</p>
</div>
${btn("View Your Short", SITE_URL + "/shorts")}
`),
  }),

  short_liked: (data) => ({
    subject: `Someone Liked Your Short! - ${SITE_NAME}`,
    html: baseTemplate(`
<h2 style="color:#18181b;margin:0 0 16px;">New Like on Your Short!</h2>
<p style="color:#3f3f46;line-height:1.6;">Hi ${data.owner_name || "there"},</p>
<p style="color:#3f3f46;line-height:1.6;"><strong>${data.liker_name || "Someone"}</strong> liked your short <strong>"${data.short_title || "your video"}"</strong>!</p>
<div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:20px 0;text-align:center;">
<p style="color:#991b1b;margin:0;font-size:28px;">❤️</p>
<p style="color:#991b1b;margin:8px 0 0;font-weight:600;">New Like!</p>
</div>
${btn("View Your Shorts", SITE_URL + "/shorts")}
`),
  }),

  admin_new_short: (data) => ({
    subject: `New Short Uploaded - ${SITE_NAME}`,
    html: baseTemplate(`
<h2 style="color:#18181b;margin:0 0 16px;">New Short Uploaded</h2>
<table style="width:100%;margin:20px 0;border-collapse:collapse;">
<tr><td style="padding:8px 0;color:#71717a;">Uploader</td><td style="padding:8px 0;font-weight:600;color:#18181b;">${data.uploader || "Unknown"}</td></tr>
<tr><td style="padding:8px 0;color:#71717a;">Title</td><td style="padding:8px 0;font-weight:600;color:#18181b;">${data.title || "Untitled"}</td></tr>
<tr><td style="padding:8px 0;color:#71717a;">Email</td><td style="padding:8px 0;font-weight:600;color:#18181b;">${data.email || "N/A"}</td></tr>
</table>
${btn("Review in Admin Panel", SITE_URL + "/admin")}
`),
  }),

  admin_contact: (data) => ({
    subject: `Contact: ${data.subject || "New Message"} - ${SITE_NAME}`,
    html: baseTemplate(`
<h2 style="color:#18181b;margin:0 0 16px;">New Contact Message</h2>
<table style="width:100%;margin:20px 0;border-collapse:collapse;">
<tr><td style="padding:8px 0;color:#71717a;">From</td><td style="padding:8px 0;font-weight:600;color:#18181b;">${data.name}</td></tr>
<tr><td style="padding:8px 0;color:#71717a;">Email</td><td style="padding:8px 0;font-weight:600;color:#18181b;">${data.email}</td></tr>
<tr><td style="padding:8px 0;color:#71717a;">Subject</td><td style="padding:8px 0;font-weight:600;color:#18181b;">${data.subject || "No subject"}</td></tr>
</table>
<div style="background-color:#f4f4f5;border-radius:8px;padding:16px;margin:16px 0;">
<p style="color:#3f3f46;margin:0;white-space:pre-wrap;">${data.message}</p>
</div>
${btn("View Admin Panel", SITE_URL + "/admin")}
`),
  }),

  admin_leaderboard: (data) => ({
    subject: `Daily Leaderboard Report - ${SITE_NAME}`,
    html: baseTemplate(`
<h2 style="color:#18181b;margin:0 0 16px;">Daily Leaderboard Report</h2>
<h3 style="color:#3f3f46;">Top Listeners Today</h3>
${data.topListeners?.map((u: any, i: number) => `<p style="color:#3f3f46;margin:4px 0;">${i + 1}. ${u.name || "User"} - ${u.songs} songs</p>`).join("") || '<p style="color:#71717a;">No data</p>'}
<h3 style="color:#3f3f46;margin-top:20px;">Top Earners</h3>
${data.topEarners?.map((u: any, i: number) => `<p style="color:#3f3f46;margin:4px 0;">${i + 1}. ${u.name || "User"} - KSh ${u.earned}</p>`).join("") || '<p style="color:#71717a;">No data</p>'}
${btn("View Full Leaderboard", SITE_URL + "/leaderboard")}
`),
  }),
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, to, data } = await req.json();

    if (!type || !templates[type]) {
      return new Response(JSON.stringify({ error: `Unknown email type: ${type}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GMAIL_USER = Deno.env.get("GMAIL_USER");
    const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD");

    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      throw new Error("Gmail credentials not configured");
    }

    const template = templates[type](data || {});
    let recipient = to || (type.startsWith("admin_") ? ADMIN_EMAIL : null);

    if (!recipient && data?.user_id) {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(data.user_id);
      if (userData?.user?.email) {
        recipient = userData.user.email;
      }
    }

    if (!recipient) {
      return new Response(JSON.stringify({ error: "No recipient specified" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: GMAIL_USER,
          password: GMAIL_APP_PASSWORD,
        },
      },
    });

    await client.send({
      from: `${SITE_NAME} <${GMAIL_USER}>`,
      to: recipient,
      subject: template.subject,
      html: template.html,
    });

    await client.close();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Email error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Email failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
