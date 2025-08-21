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
  try {
    const body = `${orderId}|${paymentId}`;
    console.log(`Verifying signature for body: ${body}`);
    
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
    
    console.log(`Expected signature: ${expectedSignature}`);
    console.log(`Received signature: ${signature}`);
    
    return signature === expectedSignature;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Verifying Razorpay payment...");
    
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

    const requestBody = await req.json();
    console.log("Request body:", JSON.stringify(requestBody, null, 2));
    
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      planId 
    } = requestBody;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planId) {
      throw new Error("Missing required payment parameters");
    }

    // Verify signature
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!razorpayKeySecret) {
      throw new Error("Razorpay secret not configured");
    }

    console.log("Verifying signature...");
    const isValidSignature = await verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      razorpayKeySecret
    );

    if (!isValidSignature) {
      console.error("Invalid payment signature verification failed");
      throw new Error("Invalid payment signature");
    }

    console.log("Signature verified successfully");

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
    console.error("Error details:", {
      message: error.message,
      stack: error.stack
    });
    return new Response(JSON.stringify({ 
      error: error.message || "Payment verification failed",
      details: "Check server logs for more information"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});