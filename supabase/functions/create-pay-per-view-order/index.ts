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
  notes?: {
    content_id: string;
    content_title: string;
    user_id: string;
  };
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

    const { contentId } = await req.json();
    if (!contentId) throw new Error("Content ID is required");

    // Get pay-per-view content details
    const { data: content, error: contentError } = await supabaseClient
      .from("pay_per_view_content")
      .select("*")
      .eq("id", contentId)
      .eq("is_active", true)
      .single();

    if (contentError || !content) {
      throw new Error("Content not found or not available");
    }

    // Check if user already has access to this content
    const { data: existingPurchase, error: purchaseCheckError } = await supabaseClient
      .from("user_purchases")
      .select("*")
      .eq("user_id", user.id)
      .eq("content_id", contentId)
      .maybeSingle(); // Use maybeSingle to avoid errors when no record exists

    if (purchaseCheckError) {
      console.error("Error checking existing purchase:", purchaseCheckError);
      throw new Error("Failed to check existing purchase");
    }

    if (existingPurchase && existingPurchase.payment_status === "completed" && existingPurchase.is_active) {
      return new Response(JSON.stringify({ 
        error: "You already have access to this content" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Get Razorpay credentials with fallback support
    const razorpayKeyId = (Deno.env.get("RAZORPAY_KEY_ID") ?? Deno.env.get("RAZORPAY_KEY") ?? Deno.env.get("RAZORPAY_ID") ?? "").trim();
    const razorpayKeySecret = (Deno.env.get("RAZORPAY_KEY_SECRET") ?? Deno.env.get("RAZORPAY_SECRET") ?? "").trim();

    console.log("PPV Razorpay credentials check:", {
      hasKeyId: !!razorpayKeyId,
      hasKeySecret: !!razorpayKeySecret,
      keyIdLength: razorpayKeyId?.length || 0,
      keySecretLength: razorpayKeySecret?.length || 0,
      keyIdFirst4: razorpayKeyId ? razorpayKeyId.substring(0, 4) : undefined,
      keySecretFirst4: razorpayKeySecret ? razorpayKeySecret.substring(0, 4) : undefined
    });

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error("Missing Razorpay credentials for PPV:", {
        RAZORPAY_KEY_ID: !!razorpayKeyId,
        RAZORPAY_KEY_SECRET: !!razorpayKeySecret
      });
      throw new Error("Razorpay credentials not configured");
    }

    // Generate a short receipt ID (max 40 chars for Razorpay)
    const shortContentId = contentId.slice(-8);
    const shortTimestamp = Date.now().toString().slice(-8);
    const receipt = `ppv_${shortContentId}_${shortTimestamp}`;
    
    console.log(`Generated receipt: ${receipt} (length: ${receipt.length})`);

    const orderData: RazorpayOrderRequest = {
      amount: Math.round(content.price * 100), // Convert to paise
      currency: content.currency,
      receipt: receipt,
      notes: {
        content_id: contentId,
        content_title: content.title,
        user_id: user.id,
      },
    };

    console.log("Creating Razorpay order:", orderData);

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Razorpay API error:", errorText);
      throw new Error(`Razorpay API error: ${response.status} ${errorText}`);
    }

    const order = await response.json();
    console.log("Razorpay order created:", order);

    // Create or update purchase record
    let purchaseResult;
    if (existingPurchase) {
      // Update existing purchase (could be pending, failed, etc.)
      purchaseResult = await supabaseClient
        .from("user_purchases")
        .update({
          purchase_amount: content.price,
          currency: content.currency,
          razorpay_order_id: order.id,
          payment_status: "pending",
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingPurchase.id)
        .select()
        .single();
    } else {
      // Create new purchase record
      purchaseResult = await supabaseClient
        .from("user_purchases")
        .insert({
          user_id: user.id,
          content_id: contentId,
          purchase_amount: content.price,
          currency: content.currency,
          razorpay_order_id: order.id,
          payment_status: "pending",
          is_active: false,
        })
        .select()
        .single();
    }

    if (purchaseResult.error) {
      console.error("Error managing purchase record:", purchaseResult.error);
      throw new Error("Failed to create purchase record");
    }

    return new Response(JSON.stringify({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: razorpayKeyId,
      content: {
        id: content.id,
        title: content.title,
        price: content.price,
        currency: content.currency,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error creating pay-per-view order:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Failed to create order" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});