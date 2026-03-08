import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, artist, duration } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!title || !artist) {
      return new Response(
        JSON.stringify({ error: "Title and artist are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const durationInfo = duration ? ` The song is approximately ${Math.round(duration)} seconds long.` : '';

    const prompt = `Generate synchronized lyrics in LRC format for the song "${title}" by ${artist}.${durationInfo}

IMPORTANT RULES:
1. Return ONLY the LRC formatted lyrics, nothing else
2. Each line must have a timestamp in [mm:ss.xx] format
3. Space the timestamps realistically across the song duration
4. If you know the actual lyrics, use them. If not, create plausible Bongo Flava / Swahili lyrics that fit the artist's style
5. Include verse markers like [00:05.00]♪ Intro, [01:30.00]♪ Chorus etc.
6. Make timestamps realistic - verses ~15-20 seconds apart, choruses slightly faster
7. Do NOT include any explanation, just the raw LRC content

Example format:
[00:05.00]♪ Intro
[00:15.00]First line of the song
[00:22.00]Second line continues
[00:30.00]Third line here`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a lyrics expert specializing in East African music, particularly Bongo Flava and Tanzanian music. You generate accurate LRC (synchronized lyrics) format. Return ONLY the LRC content with no markdown formatting, no code blocks, no explanation." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Failed to fetch lyrics" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const lrcContent = data.choices?.[0]?.message?.content || "";

    // Clean up: remove markdown code blocks if present
    const cleanLrc = lrcContent
      .replace(/```lrc\n?/gi, '')
      .replace(/```\n?/g, '')
      .trim();

    return new Response(
      JSON.stringify({ success: true, lrc: cleanLrc }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("lyrics fetch error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
