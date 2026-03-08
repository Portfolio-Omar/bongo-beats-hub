import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get top listeners today
    const { data: topListeners } = await supabase
      .from("user_earnings")
      .select("user_id, songs_listened_today")
      .eq("last_listen_date", new Date().toISOString().split("T")[0])
      .order("songs_listened_today", { ascending: false })
      .limit(10);

    // Get top earners
    const { data: topEarners } = await supabase
      .from("user_earnings")
      .select("user_id, total_earned")
      .order("total_earned", { ascending: false })
      .limit(10);

    // Resolve names
    const resolveNames = async (users: any[], valueKey: string, label: string) => {
      const results = [];
      for (const u of users || []) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", u.user_id)
          .maybeSingle();
        results.push({
          name: profile?.full_name || "Anonymous",
          [label]: u[valueKey],
        });
      }
      return results;
    };

    const topListenersData = await resolveNames(topListeners || [], "songs_listened_today", "songs");
    const topEarnersData = await resolveNames(topEarners || [], "total_earned", "earned");

    // Send email via send-email function
    const response = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          type: "admin_leaderboard",
          data: {
            topListeners: topListenersData,
            topEarners: topEarnersData,
          },
        }),
      }
    );

    const result = await response.json();

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
