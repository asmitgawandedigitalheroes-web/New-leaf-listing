import nodemailer from "npm:nodemailer";

/**
 * send-email Edge Function
 *
 * Sends an email via SMTP (Gmail/Nodemailer) using credentials provided in environment variables.
 * JWT verification is disabled (verify_jwt = false) — Supabase handles auth at
 * the gateway level via the project's anon/service key.
 */

// Standard CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log(`[send-email] Received ${req.method} request`);

    // 1. Get internal configuration (for validation/logging)
    const url = Deno.env.get("SUPABASE_URL") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("ADMIN_SERVICE_ROLE_KEY") || "";
    
    if (!url || !serviceKey) {
      console.error("[send-email] Missing internal Supabase configuration");
    }

    // 2. Parse request body safely
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error("[send-email] Failed to parse JSON body:", e.message);
      throw new Error("Invalid JSON body");
    }

    const { to, subject, html } = body;
    console.log('[send-email] Payload info:', { to, subject, hasHtml: !!html });

    if (!to || !subject || !html) {
      const missing = [];
      if (!to) missing.push("to");
      if (!subject) missing.push("subject");
      if (!html) missing.push("html");
      console.error('[send-email] Missing fields:', missing.join(", "));
      throw new Error(`Missing required fields: ${missing.join(", ")}`);
    }

    // 3. Get SMTP credentials
    const host = Deno.env.get("SMTP_HOST");
    const port = parseInt(Deno.env.get("SMTP_PORT") ?? "587");
    const user = Deno.env.get("SMTP_USER");
    const pass = Deno.env.get("SMTP_PASS");
    const from = Deno.env.get("SMTP_FROM") ?? user ?? "no-reply@nlvlistings.com";

    if (!host || !user || !pass) {
      console.error('[send-email] SMTP credentials missing in environment');
      throw new Error("Email service is not configured (SMTP settings missing)");
    }

    // 4. Initialize Nodemailer Transporter
    console.log(`[send-email] Initializing Nodemailer for ${host}:${port} with user ${user}`);
    const transporter = nodemailer.createTransport({
      host: host,
      port: port,
      secure: port === 465, // Use true for 465, false for other ports
      auth: {
        user: user,
        pass: pass,
      },
    });

    try {
      console.log(`[send-email] Attempting to send email to ${to}`);
      
      const info = await transporter.sendMail({
        from: from,
        to: to,
        subject: subject,
        html: html,
      });

      console.log(`[send-email] Email sent successfully. Message ID: ${info.messageId}`);

      return new Response(JSON.stringify({ sent: true, messageId: info.messageId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } catch (smtpErr) {
      console.error(`[send-email] Mail delivery failed:`, smtpErr.message);
      throw new Error(`Mail server error: ${smtpErr.message}`);
    }
  } catch (err) {
    const error = err as Error;
    console.error(`[send-email] Request processing failed: ${error.message}`);
    
    return new Response(JSON.stringify({ 
      sent: false, 
      error: error.message,
      tip: "If this continues, verify your SMTP secrets (SMTP_HOST, SMTP_USER, SMTP_PASS) are set in the Supabase Dashboard." 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});


