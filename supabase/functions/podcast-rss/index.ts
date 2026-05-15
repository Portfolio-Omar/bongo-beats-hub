import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SITE_NAME = "Bongo Old Skool Podcasts";
const SITE_URL = "https://bongo-beats-hub.lovable.app";
const SITE_DESC = "Stories, interviews and throwback discussions from the golden era of Bongo Flava.";

const esc = (s: string) =>
  (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const rfc822 = (d: string) => new Date(d).toUTCString();

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*" } });
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );
  const { data } = await supabase.from("podcasts").select("*").eq("published", true)
    .order("created_at", { ascending: false }).limit(200);

  const items = (data || []).map((p: any) => `
    <item>
      <title>${esc(p.title)}</title>
      <description><![CDATA[${p.description || ""}]]></description>
      <link>${SITE_URL}/podcasts?ep=${p.id}</link>
      <guid isPermaLink="false">${p.id}</guid>
      <pubDate>${rfc822(p.created_at)}</pubDate>
      <enclosure url="${esc(p.audio_url)}" type="audio/mpeg" length="0"/>
      <itunes:author>${esc(p.author_name || SITE_NAME)}</itunes:author>
      <itunes:duration>${p.duration_seconds || 0}</itunes:duration>
      ${p.cover_url ? `<itunes:image href="${esc(p.cover_url)}"/>` : ""}
    </item>`).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${SITE_URL}/podcasts</link>
    <description>${SITE_DESC}</description>
    <language>en-tz</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <itunes:author>${SITE_NAME}</itunes:author>
    <itunes:summary>${SITE_DESC}</itunes:summary>
    <itunes:image href="${SITE_URL}/logo.png"/>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=600",
    },
  });
});
