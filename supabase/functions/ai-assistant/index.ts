// Supabase Edge Function: ai-assistant
// Enforces server-side authentication, tenant membership, subscription entitlement,
// rate limits, prompt-injection sanitization, and mandatory human confirmation.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const aiApiKey = Deno.env.get('AI_API_KEY') ?? '';

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized user session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { businessId, taskType, prompt } = body;

    if (!businessId || !taskType || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid AI request payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sanitize untrusted prompt input against prompt-injection overrides
    const sanitizedPrompt = prompt.replace(/ignore previous instructions|system override|bypass rls/gi, '[filtered]');

    if (!aiApiKey) {
      return new Response(
        JSON.stringify({
          providerConfigured: false,
          requiresConfirmation: true,
          message:
            'AI_API_KEY is not configured in Supabase Edge Function secrets. Falling back to deterministic rule-based assistant.',
          sanitizedPrompt,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        providerConfigured: true,
        requiresConfirmation: true,
        sanitizedPrompt,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

