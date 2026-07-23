import { createHash } from 'node:crypto';

export const MAX_VISUAL_REQUEST_BYTES = 2_800_000;
export const MAX_VISUAL_IMAGE_BYTES = 2_000_000;

const allowedContexts = new Set(['auto', 'meal', 'workout', 'leisure', 'activity']);
const allowedCategories = new Set(['meal', 'workout', 'leisure', 'activity', 'unclear']);
const allowedActivities = new Set(['', 'caminhada', 'corrida', 'musculacao', 'funcional', 'futebol', 'ciclismo', 'natacao', 'outra']);
const allowedMeals = new Set(['', 'breakfast', 'lunch', 'snacks', 'dinner']);
const allowedConfidence = new Set(['low', 'medium', 'high']);

const responseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['category', 'observation', 'confidence', 'encouragement', 'question', 'suggestions', 'suggestedActivity', 'suggestedMeal', 'recordText', 'caution'],
  properties: {
    category: { type: 'string', enum: [...allowedCategories] },
    observation: { type: 'string' },
    confidence: { type: 'string', enum: [...allowedConfidence] },
    encouragement: { type: 'string' },
    question: { type: 'string' },
    suggestions: { type: 'array', items: { type: 'string' } },
    suggestedActivity: { type: 'string', enum: [...allowedActivities] },
    suggestedMeal: { type: 'string', enum: [...allowedMeals] },
    recordText: { type: 'string' },
    caution: { type: 'string' }
  }
};

function cleanText(value, limit) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);
}

export function parseVisualPayload(rawBody) {
  if (typeof rawBody !== 'string' || Buffer.byteLength(rawBody, 'utf8') > MAX_VISUAL_REQUEST_BYTES) {
    return { ok: false, status: 413, error: 'A imagem ficou grande demais para análise.' };
  }

  let body;
  try { body = JSON.parse(rawBody || '{}'); }
  catch (error) { return { ok: false, status: 400, error: 'Conteúdo inválido.' }; }

  const context = allowedContexts.has(body.context) ? body.context : 'auto';
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(body.imageData || ''));
  if (!match) return { ok: false, status: 415, error: 'Use uma imagem JPG, PNG ou WebP.' };

  const estimatedBytes = Math.floor(match[2].length * 0.75);
  if (!estimatedBytes || estimatedBytes > MAX_VISUAL_IMAGE_BYTES) {
    return { ok: false, status: 413, error: 'A imagem ficou grande demais para análise.' };
  }

  const signature = Buffer.from(match[2].slice(0, 32), 'base64');
  const isJpeg = match[1] === 'image/jpeg' && signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff;
  const isPng = match[1] === 'image/png' && signature.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp = match[1] === 'image/webp' && signature.subarray(0, 4).toString('ascii') === 'RIFF' && signature.subarray(8, 12).toString('ascii') === 'WEBP';
  if (!isJpeg && !isPng && !isWebp) return { ok: false, status: 415, error: 'O arquivo não contém uma imagem válida.' };

  return { ok: true, imageData: `data:${match[1]};base64,${match[2]}`, context };
}

export function createSafetyIdentifier(value, secret = 'bem-esportivo-visual') {
  return `bem_${createHash('sha256').update(`${secret}:${value || 'anonymous'}`).digest('hex').slice(0, 32)}`;
}

function extractOutputText(response) {
  if (typeof response?.output_text === 'string') return response.output_text;
  for (const item of Array.isArray(response?.output) ? response.output : []) {
    for (const content of Array.isArray(item?.content) ? item.content : []) {
      if (content?.type === 'output_text' && typeof content.text === 'string') return content.text;
    }
  }
  return '';
}

function sanitizeResult(value) {
  const category = allowedCategories.has(value?.category) ? value.category : 'unclear';
  return {
    category,
    observation: cleanText(value?.observation, 320) || 'Não consegui identificar a cena com segurança.',
    confidence: allowedConfidence.has(value?.confidence) ? value.confidence : 'low',
    encouragement: cleanText(value?.encouragement, 220) || 'Cada registro ajuda você a observar sua rotina com mais atenção.',
    question: cleanText(value?.question, 180) || 'O que estava acontecendo neste momento?',
    suggestions: (Array.isArray(value?.suggestions) ? value.suggestions : []).map(item => cleanText(item, 160)).filter(Boolean).slice(0, 3),
    suggestedActivity: allowedActivities.has(value?.suggestedActivity) ? value.suggestedActivity : '',
    suggestedMeal: allowedMeals.has(value?.suggestedMeal) ? value.suggestedMeal : '',
    recordText: cleanText(value?.recordText, 240) || cleanText(value?.observation, 240) || 'Registro feito com uma foto.',
    caution: cleanText(value?.caution, 220)
  };
}

export async function analyzeVisualImage({ imageData, context, apiKey, baseUrl = 'https://api.openai.com', model = 'gpt-5.6-luna', safetyIdentifier, signal }) {
  if (!apiKey) {
    const error = new Error('vision-not-configured');
    error.code = 'vision_not_configured';
    throw error;
  }

  const contextLabels = {
    auto: 'O usuário não informou o tipo de cena.',
    meal: 'O usuário indicou que a foto é de alimentação.',
    workout: 'O usuário indicou que a foto é de treino ou academia.',
    leisure: 'O usuário indicou que a foto é de lazer.',
    activity: 'O usuário indicou que a foto é de uma atividade física.'
  };

  const instructions = `Você é o assistente educacional do Meu Caminho Be. Analise somente elementos visíveis na imagem e responda em português do Brasil. ${contextLabels[context] || contextLabels.auto}

Regras obrigatórias:
- Separe observação visual de inferência usando expressões como "parece" quando necessário.
- Não identifique pessoas, não faça reconhecimento facial e não infira idade, gênero, etnia, emoção, doença, deficiência ou condição de saúde.
- Não diagnostique, não prescreva dieta ou treino e não avalie técnica, lesão ou aptidão física por uma única foto.
- Em alimentação, não estime calorias, macronutrientes, porções ou qualidade nutricional exata. Descreva apenas alimentos aparentemente visíveis.
- Em treino, não afirme intensidade, duração, grupo muscular ou qualidade de execução sem confirmação do usuário.
- Não julgue corpo, peso, aparência ou escolhas. Use incentivo gentil, sem culpa ou pressão.
- Se houver conteúdo aparentemente íntimo, sexual, violento, perigoso ou incompatível com um diário esportivo, não descreva detalhes; use category "unclear" e oriente a escolher outra imagem.
- Faça apenas uma pergunta curta que ajude a transformar a foto em um registro confirmado pelo usuário.
- recordText deve ser uma descrição neutra, curta e editável para o diário.
- Se a cena estiver ambígua, use category "unclear", confidence "low" e peça contexto.
- caution deve ficar vazio em situações comuns. Use-o apenas para lembrar limites da análise, nunca para criar alarme médico.`;

  let providerBaseUrl;
  try {
    providerBaseUrl = new URL(baseUrl);
    if (providerBaseUrl.protocol !== 'https:') throw new Error('insecure-provider-url');
  } catch (error) {
    throw Object.assign(new Error('vision-invalid-provider-url'), { code: 'vision_not_configured' });
  }

  const response = await fetch(`${providerBaseUrl.href.replace(/\/$/, '')}/v1/responses`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      store: false,
      safety_identifier: safetyIdentifier,
      max_output_tokens: 700,
      input: [{
        role: 'user',
        content: [
          { type: 'input_text', text: instructions },
          { type: 'input_image', image_url: imageData, detail: 'low' }
        ]
      }],
      text: {
        verbosity: 'low',
        format: { type: 'json_schema', name: 'visual_checkin_analysis', strict: true, schema: responseSchema }
      }
    }),
    signal
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    const error = new Error(`vision-provider-${response.status}`);
    error.code = response.status === 429 ? 'provider_rate_limit' : 'provider_error';
    error.status = response.status;
    error.providerDetail = detail.slice(0, 500);
    throw error;
  }

  const output = await response.json();
  const text = extractOutputText(output);
  if (!text) throw Object.assign(new Error('vision-empty-response'), { code: 'provider_error' });

  let parsed;
  try { parsed = JSON.parse(text); }
  catch (error) { throw Object.assign(new Error('vision-invalid-response'), { code: 'provider_error' }); }
  return sanitizeResult(parsed);
}
