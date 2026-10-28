// Supabase Edge Function: send-notification
// Dispatches transactional emails (via Resend/SMTP) only when RESEND_API_KEY is configured.
// Never claims an email or WhatsApp message was sent if provider credentials are absent.

Deno.serve(async (req: Request) => {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const fromAddress = Deno.env.get('EMAIL_FROM_ADDRESS') || 'no-reply@invoicepro.co.tz';

  const body = await req.json().catch(() => ({}));
  const { to, subject, html, jobId } = body;

  if (!resendApiKey) {
    return new Response(
      JSON.stringify({
        delivered: false,
        status: 'provider_not_configured',
        jobId,
        error: 'RESEND_API_KEY is not configured on the server. Notification remains queued.',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: fromAddress, to: [to], subject, html }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return new Response(
      JSON.stringify({
        delivered: false,
        status: 'failed',
        jobId,
        error: `Email provider returned ${res.status}: ${errText}`,
      }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const providerData = await res.json();
  return new Response(
    JSON.stringify({
      delivered: true,
      status: 'sent',
      jobId,
      providerMessageId: providerData.id,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});

