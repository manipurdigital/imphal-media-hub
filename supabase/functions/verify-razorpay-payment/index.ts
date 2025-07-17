import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to verify Razorpay signature
async function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const body = `${orderId}|${paymentId}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  
  return signature === expectedSignature;
}

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

    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      planId 
    } = await req.json();

    // Verify signature
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!razorpayKeySecret) {
      throw new Error("Razorpay secret not configured");
    }

    const isValidSignature = await verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      razorpayKeySecret
    );

    if (!isValidSignature) {
      throw new Error("Invalid payment signature");
    }

    // Get subscription plan details
    const { data: plan, error: planError } = await supabaseClient
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !plan) throw new Error("Subscription plan not found");

    // Calculate subscription period
    const now = new Date();
    let periodEnd: Date;
    
    if (plan.billing_cycle === "monthly") {
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    } else if (plan.billing_cycle === "yearly") {
      periodEnd = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    } else {
      // One-time payment - set to 100 years in the future
      periodEnd = new Date(now.getFullYear() + 100, now.getMonth(), now.getDate());
    }

    // Update subscriber with successful payment
    const { error: updateError } = await supabaseClient
      .from("subscribers")
      .upsert({
        user_id: user.id,
        email: user.email,
        subscription_plan_id: planId,
        subscription_status: "active",
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (updateError) {
      console.error("Error updating subscriber:", updateError);
      throw new Error("Failed to update subscription");
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Payment verified and subscription activated",
      subscription: {
        status: "active",
        planName: plan.name,
        currentPeriodEnd: periodEnd.toISOString(),
        billingCycle: plan.billing_cycle,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error verifying payment:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Payment verification failed" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});