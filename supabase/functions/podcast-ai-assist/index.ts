import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic, transcript, currentTitle } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `You are a podcast producer for "Bongo Old Skool", a nostalgic Bongo Flava (Tanzanian/Kenyan music) podcast.
Generate a catchy episode title, an engaging 2-3 sentence description, 5 relevant tags, and 3 short episode notes/highlights.

${currentTitle ? `Current draft title: ${currentTitle}` : ""}
${topic ? `Topic / context: ${topic}` : ""}
${transcript ? `Transcript excerpt:\n${transcript.slice(0, 2000)}` : ""}

Respond ONLY with valid JSON:
{ "title": "...", "description": "...", "tags": ["...","..."], "notes": ["...","...","..."] }`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a helpful podcast metadata generator. Respond only with raw JSON, no markdown fences." },
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
