const DESTINATION_EMAIL = 'bemesportivo@yahoo.com';
const DEFAULT_FROM_EMAIL = 'contato@bemesportivo.com';
const MAX_BODY_BYTES = 16000;

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

function cleanLine(value, limit) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/send') {
      return json({ ok: false, error: 'Not found.' }, 404);
    }

    const contentLength = Number(request.headers.get('Content-Length') || 0);
    if (contentLength > MAX_BODY_BYTES) return json({ ok: false, error: 'Payload too large.' }, 413);

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return json({ ok: false, error: 'Invalid payload.' }, 400);
    }

    const from = cleanLine(env.CONTACT_FROM_EMAIL, 160) || DEFAULT_FROM_EMAIL;
    const subject = cleanLine(body.subject, 200);
    const replyEmail = cleanLine(body.replyTo?.email, 160).toLowerCase();
    const replyName = cleanLine(body.replyTo?.name, 80);
    const text = String(body.text || '').slice(0, 6000);
    const html = String(body.html || '').slice(0, 12000);

    if (!subject || !text || !replyEmail) return json({ ok: false, error: 'Required fields are missing.' }, 400);

    try {
      const result = await env.CONTACT_EMAIL.send({
        to: DESTINATION_EMAIL,
        from,
        replyTo: { email: replyEmail, name: replyName || undefined },
        subject,
        text,
        html
      });
      return json({ ok: true, messageId: result?.messageId || null });
    } catch (error) {
      console.error('Contact email worker failed', error?.code || '', error?.message || error);
      return json({ ok: false, code: error?.code || 'EMAIL_SEND_FAILED', error: 'Email delivery failed.' }, 502);
    }
  }
};
