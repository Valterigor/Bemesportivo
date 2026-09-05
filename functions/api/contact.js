const DESTINATION_EMAIL = 'bemesportivo@yahoo.com';
const DEFAULT_FROM_EMAIL = 'contato@bemesportivo.com';
const MAX_BODY_BYTES = 12000;
const RATE_LIMIT_WINDOW_SECONDS = 3600;
const RATE_LIMIT_MAX = 5;

const SUBJECTS = {
  duvida: 'Dúvida',
  solicitacao: 'Solicitação',
  pauta: 'Sugestão de pauta',
  correcao: 'Correção de conteúdo',
  parceria: 'Parceria ou proposta',
  privacidade: 'Privacidade e dados',
  outro: 'Outro assunto'
};

function json(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders
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

function cleanMessage(value, limit) {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, limit);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value) && value.length <= 160;
}

async function fingerprint(value, secret) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${secret}:${value}`)
  );
  return [...new Uint8Array(digest)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}

async function enforceRateLimit(env, request) {
  if (!env?.BE_DATA?.get || !env?.BE_DATA?.put) return true;
  try {
    const address = request.headers.get('CF-Connecting-IP') || 'unknown';
    const key = `contact:rate:${await fingerprint(address, env.CONTACT_RATE_LIMIT_SECRET || 'bem-esportivo-contact')}`;
    const current = await env.BE_DATA.get(key, { type: 'json' });
    const count = Number(current?.count || 0);
    if (count >= RATE_LIMIT_MAX) return false;
    await env.BE_DATA.put(key, JSON.stringify({ count: count + 1 }), {
      expirationTtl: RATE_LIMIT_WINDOW_SECONDS
    });
    return true;
  } catch (error) {
    return true;
  }
}

function requestComesFromSite(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return true;
  try {
    const requestHost = new URL(request.url).hostname.replace(/^www\./, '');
    const originHost = new URL(origin).hostname.replace(/^www\./, '');
    return originHost === requestHost || ['localhost', '127.0.0.1'].includes(originHost);
  } catch (error) {
    return false;
  }
}

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: { 'Allow': 'POST, OPTIONS', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }
    });
  }
  if (request.method !== 'POST') return json({ ok: false, error: 'Método não permitido.' }, 405, { Allow: 'POST, OPTIONS' });
  if (!requestComesFromSite(request)) return json({ ok: false, error: 'Origem não autorizada.' }, 403);

  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (contentLength > MAX_BODY_BYTES) return json({ ok: false, error: 'Mensagem grande demais.' }, 413);

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return json({ ok: false, error: 'Dados inválidos.' }, 400);
  }

  if (cleanLine(body.website, 120)) return json({ ok: true });

  const name = cleanLine(body.name, 80);
  const email = cleanLine(body.email, 160).toLowerCase();
  const subjectKey = Object.hasOwn(SUBJECTS, body.subject) ? body.subject : 'outro';
  const subject = SUBJECTS[subjectKey];
  const message = cleanMessage(body.message, 3000);
  const source = cleanLine(body.source, 120) || 'Site';
  const startedAt = Number(body.startedAt || 0);

  if (!validEmail(email)) return json({ ok: false, error: 'Informe um e-mail válido.' }, 400);
  if (message.length < 10) return json({ ok: false, error: 'Escreva uma mensagem com pelo menos 10 caracteres.' }, 400);
  if ((message.match(/https?:\/\//gi) || []).length > 3) return json({ ok: false, error: 'A mensagem contém links demais.' }, 400);
  if (startedAt && Date.now() - startedAt < 1500) return json({ ok: false, error: 'Aguarde um instante e tente novamente.' }, 429);
  if (!(await enforceRateLimit(env, request))) return json({ ok: false, error: 'Limite de mensagens atingido. Tente novamente mais tarde.' }, 429);

  if (!env?.CONTACT_EMAIL_SERVICE?.fetch) {
    return json({
      ok: false,
      code: 'CONTACT_EMAIL_NOT_CONFIGURED',
      error: 'O envio automático ainda não está disponível.',
      fallbackEmail: DESTINATION_EMAIL
    }, 503);
  }

  const displayName = name || 'Visitante';
  const sentAt = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const text = [
    `Nova mensagem pelo site Bem Esportivo`,
    `Assunto: ${subject}`,
    `Nome: ${displayName}`,
    `E-mail para resposta: ${email}`,
    `Origem: ${source}`,
    `Enviada em: ${sentAt}`,
    '',
    message
  ].join('\n');

  try {
    const emailRequest = new Request('https://contact-email.internal/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: cleanLine(env.CONTACT_FROM_EMAIL, 160) || DEFAULT_FROM_EMAIL,
        replyTo: { email, name: displayName },
        subject: `[Bem Esportivo] ${subject} — ${displayName}`,
        text,
        html: `<h1>Nova mensagem pelo site</h1><p><strong>Assunto:</strong> ${escapeHtml(subject)}<br><strong>Nome:</strong> ${escapeHtml(displayName)}<br><strong>E-mail para resposta:</strong> ${escapeHtml(email)}<br><strong>Origem:</strong> ${escapeHtml(source)}<br><strong>Enviada em:</strong> ${escapeHtml(sentAt)}</p><hr><p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`
      })
    });
    const emailResponse = await env.CONTACT_EMAIL_SERVICE.fetch(emailRequest);
    const result = await emailResponse.json().catch(() => ({}));
    if (!emailResponse.ok || !result.ok) {
      throw Object.assign(new Error(result.error || 'Email service failed'), { code: result.code });
    }
    return json({ ok: true, messageId: result.messageId || null });
  } catch (error) {
    console.error('Contact email failed', error?.code || '', error?.message || error);
    return json({
      ok: false,
      error: 'Não foi possível enviar agora. Tente novamente ou use o e-mail direto.',
      fallbackEmail: DESTINATION_EMAIL
    }, 502);
  }
}
