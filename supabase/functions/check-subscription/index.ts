import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) throw new Error("Authentication failed");

    // Get user's subscription details
    const { data: subscription, error: subscriptionError } = await supabaseClient
      .from("subscribers")
      .select(`
        *,
        subscription_plans (
          id,
          name,
          description,
          price,
          currency,
          billing_cycle
        )
      `)
      .eq("user_id", user.id)
      .maybeSingle();

    if (subscriptionError) {
      console.error("Error fetching subscription:", subscriptionError);
      throw new Error("Failed to fetch subscription");
    }

    // Check if subscription is active and not expired
    const now = new Date();
    const isActive = subscription && 
      subscription.subscription_status === "active" &&
      subscription.current_period_end &&
      new Date(subscription.current_period_end) > now;

    // If subscription exists but is expired, update status
    if (subscription && !isActive && subscription.subscription_status === "active") {
      await supabaseClient
        .from("subscribers")
        .update({ 
          subscription_status: "expired",
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id);
    }

    return new Response(JSON.stringify({
      isSubscribed: isActive,
      subscription: subscription ? {
        id: subscription.id,
        status: isActive ? "active" : subscription.subscription_status,
        plan: subscription.subscription_plans,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        createdAt: subscription.created_at,
        updatedAt: subscription.updated_at,
      } : null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error checking subscription:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Failed to check subscription" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});