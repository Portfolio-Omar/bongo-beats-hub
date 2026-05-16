import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic, transcript, currentTitle, mode = "metadata", availableSongs = [] } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let prompt = "";
    if (mode === "topic") {
      prompt = `You are a creative producer for "Bongo Old Skool", a nostalgic 2000s Bongo Flava (Tanzanian/Kenyan music) podcast. Suggest ONE fresh, engaging episode topic to discuss right now. Keep it focused, conversational, and specific to old-skool Bongo culture, artists, songs, or stories. Provide 4 talking points.

Respond ONLY with valid JSON:
{ "topic": "...", "angle": "...", "talking_points": ["...","...","...","..."] }`;
    } else if (mode === "song-pick") {
      const list = (availableSongs as any[]).slice(0, 80).map((s, i) => `${i + 1}. "${s.title}" — ${s.artist}${s.genre ? ` [${s.genre}]` : ""}`).join("\n");
      prompt = `You are picking background music for a Bongo Old Skool podcast episode.
Episode context: ${currentTitle || topic || "Old-skool Bongo Flava discussion"}

Available songs from the platform library:
${list}

Pick the BEST single song from the list that fits as soft, nostalgic background music for this episode. Return the exact title and artist from the list, plus a 1-sentence reason.

Respond ONLY with valid JSON:
{ "title": "...", "artist": "...", "reason": "..." }`;
    } else {
      prompt = `You are a podcast producer for "Bongo Old Skool", a nostalgic Bongo Flava (Tanzanian/Kenyan music) podcast.
Generate a catchy episode title, an engaging 2-3 sentence description, 5 relevant tags, and 3 short episode notes/highlights.

${currentTitle ? `Current draft title: ${currentTitle}` : ""}
${topic ? `Topic / context: ${topic}` : ""}
${transcript ? `Transcript excerpt:\n${transcript.slice(0, 2000)}` : ""}

Respond ONLY with valid JSON:
{ "title": "...", "description": "...", "tags": ["...","..."], "notes": ["...","...","..."] }`;
    }

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You return only raw JSON, no markdown fences." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ error: `AI gateway: ${r.status} ${t}` }), {
        status: r.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const j = await r.json();
    let text: string = j?.choices?.[0]?.message?.content || "{}";
    text = text.replace(/```json|```/g, "").trim();
    let parsed: any = {};
    try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
