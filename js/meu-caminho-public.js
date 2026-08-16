(() => {
  'use strict';

  const PROFILE_KEY = 'meuCaminhoBeProfileV1';
  const CODE_KEY = 'meuCaminhoBeContinuityCodeV1';
  const encoder = new TextEncoder();

  function readProfile() {
    try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null'); } catch { return null; }
  }

  async function hashHex(value) {
    const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
    return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  async function credentials() {
    const code = String(localStorage.getItem(CODE_KEY) || '').replace(/[^a-fA-F0-9]/g, '').toUpperCase();
    if (code.length !== 32) throw new Error('Ative a continuidade protegida antes de publicar.');
    const [id, token] = await Promise.all([
      hashHex(`be-sync-id:${code}`),
      hashHex(`be-sync-auth:${code}`)
    ]);
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

  function setStatus(message, state = '', publicUrl = '') {
    const status = document.getElementById('be-public-profile-status');
    const link = document.getElementById('be-public-profile-link');
    if (status) {
      status.dataset.state = state;
      const text = status.querySelector('p');
      if (text) text.textContent = message;
    }
    if (link) {
      link.hidden = !publicUrl;
      if (publicUrl) link.href = publicUrl;
    }
  }

  async function syncProfile() {
    const profile = readProfile();
    if (!profile?.publicEnabled) {
      if (String(localStorage.getItem(CODE_KEY) || '').replace(/[^a-fA-F0-9]/g, '').length === 32) {
        try { await request('profile', { method: 'DELETE' }); } catch {}
      }
      setStatus('Seu perfil público está desativado. O diário continua somente neste aparelho.', 'private');
      return null;
    }
    setStatus('Enviando seu perfil para análise…', 'loading');
    try {
      const result = await request('publish', { method: 'POST', body: JSON.stringify({ profile: profilePayload(profile) }) });
      setStatus(result.profileStatus === 'approved' ? 'Perfil público ativo.' : 'Perfil enviado. A página aparecerá após a moderação.', result.profileStatus, result.profileStatus === 'approved' ? result.publicUrl : '');
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
        post: {
          clientId: entry.id,
          text: entry.note,
          imageDataUrl: entry.imageDataUrl,
          videoUrl: entry.videoUrl,
          activity: entry.title || entry.type,
          occurredAt: entry.date
        }
      })
    });
    setStatus('Publicação enviada para moderação. Ela continua disponível no seu diário privado.', 'pending', result.profileStatus === 'approved' ? result.publicUrl : '');
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
      if (!result.record) return setStatus('Perfil público ainda não enviado. Salve o perfil para iniciar a moderação.', 'pending');
      const publicUrl = `/perfil-publico?perfil=${result.slug}`;
      setStatus(result.record.profileStatus === 'approved' ? 'Perfil público ativo.' : 'Perfil aguardando moderação.', result.record.profileStatus, result.record.profileStatus === 'approved' ? publicUrl : '');
    } catch (error) {
      setStatus(error.message, 'error');
    }
  }

  window.BePublicProfile = { publishEntry, unpublishEntry, syncProfile, refreshStatus };
  window.addEventListener('meuCaminhoBe:profile-updated', event => {
    if (event.detail?.source === 'cloud') return;
    window.setTimeout(() => syncProfile().catch(() => {}), 80);
  });
  window.addEventListener('DOMContentLoaded', refreshStatus);
})();
