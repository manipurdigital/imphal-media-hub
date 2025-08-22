import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RazorpayOrderRequest {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
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

    const { planId } = await req.json();
    
    // Get subscription plan details
    const { data: plan, error: planError } = await supabaseClient
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !plan) throw new Error("Subscription plan not found");

    // Create Razorpay order
    const razorpayKeyId = (Deno.env.get("RAZORPAY_KEY_ID") ?? Deno.env.get("RAZORPAY_KEY") ?? Deno.env.get("RAZORPAY_ID") ?? "").trim();
    const razorpayKeySecret = (Deno.env.get("RAZORPAY_KEY_SECRET") ?? Deno.env.get("RAZORPAY_SECRET") ?? "").trim();
    
    console.log("Environment check:", {
      hasKeyId: !!razorpayKeyId,
      hasKeySecret: !!razorpayKeySecret,
      keyIdLength: razorpayKeyId?.length || 0,
      keySecretLength: razorpayKeySecret?.length || 0,
      keyIdFirst4: razorpayKeyId ? razorpayKeyId.substring(0, 4) : undefined,
      keySecretFirst4: razorpayKeySecret ? razorpayKeySecret.substring(0, 4) : undefined
    });
    
    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error("Missing Razorpay credentials:", {
        RAZORPAY_KEY_ID: !!razorpayKeyId,
        RAZORPAY_KEY_SECRET: !!razorpayKeySecret
      });
      throw new Error("Razorpay credentials not configured");
    }

    // Generate a short receipt ID (max 40 chars for Razorpay)
    const shortPlanId = plan.id.slice(-8); // Last 8 chars of plan ID
    const shortTimestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
    const receipt = `${shortPlanId}_${shortTimestamp}`; // 17 chars total
    
    console.log(`Generated receipt: ${receipt} (length: ${receipt.length})`);

    const orderData: RazorpayOrderRequest = {
      amount: Math.round(plan.price * 100), // Convert to paise
      currency: plan.currency,
      receipt: receipt,
      notes: {
        plan_id: plan.id,
        plan_name: plan.name,
        user_id: user.id,
        billing_cycle: plan.billing_cycle,
      },
    };

    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.text();
      throw new Error(`Razorpay API error: ${errorData}`);
    }

    const razorpayOrder = await razorpayResponse.json();

    // Create or update subscriber record
    const { error: subscriberError } = await supabaseClient
      .from("subscribers")
      .upsert({
        user_id: user.id,
        email: user.email,
        subscription_plan_id: planId,
        subscription_status: "pending",
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (subscriberError) {
      console.error("Error creating subscriber:", subscriberError);
    }

    return new Response(JSON.stringify({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: razorpayKeyId,
      plan: {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        billing_cycle: plan.billing_cycle,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Failed to create order" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});