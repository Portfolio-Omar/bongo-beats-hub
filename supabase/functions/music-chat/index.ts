import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, foundSongs } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build system prompt with website context
    let systemPrompt = `You are the Bongo Vibes AI assistant, a helpful and friendly chatbot for a Tanzanian Bongo Flava music streaming website called "Bongo Old Skool" that celebrates classic 2000s era music.

Your personality:
- Warm, friendly, and enthusiastic about Bongo Flava music
- Knowledgeable about Tanzanian music history and artists
- Helpful in guiding users through the website

Website features you can help with:
- **Music Library**: Browse and search for songs at /music
- **Playlists**: Users can create and manage playlists at /playlists
- **Favorites**: Save favorite songs at /favorites
- **Blog**: Read articles about Bongo Flava at /blog
- **Feedback**: Submit feedback at /feedback
- **Community Chat**: Real-time chat with other music fans at /community — supports text, images, voice notes, typing indicators, and emoji reactions
- **Shorts**: TikTok-style short videos at /shorts — anyone can upload, like, comment, and share short music clips
- **Polls**: Vote on music polls at /polls
- **Leaderboard**: See top listeners at /leaderboard
- **Video Music**: Watch full music videos at /video-music
- **Monetization**: Earn rewards by listening to songs at /monetization — includes daily bonuses, boosters, referrals, and ad rewards

Popular artists on the platform include:
- Diamond Platnumz
- Ali Kiba
- Professor Jay
- Dully Sykes
- Lady Jaydee
- Juma Nature
- Ray C
- TMK Wanaume

When users search for music, I will provide you with matching songs from the database. Reference these results in your response.

Keep responses concise, friendly, and helpful. Use emojis sparingly to add personality.`;

    // Add found songs context if available
    if (foundSongs && foundSongs.length > 0) {
      systemPrompt += `\n\nI found these songs matching the user's query:\n${foundSongs.map((s: any, i: number) => `${i + 1}. "${s.title}" by ${s.artist}${s.genre ? ` (${s.genre})` : ''}`).join('\n')}\n\nMention these results naturally in your response. The user will see play/download buttons next to each song.`;
    } else if (messages[messages.length - 1]?.content.toLowerCase().includes('song') || 
               messages[messages.length - 1]?.content.toLowerCase().includes('find') ||
               messages[messages.length - 1]?.content.toLowerCase().includes('search')) {
      systemPrompt += `\n\nNo songs were found matching the user's query. Suggest they try different search terms or browse the music library at /music.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
