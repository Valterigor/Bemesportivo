const elements = {
  context: document.getElementById('fb-photo-context'),
  input: document.getElementById('fb-photo-input'),
  preview: document.getElementById('fb-photo-preview'),
  previewImage: document.getElementById('fb-photo-preview-image'),
  fileName: document.getElementById('fb-photo-file-name'),
  remove: document.getElementById('fb-photo-remove'),
  consent: document.getElementById('fb-photo-consent'),
  analyze: document.getElementById('fb-photo-analyze'),
  status: document.getElementById('fb-photo-status'),
  result: document.getElementById('fb-photo-result'),
  category: document.getElementById('fb-photo-result-category'),
  confidence: document.getElementById('fb-photo-confidence'),
  observation: document.getElementById('fb-photo-observation'),
  encouragement: document.getElementById('fb-photo-encouragement'),
  suggestions: document.getElementById('fb-photo-suggestions'),
  caution: document.getElementById('fb-photo-caution'),
  question: document.getElementById('fb-photo-question'),
  answer: document.getElementById('fb-photo-answer'),
  mealWrap: document.getElementById('fb-photo-meal-wrap'),
  meal: document.getElementById('fb-photo-meal'),
  activityWrap: document.getElementById('fb-photo-activity-wrap'),
  activity: document.getElementById('fb-photo-activity'),
  use: document.getElementById('fb-photo-use'),
  discard: document.getElementById('fb-photo-discard')
};

const categoryLabels = {
  meal: 'ALIMENTAÇÃO',
  workout: 'TREINO OU ACADEMIA',
  activity: 'ATIVIDADE',
  leisure: 'LAZER',
  unclear: 'CENA A CONFIRMAR'
};
const confidenceLabels = { low: 'Leitura inicial', medium: 'Boa leitura', high: 'Cena bem definida' };
const supportedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
let selectedFile = null;
let previewUrl = '';
let currentAnalysis = null;
let effectiveCategory = 'unclear';
let analyzing = false;

function setStatus(message = '', state = '') {
  if (!elements.status) return;
  elements.status.textContent = message;
  if (state) elements.status.dataset.state = state;
  else delete elements.status.dataset.state;
}

function updateAnalyzeState() {
  if (!elements.analyze) return;
  elements.analyze.disabled = analyzing || !selectedFile || !elements.consent?.checked;
}

function revokePreview() {
  if (!previewUrl) return;
  URL.revokeObjectURL(previewUrl);
  previewUrl = '';
}

function clearResult() {
  currentAnalysis = null;
  effectiveCategory = 'unclear';
  if (elements.result) elements.result.hidden = true;
  if (elements.answer) elements.answer.value = '';
}

function clearPhoto({ keepStatus = false } = {}) {
  revokePreview();
  selectedFile = null;
  if (elements.input) elements.input.value = '';
  if (elements.preview) elements.preview.hidden = true;
  if (elements.previewImage) elements.previewImage.removeAttribute('src');
  if (elements.fileName) elements.fileName.textContent = '';
  if (elements.consent) elements.consent.checked = false;
  clearResult();
  if (!keepStatus) setStatus();
  updateAnalyzeState();
}

function handleSelectedFile(file) {
  clearResult();
  setStatus();
  if (!file) {
    clearPhoto();
    return;
  }
  if (!supportedTypes.has(file.type)) {
    clearPhoto();
    setStatus('Escolha uma imagem JPG, PNG ou WebP.', 'error');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    clearPhoto();
    setStatus('A foto deve ter no máximo 10 MB.', 'error');
    return;
  }

  revokePreview();
  selectedFile = file;
  previewUrl = URL.createObjectURL(file);
  elements.previewImage.src = previewUrl;
  elements.fileName.textContent = file.name || 'Foto escolhida';
  elements.preview.hidden = false;
  elements.consent.checked = false;
  updateAnalyzeState();
}

async function loadBitmap(file) {
  if ('createImageBitmap' in window) {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); }
    catch (error) { /* fallback abaixo */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function prepareImage(file) {
  const source = await loadBitmap(file);
  const sourceWidth = source.width || source.naturalWidth;
  const sourceHeight = source.height || source.naturalHeight;
  const scale = Math.min(1, 1280 / Math.max(sourceWidth, sourceHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));
  const context = canvas.getContext('2d', { alpha: false });
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  if (typeof source.close === 'function') source.close();

  let quality = .82;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  while (dataUrl.length > 2_500_000 && quality > .56) {
    quality -= .08;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }
  if (dataUrl.length > 2_650_000) throw new Error('image_too_large');
  return dataUrl;
}

function defaultMeal() {
  const hour = new Date().getHours();
  if (hour < 10) return 'breakfast';
  if (hour < 15) return 'lunch';
  if (hour < 19) return 'snacks';
  return 'dinner';
}

function renderResult(analysis) {
  const selectedContext = elements.context?.value || 'auto';
  effectiveCategory = analysis.category === 'unclear' && selectedContext !== 'auto' ? selectedContext : analysis.category;
  elements.category.textContent = categoryLabels[effectiveCategory] || categoryLabels.unclear;
  elements.confidence.textContent = confidenceLabels[analysis.confidence] || confidenceLabels.low;
  elements.observation.textContent = analysis.observation;
  elements.encouragement.textContent = analysis.encouragement;
  elements.question.textContent = analysis.question;
  elements.suggestions.replaceChildren(...analysis.suggestions.map(text => {
    const item = document.createElement('li');
    item.textContent = text;
    return item;
  }));
  elements.caution.textContent = analysis.caution || '';
  elements.caution.hidden = !analysis.caution;

  const isMeal = effectiveCategory === 'meal';
  const isActivity = effectiveCategory === 'workout' || effectiveCategory === 'activity';
  elements.mealWrap.hidden = !isMeal;
  elements.activityWrap.hidden = !isActivity;
  if (isMeal) elements.meal.value = analysis.suggestedMeal || defaultMeal();
  if (isActivity) elements.activity.value = analysis.suggestedActivity || 'outra';
  elements.result.hidden = false;
  elements.result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function analyzePhoto() {
  if (!selectedFile || !elements.consent?.checked || analyzing) return;
  analyzing = true;
  updateAnalyzeState();
  elements.analyze.textContent = 'Analisando com cuidado…';
  setStatus('Preparando a imagem com segurança. Isso pode levar alguns segundos.');
  clearResult();

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 35_000);
  try {
    const imageData = await prepareImage(selectedFile);
    const response = await fetch('/api/visual-checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ imageData, context: elements.context?.value || 'auto' }),
      signal: controller.signal
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.ok) {
      const error = new Error(payload.error || 'Não foi possível analisar esta imagem agora.');
      error.code = payload.code || '';
      throw error;
    }
    currentAnalysis = payload.analysis;
    renderResult(currentAnalysis);
    setStatus('Análise concluída. Revise as sugestões antes de usar no Meu Hoje.', 'success');
  } catch (error) {
    if (error.name === 'AbortError') setStatus('A análise demorou mais que o esperado. Tente novamente.', 'error');
    else if (error.message === 'image_too_large') setStatus('Não foi possível reduzir essa foto. Escolha uma imagem menor.', 'error');
    else if (error.code === 'vision_not_configured') setStatus('A análise visual está pronta na interface, mas ainda precisa ser ativada pelo BeMEsportivo.', 'error');
    else setStatus(error.message || 'Não foi possível analisar esta imagem agora. Tente novamente.', 'error');
  } finally {
    window.clearTimeout(timeout);
    analyzing = false;
    elements.analyze.textContent = 'Analisar minha foto';
    updateAnalyzeState();
  }
}

function appendValue(field, value) {
  if (!field || !value) return;
  const limit = Number(field.maxLength) > 0 ? Number(field.maxLength) : 300;
  const combined = field.value.trim() ? `${field.value.trim()} · ${value}` : value;
  field.value = combined.slice(0, limit);
  field.dispatchEvent(new Event('input', { bubbles: true }));
  field.dispatchEvent(new Event('change', { bubbles: true }));
}

function useInDailyLog() {
  if (!currentAnalysis) return;
  const dailyForm = document.getElementById('fb-daily-form');
  if (!dailyForm) return;
  const appliedCategory = effectiveCategory;
  const appliedMeal = elements.meal?.value || 'snacks';

  const formWrap = document.getElementById('fb-daily-form-wrap');
  if (formWrap?.hidden) document.getElementById('fb-open-daily-form')?.click();
  const optional = document.getElementById('fb-daily-optional');
  if (optional) optional.open = true;

  const answer = elements.answer?.value.trim();
  const confirmedText = answer ? `${currentAnalysis.recordText} Contexto informado: ${answer}.` : currentAnalysis.recordText;
  if (appliedCategory === 'meal') {
    const mealField = dailyForm.elements[appliedMeal];
    appendValue(mealField, confirmedText);
  } else if (appliedCategory === 'workout' || appliedCategory === 'activity') {
    dailyForm.elements.activity.value = elements.activity.value || currentAnalysis.suggestedActivity || 'outra';
    dailyForm.elements.activity.dispatchEvent(new Event('change', { bubbles: true }));
    appendValue(dailyForm.elements.note, confirmedText);
  } else {
    appendValue(dailyForm.elements.note, confirmedText);
  }

  setStatus('Sugestão adicionada. Confira os campos e toque em “Salvar Meu Hoje” quando estiver tudo certo.', 'success');
  clearPhoto({ keepStatus: true });
  window.setTimeout(() => {
    dailyForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const focusTarget = appliedCategory === 'meal'
      ? dailyForm.elements[appliedMeal]
      : appliedCategory === 'workout' || appliedCategory === 'activity'
        ? dailyForm.elements.minutes
        : dailyForm.elements.note;
    focusTarget?.focus({ preventScroll: true });
  }, 180);
}

elements.input?.addEventListener('change', event => handleSelectedFile(event.target.files?.[0]));
elements.consent?.addEventListener('change', updateAnalyzeState);
elements.remove?.addEventListener('click', () => clearPhoto());
elements.analyze?.addEventListener('click', analyzePhoto);
elements.discard?.addEventListener('click', () => clearPhoto());
elements.use?.addEventListener('click', useInDailyLog);
window.addEventListener('pagehide', revokePreview, { once: true });
