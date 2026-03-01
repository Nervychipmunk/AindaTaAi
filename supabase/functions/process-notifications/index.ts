import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response("Missing Supabase env", { status: 500, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") ?? 100);

  const { data: queue, error: queueError } = await supabase
    .from("notification_queue")
    .select("id, user_id, title, body, data")
    .is("sent_at", null)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (queueError) {
    return new Response(JSON.stringify({ error: queueError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!queue || queue.length === 0) {
    return new Response(JSON.stringify({ processed: 0 }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userIds = Array.from(new Set(queue.map((item) => item.user_id)));
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, push_token")
    .in("id", userIds);

  if (profileError) {
    return new Response(JSON.stringify({ error: profileError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const tokenByUser = new Map<string, string>();
  (profiles ?? []).forEach((profile) => {
    if (profile.push_token) {
      tokenByUser.set(profile.id, profile.push_token);
    }
  });

  const nowIso = new Date().toISOString();
  const missingToken = queue.filter((item) => !tokenByUser.get(item.user_id));

  await Promise.all(
    missingToken.map((item) =>
      supabase
        .from("notification_queue")
        .update({ sent_at: nowIso, error: "missing_push_token" })
        .eq("id", item.id)
    )
  );

  const sendItems = queue.filter((item) => tokenByUser.get(item.user_id));

  if (sendItems.length === 0) {
    return new Response(JSON.stringify({ processed: missingToken.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const messages = sendItems.map((item) => ({
    to: tokenByUser.get(item.user_id),
    title: item.title,
    body: item.body,
    data: item.data ?? {},
  }));

  const expoResponse = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(messages),
  });

  if (!expoResponse.ok) {
    const errorText = await expoResponse.text();
    await Promise.all(
      sendItems.map((item) =>
        supabase
          .from("notification_queue")
          .update({ sent_at: nowIso, error: `expo_http_${expoResponse.status}` })
          .eq("id", item.id)
      )
    );

    return new Response(JSON.stringify({ error: errorText }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const expoJson = await expoResponse.json();
  const results = Array.isArray(expoJson?.data) ? expoJson.data : [];

  const updates = sendItems.map((item, index) => {
    const result = results[index] ?? {};
    const status = result.status ?? "error";
    const errorMessage = status === "ok" ? null : (result.message ?? "expo_error");

    return supabase
      .from("notification_queue")
      .update({ sent_at: nowIso, error: errorMessage })
      .eq("id", item.id);
  });

  await Promise.all(updates);

  return new Response(
    JSON.stringify({
      processed: queue.length,
      sent: sendItems.length,
      skipped: missingToken.length,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
