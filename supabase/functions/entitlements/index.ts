import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EntitlementsRequest = {
  videoId?: string;
  contentId?: string;
};

type EntitlementsResponse = {
  success: boolean;
  hasAccess: boolean;
  reasons: {
    subscriptionActive: boolean;
    payPerViewAccess: boolean;
  };
  subscription?: {
    status: string | null;
    currentPeriodEnd?: string | null;
    expiresAt?: string | null;
  } | null;
  payPerView?: {
    contentId: string | null;
  } | null;
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "No authorization header" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: "Authentication failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }
    const user = authData.user;

    const body: EntitlementsRequest = await req.json().catch(() => ({}));
    const { videoId, contentId: providedContentId } = body || {};

    let contentId: string | null = providedContentId ?? null;

    // Resolve contentId from videoId when needed
    if (!contentId && videoId) {
      const { data: ppvContent, error: ppvLookupError } = await supabase
        .from("pay_per_view_content")
        .select("id")
        .eq("video_id", videoId)
        .maybeSingle();

      if (ppvLookupError) {
        console.error("PPV content lookup error:", ppvLookupError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to resolve pay-per-view content" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      contentId = ppvContent?.id ?? null;
    }

    // Subscription status
    let subscriptionActive = false;
    let subscriptionStatus: string | null = null;
    let currentPeriodEnd: string | null | undefined = null;
    let expiresAt: string | null | undefined = null;

    const { data: subscriptionRow, error: subError } = await supabase
      .from("subscribers")
      .select("status, current_period_end, expires_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError) {
      console.error("Subscription lookup error:", subError);
    }

    if (subscriptionRow) {
      subscriptionStatus = subscriptionRow.status ?? null;
      currentPeriodEnd = subscriptionRow.current_period_end ?? null;
      expiresAt = subscriptionRow.expires_at ?? null;

      const end = currentPeriodEnd ?? expiresAt;
      const endOk = !end || new Date(end).getTime() > Date.now();
      subscriptionActive = ["active", "trialing"].includes(subscriptionStatus || "") && endOk;
    }

    // Pay-per-view access check via RPC if we have a contentId
    let payPerViewAccess = false;
    if (contentId) {
      const { data: hasAccess, error: ppvAccessError } = await supabase.rpc(
        "check_pay_per_view_access",
        { p_user_id: user.id, p_content_id: contentId }
      );

      if (ppvAccessError) {
        console.error("PPV access RPC error:", ppvAccessError);
      } else {
        payPerViewAccess = Boolean(hasAccess);
      }
    }

    const hasAccess = subscriptionActive || payPerViewAccess;

    const response: EntitlementsResponse = {
      success: true,
      hasAccess,
      reasons: {
        subscriptionActive,
        payPerViewAccess,
      },
      subscription: {
        status: subscriptionStatus,
        currentPeriodEnd: currentPeriodEnd ?? null,
        expiresAt: expiresAt ?? null,
      },
      payPerView: { contentId: contentId ?? null },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Entitlements function error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message ?? "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
