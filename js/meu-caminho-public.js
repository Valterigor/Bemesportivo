(() => {
  'use strict';

  const PROFILE_KEY = 'meuCaminhoBeProfileV1';
  const CODE_KEY = 'meuCaminhoBeContinuityCodeV1';
  const PUBLIC_CODE_KEY = 'meuCaminhoBePublicCodeV1';
  const PUBLIC_TERMS_VERSION = '2026-08-15';
  const encoder = new TextEncoder();
  let registeredIdentity = '';
  let currentPublicRecord = null;
  let currentPublicUrl = '';
  let pendingPublicPhoto = '';

  function readProfile() {
    try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null'); } catch { return null; }
  }

  async function hashHex(value) {
    const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
    return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  async function credentials() {
    const storedPublicCode = String(localStorage.getItem(PUBLIC_CODE_KEY) || '').replace(/[^a-fA-F0-9]/g, '').toUpperCase();
    const continuityCode = String(localStorage.getItem(CODE_KEY) || '').replace(/[^a-fA-F0-9]/g, '').toUpperCase();
    let code = storedPublicCode.length === 32 ? storedPublicCode : continuityCode;
    if (code.length !== 32) {
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      code = [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
    }
    // MantÃ©m a administraÃ§Ã£o da mesma pÃ¡gina mesmo depois de sair da continuidade.
    if (storedPublicCode !== code) localStorage.setItem(PUBLIC_CODE_KEY, code);
    const [id, token] = await Promise.all([
      hashHex(`be-sync-id:${code}`),
      hashHex(`be-sync-auth:${code}`)
    ]);
    if (registeredIdentity !== id) {
      const verifier = await hashHex(`be-sync-verifier:${token}`);
      const response = await fetch('/api/public-profiles/identity', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, verifier })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Não foi possível proteger sua página pública.');
      registeredIdentity = id;
    }
    return { id, token };
  }

  function sportLabel(profile) {
    const labels = { futebol: 'Futebol', futsal: 'Futsal', volei: 'Vôlei', corrida: 'Corrida', ciclismo: 'Ciclismo', natacao: 'Natação', lutas: 'Lutas', musculacao: 'Musculação', outro: 'Outro esporte' };
    const modality = profile?.sportProfile?.modality || 'outro';
    return labels[modality] || 'Outro esporte';
  }

  function profilePayload(profile = readProfile()) {
    return {
      displayName: String(profile?.name || '').trim(),
      age: profile?.publicAge,
      profession: String(profile?.profession || '').trim(),
      favoriteSport: sportLabel(profile),
      bio: String(profile?.story || '').trim(),
      photoDataUrl: String(profile?.photoDataUrl || '')
    };
  }

  function acceptancePayload(profile = readProfile()) {
    return {
      accepted: profile?.publicTermsAccepted === true && profile?.publicTermsVersion === PUBLIC_TERMS_VERSION,
      adultConfirmed: Number(profile?.publicAge) >= 18,
      termsVersion: String(profile?.publicTermsVersion || ''),
      acceptedAt: String(profile?.publicTermsAcceptedAt || '')
    };
  }

  function isPublishedStatus(state) {
    return state === 'published' || state === 'approved';
  }

  function hasPublishingCode() {
    return [CODE_KEY, PUBLIC_CODE_KEY].some(key => String(localStorage.getItem(key) || '').replace(/[^a-fA-F0-9]/g, '').length === 32);
  }

  async function deleteProfile() {
    if (!hasPublishingCode()) return null;
    const result = await request('profile', { method: 'DELETE' });
    registeredIdentity = '';
    return result;
  }

  async function disableProfile() {
    if (!hasPublishingCode()) return null;
    return request('disable', { method: 'POST', body: '{}' });
  }

  async function request(path, options = {}) {
    const auth = await credentials();
    const response = await fetch(`/api/public-profiles/${path}`, {
      ...options,
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-BE-Sync-Id': auth.id,
        'X-BE-Sync-Token': auth.token,
        ...(options.headers || {})
      }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Não foi possível acessar o perfil público agora.');
    return payload;
  }

  function formatPostDate(value) {
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) ? new Date(`${value}T12:00:00`) : new Date(value || Date.now());
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(date);
  }

  function renderPublicManager(record = null, published = false) {
    currentPublicRecord = record;
    const manager = document.getElementById('be-public-manager');
    const mount = document.getElementById('be-public-manage-posts');
    const count = document.getElementById('be-public-manager-count');
    if (manager) manager.hidden = !published;
    if (!mount || !published) return;
    const posts = Array.isArray(record?.posts) ? record.posts : [];
    if (count) count.textContent = `${posts.length} ${posts.length === 1 ? 'publicação' : 'publicações'}`;
    mount.replaceChildren();
    if (!posts.length) {
      const empty = document.createElement('p');
      empty.className = 'be-public-manage-empty';
      empty.textContent = 'Seu diário está no ar. Faça a primeira publicação quando quiser.';
      mount.append(empty);
      return;
    }
    posts.forEach(post => {
      const article = document.createElement('article');
      article.className = 'be-public-manage-post';
      if (post.imageDataUrl) {
        const image = document.createElement('img');
        image.src = post.imageDataUrl;
        image.alt = '';
        article.append(image);
      } else {
        const placeholder = document.createElement('span');
        placeholder.className = 'be-public-manage-post-placeholder';
        placeholder.textContent = 'TEXTO';
        article.append(placeholder);
      }
      const copy = document.createElement('div');
      copy.className = 'be-public-manage-post-copy';
      const text = document.createElement('p');
      text.textContent = post.text || '';
      const meta = document.createElement('small');
      meta.textContent = `${formatPostDate(post.occurredAt)}${post.status === 'hidden' ? ' · Oculta pela fiscalização' : ' · Pública'}`;
      copy.append(text, meta);
      const actions = document.createElement('div');
      actions.className = 'be-public-manage-post-actions';
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.dataset.bePublicEdit = post.clientId;
      edit.textContent = 'Editar';
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.dataset.bePublicRemove = post.clientId;
      remove.textContent = 'Retirar do ar';
      actions.append(edit, remove);
      article.append(copy, actions);
      mount.append(article);
    });
  }

  async function loadPublicManager() {
    const result = await request('mine');
    currentPublicUrl = result.record ? `/diario/${result.slug}` : '';
    renderPublicManager(result.record, Boolean(result.record && isPublishedStatus(result.record.profileStatus)));
    return result;
  }

  function renderComposePhoto() {
    const preview = document.getElementById('be-public-compose-preview');
    const image = document.getElementById('be-public-compose-preview-image');
    const remove = document.getElementById('be-public-compose-photo-remove');
    if (preview) preview.hidden = !pendingPublicPhoto;
    if (image && pendingPublicPhoto) image.src = pendingPublicPhoto;
    if (remove) remove.hidden = !pendingPublicPhoto;
  }

  function openComposer(post = null) {
    const dialog = document.getElementById('be-public-compose-dialog');
    const form = document.getElementById('be-public-compose-form');
    if (!dialog || !form) return;
    form.reset();
    pendingPublicPhoto = String(post?.imageDataUrl || '');
    document.getElementById('be-public-compose-id').value = post?.clientId || '';
    document.getElementById('be-public-compose-text').value = post?.text || '';
    document.getElementById('be-public-compose-title').textContent = post ? 'Editar publicação' : 'Nova publicação';
    document.getElementById('be-public-compose-submit').textContent = post ? 'Salvar alterações' : 'Publicar';
    document.getElementById('be-public-compose-count').textContent = String(post?.text?.length || 0);
    document.getElementById('be-public-compose-feedback').textContent = '';
    renderComposePhoto();
    dialog.showModal();
    window.setTimeout(() => document.getElementById('be-public-compose-text')?.focus(), 40);
  }

  function closeComposer() {
    document.getElementById('be-public-compose-dialog')?.close();
  }

  async function resizePublicPhoto(file) {
    if (!/^image\/(jpeg|png|webp)$/i.test(file?.type || '')) throw new Error('Escolha uma foto JPG, PNG ou WebP.');
    const source = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = reject;
      element.src = source;
    });
    const scale = Math.min(1, 1080 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    let quality = .82;
    let result = canvas.toDataURL('image/jpeg', quality);
    while (result.length > 450000 && quality > .42) {
      quality -= .08;
      result = canvas.toDataURL('image/jpeg', quality);
    }
    if (result.length > 480000) throw new Error('Esta foto ficou muito grande. Escolha uma imagem menor.');
    return result;
  }

  function setStatus(message, state = '', publicUrl = '') {
    const status = document.getElementById('be-public-profile-status');
    const link = document.getElementById('be-public-profile-link');
    const access = document.querySelector('.be-profile-public-access');
    const accessStatus = document.getElementById('be-profile-public-access-status');
    const accessAction = document.getElementById('be-profile-public-access-action');
    if (status) {
      status.dataset.state = state;
      const text = status.querySelector('p');
      if (text) text.textContent = message;
    }
    if (link) {
      link.hidden = !publicUrl;
      if (publicUrl) link.href = publicUrl;
    }
    const published = isPublishedStatus(state) && Boolean(publicUrl);
    if (access) access.dataset.state = published ? 'approved' : state || 'private';
    if (accessStatus) accessStatus.textContent = message;
    if (accessAction) {
      accessAction.dataset.state = published ? 'approved' : state || 'private';
      accessAction.dataset.publicUrl = publicUrl;
      accessAction.textContent = published
        ? 'Visualizar Meu Diário BE'
        : ['pending', 'loading'].includes(state)
          ? 'Publicando…'
          : 'Ativar Meu Diário BE';
    }
    if (!published && !['loading', 'pending'].includes(state)) renderPublicManager(null, false);
  }

  function openPublicSettings() {
    document.getElementById('be-profile-edit')?.click();
    window.setTimeout(() => document.getElementById('be-public-profile-settings-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
  }

  async function syncProfile() {
    const profile = readProfile();
    if (!profile?.publicEnabled) {
      if (hasPublishingCode()) {
        try { await disableProfile(); } catch {}
      }
      setStatus('Seu perfil público está desativado. O diário continua somente neste aparelho.', 'private');
      return null;
    }
    setStatus('Publicando sua página…', 'loading');
    try {
      const result = await request('publish', { method: 'POST', body: JSON.stringify({ profile: profilePayload(profile), acceptance: acceptancePayload(profile) }) });
      const published = isPublishedStatus(result.profileStatus);
      setStatus(published ? 'Seu Diário BE está no ar.' : 'Esta página foi ocultada pela fiscalização.', result.profileStatus, published ? result.publicUrl : '');
      if (published) await loadPublicManager();
      return result;
    } catch (error) {
      setStatus(error.message, 'error');
      throw error;
    }
  }

  async function publishEntry(entry) {
    const profile = readProfile();
    if (!profile?.publicEnabled) throw new Error('Ative o perfil público antes de compartilhar um registro.');
    const result = await request('publish', {
      method: 'POST',
      body: JSON.stringify({
        profile: profilePayload(profile),
        acceptance: acceptancePayload(profile),
        post: {
          clientId: entry.id,
          text: entry.note,
          imageDataUrl: entry.imageDataUrl,
          activity: entry.title || entry.type,
          occurredAt: entry.date
        }
      })
    });
    const published = isPublishedStatus(result.profileStatus);
    setStatus(published ? 'Publicação no ar. Seu link público está pronto para compartilhar.' : 'A publicação foi mantida apenas no diário.', result.profileStatus, published ? result.publicUrl : '');
    if (published) await loadPublicManager();
    return result;
  }

  async function unpublishEntry(entryId) {
    if (!entryId) return null;
    return request(`entries/${encodeURIComponent(entryId)}`, { method: 'DELETE' });
  }

  async function refreshStatus() {
    const profile = readProfile();
    if (!profile?.publicEnabled) return setStatus('Seu perfil público está desativado. O diário continua privado.', 'private');
    try {
      const result = await request('mine');
      if (!result.record) {
        const acceptance = acceptancePayload(profile);
        if (acceptance.accepted && acceptance.adultConfirmed) return syncProfile();
        return setStatus('Salve o perfil e aceite os termos para colocar sua página no ar.', 'private');
      }
      const publicUrl = `/diario/${result.slug}`;
      const published = isPublishedStatus(result.record.profileStatus);
      setStatus(published ? 'Seu Diário BE está no ar.' : 'Página oculta pela fiscalização. Revise as Diretrizes da Comunidade.', result.record.profileStatus, published ? publicUrl : '');
      currentPublicUrl = published ? publicUrl : '';
      renderPublicManager(result.record, published);
    } catch (error) {
      setStatus(error.message, 'error');
    }
  }

  window.BePublicProfile = { publishEntry, unpublishEntry, deleteProfile, disableProfile, syncProfile, refreshStatus };
  document.getElementById('be-profile-public-access-action')?.addEventListener('click', event => {
    const publicUrl = event.currentTarget.dataset.publicUrl || '';
    if (event.currentTarget.dataset.state === 'approved' && publicUrl) {
      window.open(publicUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    openPublicSettings();
  });
  document.getElementById('be-public-new-post')?.addEventListener('click', () => openComposer());
  document.getElementById('be-public-share-owner')?.addEventListener('click', async event => {
    if (!currentPublicUrl) return;
    const button = event.currentTarget;
    const absoluteUrl = new URL(currentPublicUrl, location.origin).href;
    try {
      if (navigator.share) await navigator.share({ title: 'Meu Diário BE', text: 'Conheça meu Diário BE.', url: absoluteUrl });
      else {
        await navigator.clipboard.writeText(absoluteUrl);
        button.textContent = 'Link copiado!';
        window.setTimeout(() => { button.textContent = 'Compartilhar link'; }, 2200);
      }
    } catch (error) {
      if (error?.name !== 'AbortError') window.prompt('Copie o link do seu Diário BE:', absoluteUrl);
    }
  });
  document.getElementById('be-public-compose-text')?.addEventListener('input', event => {
    const count = document.getElementById('be-public-compose-count');
    if (count) count.textContent = String(event.currentTarget.value.length);
  });
  document.getElementById('be-public-compose-photo')?.addEventListener('change', async event => {
    const feedback = document.getElementById('be-public-compose-feedback');
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    if (feedback) feedback.textContent = 'Preparando foto…';
    try {
      pendingPublicPhoto = await resizePublicPhoto(file);
      renderComposePhoto();
      if (feedback) feedback.textContent = '';
    } catch (error) {
      pendingPublicPhoto = '';
      renderComposePhoto();
      if (feedback) feedback.textContent = error.message;
    } finally {
      event.currentTarget.value = '';
    }
  });
  document.getElementById('be-public-compose-photo-remove')?.addEventListener('click', () => {
    pendingPublicPhoto = '';
    renderComposePhoto();
  });
  document.getElementById('be-public-compose-close')?.addEventListener('click', closeComposer);
  document.getElementById('be-public-compose-cancel')?.addEventListener('click', closeComposer);
  document.getElementById('be-public-compose-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const text = document.getElementById('be-public-compose-text')?.value.trim() || '';
    const feedback = document.getElementById('be-public-compose-feedback');
    const submit = document.getElementById('be-public-compose-submit');
    if (text.length < 3) {
      if (feedback) feedback.textContent = 'Escreva ao menos uma frase antes de publicar.';
      document.getElementById('be-public-compose-text')?.focus();
      return;
    }
    const existingId = document.getElementById('be-public-compose-id')?.value || '';
    const previous = currentPublicRecord?.posts?.find(post => post.clientId === existingId);
    const clientId = existingId || `blog-${crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
    if (submit) { submit.disabled = true; submit.textContent = existingId ? 'Salvando…' : 'Publicando…'; }
    try {
      await publishEntry({
        id: clientId,
        note: text,
        imageDataUrl: pendingPublicPhoto,
        title: 'Publicação',
        type: 'publicacao',
        date: previous?.occurredAt || new Date().toISOString().slice(0, 10)
      });
      closeComposer();
    } catch (error) {
      if (feedback) feedback.textContent = error.message;
    } finally {
      if (submit) { submit.disabled = false; submit.textContent = existingId ? 'Salvar alterações' : 'Publicar'; }
    }
  });
  document.getElementById('be-public-manage-posts')?.addEventListener('click', async event => {
    const edit = event.target.closest('[data-be-public-edit]');
    if (edit) {
      const post = currentPublicRecord?.posts?.find(item => item.clientId === edit.dataset.bePublicEdit);
      if (post) openComposer(post);
      return;
    }
    const remove = event.target.closest('[data-be-public-remove]');
    if (!remove || !window.confirm('Retirar esta publicação do Meu Diário BE?')) return;
    remove.disabled = true;
    try {
      await unpublishEntry(remove.dataset.bePublicRemove);
      await loadPublicManager();
      setStatus('A publicação foi retirada do ar.', 'published', currentPublicUrl);
    } catch (error) {
      setStatus(error.message, 'error');
    }
  });
  document.getElementById('be-public-disable')?.addEventListener('click', async () => {
    if (!window.confirm('Desativar o Meu Diário BE? As publicações deixarão de ficar visíveis, mas seu diário privado será mantido.')) return;
    try {
      await disableProfile();
      const profile = readProfile();
      localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...profile, publicEnabled: false, updatedAt: new Date().toISOString() }));
      location.reload();
    } catch (error) {
      setStatus(error.message, 'error');
    }
  });
  window.addEventListener('meuCaminhoBe:profile-updated', event => {
    if (event.detail?.source === 'cloud') return;
    window.setTimeout(() => syncProfile().catch(() => {}), 80);
  });
  window.addEventListener('DOMContentLoaded', refreshStatus);
})();
