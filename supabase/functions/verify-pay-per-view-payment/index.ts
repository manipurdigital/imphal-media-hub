import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Function to verify Razorpay signature
async function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const body = orderId + "|" + paymentId;
  const expectedSignature = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  ).then(key =>
    crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body))
  ).then(signature =>
    Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  );
  
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

    const { orderId, paymentId, signature } = await req.json();
    
    if (!orderId || !paymentId || !signature) {
      throw new Error("Missing required payment details");
    }

    // Get Razorpay secret
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!razorpayKeySecret) {
      throw new Error("Razorpay secret not configured");
    }

    // Verify signature
    const isValid = await verifyRazorpaySignature(orderId, paymentId, signature, razorpayKeySecret);
    if (!isValid) {
      throw new Error("Invalid payment signature");
    }

    // Get the purchase record
    const { data: purchase, error: purchaseError } = await supabaseClient
      .from("user_purchases")
      .select("*")
      .eq("user_id", user.id)
      .eq("razorpay_order_id", orderId)
      .eq("payment_status", "pending")
      .single();

    if (purchaseError || !purchase) {
      throw new Error("Purchase record not found");
    }

    // Get content details
    const { data: content, error: contentError } = await supabaseClient
      .from("pay_per_view_content")
      .select("*")
      .eq("id", purchase.content_id)
      .single();

    if (contentError || !content) {
      throw new Error("Content not found");
    }

    // Calculate expiration date (default 30 days access)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Update purchase record
    const { error: updateError } = await supabaseClient
      .from("user_purchases")
      .update({
        payment_status: "completed",
        razorpay_payment_id: paymentId,
        is_active: true,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", purchase.id);

    if (updateError) {
      console.error("Error updating purchase:", updateError);
      throw new Error("Failed to update purchase record");
    }

    console.log(`Pay-per-view payment verified successfully for user ${user.id}, content ${purchase.content_id}`);

    return new Response(JSON.stringify({
      success: true,
      message: "Payment verified successfully",
      purchase: {
        id: purchase.id,
        contentId: purchase.content_id,
        contentTitle: content.title,
        amount: purchase.purchase_amount,
        currency: purchase.currency,
        expiresAt: expiresAt.toISOString(),
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error verifying pay-per-view payment:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Payment verification failed" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});